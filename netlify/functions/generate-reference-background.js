// ============================================================================
//  netlify/functions/generate-reference-background.js
//  RichMadeIt — character reference sheet generator (BACKGROUND + GMAIL EMAIL)
// ----------------------------------------------------------------------------
//  Background function: up to 15 min runtime, so gpt-image-2 HIGH quality works.
//  Delivers the sheet by EMAIL via Gmail SMTP (nodemailer). No domain needed.
//  Saves every lead to Supabase (reference_generations) for the dashboard.
//
//  ENV VARS in Netlify:
//    OPENAI_API_KEY
//    GMAIL_USER            e.g. rich.madeit1@gmail.com
//    GMAIL_APP_PASSWORD    the 16-char app password (no spaces)
//    SUPABASE_URL
//    SUPABASE_SERVICE_KEY
//    STRIPE_LINK_50        (optional) defaults below
// ============================================================================

const nodemailer = require("nodemailer");

const STRIPE_LINK = process.env.STRIPE_LINK_50 || "https://buy.stripe.com/cNicN52fz7c2b6Q3MxbMQ08";

const REFERENCE_PROMPT =
  "Create a professional character reference sheet based on the person in the " +
  "provided photo(s). Show the SAME person from multiple angles on a clean neutral " +
  "studio background: front view, three-quarter left, three-quarter right, and side " +
  "profile — plus one full-body standing pose. Consistent identity, consistent " +
  "wardrobe, even studio lighting, high detail, cinematic. Arrange as a clean grid " +
  "like a film production character sheet. No text, no watermark.";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let email = "";
  try {
    const body = JSON.parse(event.body || "{}");
    email = (body.email || "").trim();
    const images = body.images;
    const consent = body.consent;

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { statusCode: 200, body: "bad email" };
    if (!consent) return { statusCode: 200, body: "no consent" };
    if (!Array.isArray(images) || images.length < 1) return { statusCode: 200, body: "no images" };

    if (!process.env.OPENAI_API_KEY) { await emailFail(email, "service not configured"); return { statusCode: 200, body: "no key" }; }

    const refs = images.slice(0, 2);

    // ---- generate the reference sheet: gpt-image-2 HIGH (background = no timeout) ----
    const form = new FormData();
    form.append("model", "gpt-image-2");
    form.append("prompt", REFERENCE_PROMPT);
    form.append("quality", "high");
    form.append("size", "1024x1536");
    form.append("moderation", "low");
    form.append("n", "1");
    for (let i = 0; i < refs.length; i++) {
      const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(refs[i] || "");
      if (!m) continue;
      const blob = new Blob([Buffer.from(m[2], "base64")], { type: m[1] });
      form.append("image[]", blob, `ref${i}.png`);
    }

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    const data = await resp.json();

    if (!resp.ok) {
      console.log("OpenAI error:", resp.status, JSON.stringify(data));
      const omsg = (data && data.error && data.error.message) ? data.error.message : ("status " + resp.status);
      await emailFail(email, "that photo couldn't be used");
      await debugPing("OPENAI FAILED: " + omsg);
      await logLead(email, null);
      return { statusCode: 200, body: "openai error" };
    }

    const b64 = data && data.data && data.data[0] && data.data[0].b64_json;
    if (!b64) { await emailFail(email, "no image came back"); await debugPing("NO B64 RETURNED"); await logLead(email, null); return { statusCode: 200, body: "no b64" }; }
    const pngBuffer = Buffer.from(b64, "base64");

    // ---- upload sheet to Supabase storage (so dashboard can show it) ----
    let publicImageUrl = null;
    let supaMsg = "skipped (no env)";
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const path = `sheets/${Date.now()}_${Math.random().toString(36).slice(2,8)}.png`;
        const up = await fetch(`${process.env.SUPABASE_URL}/storage/v1/object/orders/${path}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, "Content-Type": "image/png" },
          body: pngBuffer,
        });
        if (up.ok) { publicImageUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/orders/${path}`; supaMsg = "uploaded OK"; }
        else { supaMsg = "upload failed: " + up.status + " " + (await up.text()).slice(0,120); }
      }
    } catch (e) { supaMsg = "upload threw: " + e.message; }

    // ---- email the sheet + offer via Gmail ----
    let emailMsg = "ok";
    try {
      await emailSheet(email, pngBuffer, publicImageUrl);
    } catch (e) {
      emailMsg = "SEND FAILED: " + e.message;
      await debugPing("EMAIL SEND FAILED: " + e.message + " | supabase: " + supaMsg);
    }

    // ---- log the lead ----
    await logLead(email, publicImageUrl);

    await debugPing("DONE. supabase=[" + supaMsg + "] email=[" + emailMsg + "] to=" + email);
    return { statusCode: 200, body: "ok" };
  } catch (e) {
    console.log("fatal:", e.message);
    await debugPing("FATAL: " + e.message);
    if (email) { try { await emailFail(email, "something glitched"); } catch(_) {} }
    return { statusCode: 200, body: "error" };
  }
};

