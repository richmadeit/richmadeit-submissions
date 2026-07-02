// ============================================================================
//  netlify/functions/generate-reference.js
//  RichMadeIt — free character reference sheet generator  (PATH B: on-page)
// ----------------------------------------------------------------------------
//  Returns the generated sheet to the page (shown inline). Saves the lead to
//  Supabase so you capture every email in your dashboard. No email sending.
//
//  LOCKED DOWN: users can ONLY generate a reference sheet (hardcoded prompt),
//  low quality, email required, up to 3 reference photos, per-IP throttle.
//
//  ENV VARS in Netlify: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
//  NOTE: needs the 26s timeout on Pro (netlify.toml + request activation),
//  since generation can exceed the default 10s.
// ============================================================================

const ipHits = {};
const IP_WINDOW_MS = 60 * 1000;
const IP_MAX = 4;

const REFERENCE_PROMPT =
  "Create a professional character reference sheet based on the person in the " +
  "provided photo(s). Show the SAME person from multiple angles on a clean neutral " +
  "studio background: front view, three-quarter left, three-quarter right, and side " +
  "profile — plus one full-body standing pose. Consistent identity, consistent " +
  "wardrobe, even studio lighting, high detail, cinematic. Arrange as a clean grid " +
  "like a film production character sheet. No text, no watermark.";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Image service not configured." }) };
  }

  const ip = (event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown");
  const now = Date.now();
  ipHits[ip] = (ipHits[ip] || []).filter(t => now - t < IP_WINDOW_MS);
  if (ipHits[ip].length >= IP_MAX) {
    return { statusCode: 429, body: JSON.stringify({ error: "Too many requests — give it a minute." }) };
  }
  ipHits[ip].push(now);

  try {
    const body = JSON.parse(event.body || "{}");
    const { email, images, consent } = body;

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: "A valid email is required." }) };
    }
    if (!consent) {
      return { statusCode: 400, body: JSON.stringify({ error: "Please confirm these are your own photos." }) };
    }
    if (!Array.isArray(images) || images.length < 1) {
      return { statusCode: 400, body: JSON.stringify({ error: "Upload at least one photo." }) };
    }
    const refs = images.slice(0, 2); // up to 2 reference photos for better likeness

    // ---- generate the reference sheet (gpt-image-2 = best quality) ----
    const form = new FormData();
    form.append("model", "gpt-image-2");
    form.append("prompt", REFERENCE_PROMPT);   // HARDCODED
    form.append("quality", "low");             // gpt-image-2 low = fast + still sharp
    form.append("size", "1024x1536");          // tall = proper reference-sheet layout
    form.append("moderation", "low");
    form.append("n", "1");
    for (let i = 0; i < refs.length; i++) {
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(refs[i] || "");
      if (!m) continue;
      const blob = new Blob([Buffer.from(m[2], "base64")], { type: m[1] });
      form.append("image[]", blob, `ref${i}.png`);
    }

    // hard timeout just under the 60s function ceiling — give gpt-image-2
    // the maximum time to finish before we abort with a real error.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    let resp, data;
    try {
      resp = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
        signal: controller.signal,
      });
      data = await resp.json();
    } catch (err) {
      clearTimeout(timer);
      const reason = err && err.name === "AbortError"
        ? "The image took too long to generate. Please try again with one clear photo."
        : "Image service is unavailable right now — try again in a minute.";
      logLead(email, null);
      return { statusCode: 200, body: JSON.stringify({ error: reason }) };
    }
    clearTimeout(timer);

    if (!resp.ok) {
      const msg = (data && data.error && data.error.message) ? data.error.message : "";
      // surface the REAL OpenAI error so we can diagnose (verification, billing, etc.)
      console.log("OpenAI error:", resp.status, JSON.stringify(data));
      const friendly = /safety|policy|content|person|face|moderation/i.test(msg)
        ? "That photo couldn't be used — try a clear, well-lit photo of yourself."
        : ("Couldn't generate that one — " + (msg || "try a different photo."));
      logLead(email, null);
      return { statusCode: 200, body: JSON.stringify({ error: friendly }) };
    }

    const b64 = data && data.data && data.data[0] && data.data[0].b64_json;
    if (!b64) return { statusCode: 200, body: JSON.stringify({ error: "No image came back — try again." }) };
    const imageDataUrl = `data:image/png;base64,${b64}`;

    // ---- save sheet to Supabase storage + log the lead (non-fatal) ----
    let publicImageUrl = null;
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const path = `sheets/${Date.now()}_${Math.random().toString(36).slice(2,8)}.png`;
        const up = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/orders/${path}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, "Content-Type": "image/png" },
          body: Buffer.from(b64, "base64"),
        });
        if (up.ok) publicImageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/orders/${path}`;
      }
    } catch (e) {}
    await logLead(email, publicImageUrl);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: imageDataUrl }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Something glitched — try again." }) };
  }
};

// save a lead row to Supabase (best-effort)
async function logLead(email, imageUrl) {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      await fetch(`${process.env.SUPABASE_URL}/rest/v1/reference_generations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          "apikey": process.env.SUPABASE_SERVICE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          email, image_url: imageUrl, purchased: false, follow_up_stage: 0,
          created_at: new Date().toISOString(),
        }),
      });
    }
  } catch (e) {}
}
