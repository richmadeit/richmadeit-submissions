// TEST FUNCTION — isolates Gmail sending. Returns the REAL error to the page.
// Deploy to netlify/functions/ , then visit:
//   https://richmadeit.netlify.app/.netlify/functions/netlify-test-email?to=YOUR@email.com
const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  const to = (event.queryStringParameters && event.queryStringParameters.to) || process.env.GMAIL_USER;
  const report = { step: "start", gmailUser: process.env.GMAIL_USER ? "SET" : "MISSING", gmailPass: process.env.GMAIL_APP_PASSWORD ? "SET" : "MISSING" };
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      report.step = "missing-creds";
      return { statusCode: 200, body: JSON.stringify(report, null, 2) };
    }
    report.step = "creating-transport";
    const t = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    report.step = "verifying-login";
    await t.verify();
    report.step = "sending";
    await t.sendMail({
      from: `RichMadeIt <${process.env.GMAIL_USER}>`,
      to,
      subject: "RichMadeIt test email ✅",
      html: "<h2>It works! 🔥</h2><p>Your Gmail sending is set up correctly.</p>",
    });
    report.step = "SUCCESS";
    report.sentTo = to;
    return { statusCode: 200, body: JSON.stringify(report, null, 2) };
  } catch (e) {
    report.step = "ERROR";
    report.errorName = e.name;
    report.errorMessage = e.message;
    report.errorCode = e.code;
    report.responseCode = e.responseCode;
    return { statusCode: 200, body: JSON.stringify(report, null, 2) };
  }
};