// ---- debug ping: emails Rich a status line so we can see what happened ----
async function debugPing(msg) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
    await transport().sendMail({
      from: `RichMadeIt Debug <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: "🔧 RichMadeIt debug",
      text: msg,
    });
  } catch (e) {}
}

// ---- Gmail transporter ----
function transport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

// ---- success email: sheet attached/inline + offer + all contacts ----
async function emailSheet(to, pngBuffer, publicUrl) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) { console.log("no gmail creds"); return; }
  const imgSrc = "cid:sheet@richmadeit";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111;">
      <h1 style="font-size:24px;margin-bottom:6px;">Your Character Is Ready 🔥</h1>
      <p style="color:#444;">Here's the character reference sheet you just built on RichMadeIt.</p>
      <img src="${imgSrc}" alt="Your character reference sheet" style="width:100%;border-radius:14px;margin:12px 0;">
      <div style="background:#0d0d0d;border-radius:14px;padding:22px;color:#fff;margin:20px 0;">
        <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#FFB300;font-weight:bold;">The Offer</div>
        <div style="font-size:22px;font-weight:bold;margin:6px 0;">30-Second Cinematic Video — $50</div>
        <div style="color:#bbb;font-size:14px;">Your character, turned into a scroll-stopping AI music video. Directed personally by Rich. Delivered in <b style="color:#fff;">1–24 hours.</b></div>
        <a href="${STRIPE_LINK}" style="background:linear-gradient(135deg,#FF5500,#FFB300);color:#fff;text-decoration:none;padding:15px 28px;border-radius:10px;font-weight:bold;display:inline-block;margin-top:16px;font-size:16px;">Get My 30-Sec Video — $50 →</a>
      </div>
      <p style="color:#444;font-size:15px;"><b>Want something longer, a full-length video, or custom work?</b> Message me directly:</p>
      <ul style="list-style:none;padding:0;color:#111;font-size:15px;line-height:2;">
        <li>📸 Instagram: <a href="https://instagram.com/rich_madeit_" style="color:#FF5500;">@rich_madeit_</a></li>
        <li>💬 WhatsApp: <a href="https://wa.me/13464981235" style="color:#FF5500;">+1 346-498-1235</a></li>
        <li>📘 Facebook: <a href="https://www.facebook.com/richmadeit1" style="color:#FF5500;">RichMadeIt</a></li>
        <li>🎵 TikTok: <a href="https://www.tiktok.com/@clipzbyrich" style="color:#FF5500;">@clipzbyrich</a></li>
        <li>✉️ Email: <a href="mailto:rich.madeit3@gmail.com" style="color:#FF5500;">rich.madeit3@gmail.com</a></li>
      </ul>
      <p style="color:#888;font-size:13px;margin-top:20px;">Not ready yet? Your character's saved and this link works whenever you are. 🎬<br>— Rich, RichMadeIt</p>
    </div>`;
  const mail = {
    from: `RichMadeIt <${process.env.GMAIL_USER}>`,
    to, subject: "Your Character Is Ready 🔥 — RichMadeIt",
    html,
    attachments: [
      { filename: "character-sheet.png", content: pngBuffer, cid: "sheet@richmadeit" }
    ],
  };
  await transport().sendMail(mail);
}

// ---- failure email: friendly retry, keeps the lead warm ----
async function emailFail(to, reason) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#111;">
      <h1 style="font-size:22px;">Almost there 🔥</h1>
      <p>${reason ? reason.charAt(0).toUpperCase()+reason.slice(1)+"." : ""} Head back to RichMadeIt and upload a clear, well-lit photo of yourself and we'll build your character.</p>
      <p style="margin:22px 0;"><a href="https://richmadeit.netlify.app/#signup" style="background:#FF5500;color:#fff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:bold;display:inline-block;">Try Again →</a></p>
      <p style="color:#888;font-size:13px;">— Rich, RichMadeIt</p>
    </div>`;
  await transport().sendMail({
    from: `RichMadeIt <${process.env.GMAIL_USER}>`,
    to, subject: "Let's try that character again — RichMadeIt", html,
  });
}

// ---- log lead to Supabase ----
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
        body: JSON.stringify({ email, image_url: imageUrl, purchased: false, follow_up_stage: 0, created_at: new Date().toISOString() }),
      });
    }
  } catch (e) { console.log("logLead err", e.message); }
}
