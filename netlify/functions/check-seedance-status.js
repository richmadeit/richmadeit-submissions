// ============================================================================
//  netlify/functions/check-seedance-status.js
//  RichMadeIt — polls Atlas Cloud for a Seedance video job's status
// ----------------------------------------------------------------------------
//  Call this every 3-5 seconds from the frontend with the prediction_id
//  returned by generate-seedance-video.js, until status === "completed".
//
//  GET /.netlify/functions/check-seedance-status?id=PREDICTION_ID
// ============================================================================

const ATLAS_POLL_URL = "https://api.atlascloud.ai/api/v1/model/prediction";

exports.handler = async (event) => {
  try {
    const apiKey = process.env.ATLASCLOUD_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Video service not configured." }),
      };
    }

    const predictionId = event.queryStringParameters?.id;
    if (!predictionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing prediction id." }),
      };
    }

    const resp = await fetch(`${ATLAS_POLL_URL}/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Atlas Cloud poll returned non-JSON:", text.slice(0, 300));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Couldn't check video status — try again." }),
      };
    }

    if (!resp.ok) {
      console.error("Atlas Cloud poll error", resp.status, JSON.stringify(data).slice(0, 500));
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Couldn't check video status — try again." }),
      };
    }

    // Normalize whatever shape Atlas Cloud returns into a simple contract
    // for the frontend. Adjust field names below if your dashboard docs
    // show different keys (check one real response in the browser Network
    // tab and tweak `rawStatus`, `videoUrl`, `errorMsg` below if needed).
    const rawStatus = (data?.status || data?.data?.status || "").toLowerCase();
    const videoUrl =
      data?.video?.url || data?.data?.video?.url || data?.output?.video_url || null;
    const errorMsg = data?.error || data?.data?.error || null;

    let status = "processing";
    if (["completed", "succeeded", "success"].includes(rawStatus)) status = "completed";
    else if (["failed", "error"].includes(rawStatus)) status = "failed";

    return {
      statusCode: 200,
      body: JSON.stringify({
        status,
        video_url: status === "completed" ? videoUrl : null,
        error: status === "failed" ? errorMsg || "Generation failed." : null,
      }),
    };
  } catch (err) {
    console.error("Fatal error in check-seedance-status:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Something went wrong. Try again." }),
    };
  }
};
