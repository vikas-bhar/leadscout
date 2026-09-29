import { sendEmail as resendSendEmail } from "@/lib/resend";
import { getEmailTemplate, type EmailTemplatePayload } from "./templates";
import { createSupabaseServiceClient } from "@/lib/supabase";

export async function sendNotificationEmail(
  userIdOrEmail: string,
  templateType: string,
  payload: EmailTemplatePayload
): Promise<boolean> {
  let recipientEmail = userIdOrEmail;

  if (!userIdOrEmail.includes("@")) {
    const supabase = createSupabaseServiceClient();
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userIdOrEmail)
      .single();

    if (user?.email) {
      recipientEmail = user.email;
    }
  }

  if (!recipientEmail || !recipientEmail.includes("@")) {
    return false;
  }

  const { subject, html } = getEmailTemplate(templateType, payload);

  try {
    await resendSendEmail({
      to: recipientEmail,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("sendNotificationEmail error:", error);
    return false;
  }
}
