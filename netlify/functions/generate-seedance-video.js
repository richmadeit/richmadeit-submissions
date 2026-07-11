// ============================================================================
//  netlify/functions/generate-seedance-video.js
//  RichMadeIt — starts a Seedance 2.0 video generation job via Atlas Cloud
// ----------------------------------------------------------------------------
//  Video generation takes 1-5+ minutes, so this function only STARTS the job
//  and immediately returns a prediction_id. The frontend polls a separate
//  function (check-seedance-status.js) every few seconds until it's done.
//
//  Requires an Atlas Cloud API key set as an env var in Netlify:
//    ATLASCLOUD_API_KEY = your key from atlascloud.ai
//
//  Sign up / get a key: https://www.atlascloud.ai
// ============================================================================

const ATLAS_URL = "https://api.atlascloud.ai/api/v1/model/generateVideo";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const apiKey = process.env.ATLASCLOUD_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Video service not configured." }),
      };
    }

    const body = JSON.parse(event.body || "{}");

    // ----- required inputs -----
    const prompt = (body.prompt || "").trim();
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "A prompt describing the video is required." }),
      };
    }

    // ----- optional inputs with sensible defaults for ToonClipz's use case -----
    // mode: "text" (text-to-video), "image" (image-to-video), or "reference"
    //       (reference-to-video — feed in the original clip + a style image)
    const mode = body.mode || "reference";
    const modelMap = {
      text: "bytedance/seedance-2.0/text-to-video",
      image: "bytedance/seedance-2.0/image-to-video",
      reference: "bytedance/seedance-2.0/reference-to-video",
    };
    const model = modelMap[mode] || modelMap.reference;

    const tier = body.tier === "standard" ? "" : "-fast"; // default to Fast (cheaper)
    // Atlas Cloud selects Fast vs Standard via the model id in some setups;
    // if their API instead uses a separate "tier" field, swap this line for:
    //   const requestTier = body.tier === "standard" ? "standard" : "fast";
    // and include it in the payload below. Check your Atlas Cloud dashboard
    // docs for the exact param name if this doesn't match on first test.

    const payload = {
      model,
      prompt,
      duration: body.duration || 15,          // seconds, 4-15 for Seedance 2.0
      resolution: body.resolution || "720p",   // 480p | 720p | 1080p
      ratio: body.ratio || "adaptive",
      generate_audio: body.generate_audio !== false,
      watermark: false,
      return_last_frame: false,
    };

    // reference-to-video: pass through the original clip + any style/character images
    if (mode === "reference") {
      if (Array.isArray(body.video_urls)) payload.video_urls = body.video_urls;
      if (Array.isArray(body.image_urls)) payload.image_urls = body.image_urls;
      if (Array.isArray(body.audio_urls)) payload.audio_urls = body.audio_urls;
    }
    // image-to-video: pass through a single starting image
    if (mode === "image" && body.image_url) {
      payload.image_url = body.image_url;
    }

    const resp = await fetch(ATLAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Atlas Cloud returned non-JSON:", text.slice(0, 300));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Video generator hiccuped — try again." }),
      };
    }

    if (!resp.ok) {
      console.error("Atlas Cloud error", resp.status, JSON.stringify(data).slice(0, 500));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Video generator hiccuped — try again." }),
      };
    }

    const predictionId = data?.data?.id || data?.id;
    if (!predictionId) {
      console.error("No prediction id in response:", JSON.stringify(data).slice(0, 500));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Video generator hiccuped — try again." }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ prediction_id: predictionId, status: "processing" }),
    };
  } catch (err) {
    console.error("Fatal error in generate-seedance-video:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong. Try again." }),
    };
  }
};
