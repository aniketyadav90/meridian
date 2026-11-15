"use server";

import { Resend } from "resend";

export async function sendEmail({ to, subject, react }) {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    console.error("RESEND_API_KEY environment variable is not defined.");
    return { success: false, error: "Missing Resend API Key. Please set RESEND_API_KEY in .env" };
  }

  const resend = new Resend(apiKey);
  // Default to your Resend account email for testing domain (onboarding@resend.dev)
  const recipient = (
    process.env.RESEND_OVERRIDE_TO ||
    "aniket.r.yadav@sirtce.in"
  ).trim();

  if (!recipient) {
    console.error("No recipient email address provided.");
    return { success: false, error: "Missing recipient email address" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "Meridian <onboarding@resend.dev>",
      to: recipient,
      subject,
      react,
    });

    if (error) {
      console.error("Resend API Error:", error);
      const errorMsg =
        error.message ||
        (typeof error === "string" ? error : JSON.stringify(error));
      return { success: false, error: errorMsg };
    }

    console.log(`[Resend] Successfully dispatched email to ${recipient}. Email ID: ${data?.id}`);
    return { success: true, data, recipient };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}
