// ============================================================================
//  netlify/functions/generate-reference.js
//  RichMadeIt — character reference sheet generator (ON-PAGE, SYNCHRONOUS)
// ----------------------------------------------------------------------------
//  Uses Google Nano Banana (gemini-3.1-flash-image) via the native
//  generateContent endpoint. Reference-based edit = character consistency from
//  the uploaded photo(s). Returns the finished sheet as base64 so the page can
//  show it INSTANTLY. No email, no nodemailer, no background function.
//
//  Fits inside Netlify's ~26s sync limit.
//
//  ENV VARS in Netlify:
//    GEMINI_API_KEY            (from Google AI Studio)
//    SUPABASE_URL              (optional — for saving leads to dashboard)
//    SUPABASE_SERVICE_KEY      (optional)
// ============================================================================

const MODEL = "gemini-3.1-flash-lite-image";
const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/" +
  MODEL +
  ":generateContent";

// ---------------------------------------------------------------------------
//  SCENE PRESETS — one tuned prompt per vibe button. The customer taps one;
//  we own the quality. The person's face/identity is locked from their photo.
// ---------------------------------------------------------------------------
const FACE_LOCK =
  "Using the person in the provided photo(s), keep their exact face, features, " +
  "skin tone, and likeness perfectly accurate and recognizable. Photorealistic, " +
  "cinematic lighting, sharp focus, high detail, professional music-video still. " +
  "Vertical 9:16 composition. No text, no watermark, no logos. ";

const SCENES = {
  rooftop:
    "Place them on a city rooftop at night, glowing skyline and neon lights " +
    "behind them, moody cinematic color grade, confident pose, film-grain.",
  luxury:
    "Place them in a luxury lifestyle scene: exotic car, designer fashion, " +
    "night city backdrop, rich warm lighting, flexing wealth, magazine-quality.",
  stage:
    "Place them on stage performing at a concert, spotlights and haze, crowd " +
    "and phone lights in the background, energetic, dramatic stage lighting.",
  street:
    "Place them on a gritty urban street at night, wet pavement reflections, " +
    "moody film-grain, streetwear, cinematic teal-and-orange grade, hard shadows.",
  miami:
    "Place them in a Miami vibe: palm trees, pastel sunset sky, waterfront, " +
    "designer summer fashion, warm golden-hour glow, vibrant and glossy.",
  boss:
    "Place them in a powerful boss scene: dramatic dark backdrop, throne-like " +
    "chair or executive setting, cinematic rim lighting, commanding presence.",
};

// ---------------------------------------------------------------------------
//  TOON STYLES — used by the ToonClipz free-preview tool. Unlike SCENES
//  above (which stay photorealistic), these fully redraw the person as an
//  animated cartoon character while locking their identity.
// ---------------------------------------------------------------------------
const TOON_LOCK =
  "Using the person in the provided photo(s), keep their exact face shape, " +
  "hairstyle, skin tone, and identity clearly recognizable — but fully " +
  "redrawn as an animated cartoon character, NOT photorealistic. Preserve " +
  "their pose, expression, and framing from the original photo, and keep " +
  "their original background setting, redrawn in the same cartoon style. " +
  "Vertical 9:16 composition. No text, no watermark, no logos. ";

const STYLES = {
  familyguy:
    "Adult-animation cartoon style, like Family Guy or American Dad — thick " +
    "clean black linework, flat cel-shaded coloring, slightly exaggerated " +
    "facial features and proportions, simple flat shading, unmistakably a " +
    "TV cartoon character.",
  cutout:
    "South Park–style construction-paper cutout animation — flat simple " +
    "geometric shapes, thick bold outlines, minimal flat shading, blocky " +
    "proportions, deadpan cutout-puppet look.",
  sketchy:
    "Loose hand-drawn sketchy toon style — visible rough ink linework, " +
    "scribbly cross-hatched shading, wobbly imperfect lines, indie-comic " +
    "energy, muted flat color fills, sketchbook feel.",
  anime:
    "Modern anime character style — large expressive anime eyes, clean " +
    "cel-shaded coloring, stylized anime hair rendering with sharp " +
    "highlights, crisp linework, vibrant anime color palette.",
  pixar:
    "3D-animated character style, like Pixar or DreamWorks — soft rounded " +
    "3D-rendered features, smooth subsurface-scattered skin shading, big " +
    "expressive eyes, cinematic 3D lighting, animated-movie still quality.",
};

function buildPrompt(scene, style, detail) {
  let p;
  if (style && STYLES[style]) {
    p = TOON_LOCK + STYLES[style];
  } else {
    p = FACE_LOCK + (SCENES[scene] || SCENES.rooftop);
  }
  if (detail && detail.trim()) {
    p += " Additional details requested: " + detail.trim().slice(0, 200) + ".";
  }
  return p;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const body = JSON.parse(event.body || "{}");
    const email = (body.email || "").trim();
    const images = body.images; // array of data URLs
    const consent = body.consent;
    const scene = (body.scene || "rooftop").trim();
    const style = (body.style || "").trim();
    const detail = (body.detail || "").trim();

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return json(400, { error: "Please enter a valid email." });
    if (!consent)
      return json(400, { error: "Please confirm these are your own photos." });
    if (!Array.isArray(images) || images.length < 1)
      return json(400, { error: "Please upload at least one photo." });
    if (!process.env.GEMINI_API_KEY)
      return json(500, { error: "Image service not configured." });

    // ---- build the parts: scene prompt + each uploaded photo as inlineData ----
    const parts = [{ text: buildPrompt(scene, style, detail) }];
    for (const dataUrl of images.slice(0, 3)) {
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
      if (!m) continue;
      parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
    }
    if (parts.length < 2)
      return json(400, { error: "Couldn't read that photo — try another." });


    // ---- call Nano Banana ----
    const resp = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          imageConfig: { aspectRatio: "9:16" },
        },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      console.error("Gemini error", resp.status, t.slice(0, 500));
      return json(502, {
        error: "The generator hiccuped — please try again in a moment.",
      });
    }

    const data = await resp.json();

    // ---- pull the image bytes out of the response parts ----
    let b64 = null;
    let outMime = "image/png";
    const outParts =
      (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts) ||
      [];
    for (const p of outParts) {
      if (p.inlineData && p.inlineData.data) {
        b64 = p.inlineData.data;
        outMime = p.inlineData.mimeType || outMime;
        break;
      }
    }

    if (!b64) {
      console.error("No image in response", JSON.stringify(data).slice(0, 500));
      return json(502, {
        error: "No image came back — please try again.",
      });
    }

    const dataUrl = "data:" + outMime + ";base64," + b64;

    // ---- best-effort: save the lead to Supabase for the dashboard ----
    // Never let this break the response — wrap in its own try/catch.
    saveLead(email, dataUrl).catch(() => {});

    return json(200, { image: dataUrl });
  } catch (e) {
    console.error("Fatal", e && e.message);
    return json(500, { error: "Something glitched — please try again." });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

// Fire-and-forget lead save. Optional; only runs if Supabase env vars exist.
async function saveLead(email, imageDataUrl) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return;
  try {
    await fetch(url + "/rest/v1/reference_generations", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      // store a short marker rather than the whole megabyte image
      body: JSON.stringify({
        email,
        image_url: "on-page-generated",
        purchased: false,
      }),
    });
  } catch (e) {
    /* ignore — lead saving must never break delivery */
  }
}
