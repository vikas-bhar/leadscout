import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export function getFromEmail(): string {
  return process.env.FROM_EMAIL ?? "noreply@freelancefind.com";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.log("sendEmail error", error);
    }
  } catch (error) {
    console.log("sendEmail exception", error);
  }
}
