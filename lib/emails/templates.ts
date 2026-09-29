export interface EmailTemplatePayload {
  name?: string;
  credits?: number;
  packName?: string;
  planName?: string;
  monthlyCredits?: number;
  month?: string;
  portalUrl?: string;
  renewalDate?: string;
  businessType?: string;
  city?: string;
  totalFound?: number;
  gapCount?: number;
  topBusinessName?: string;
  topScore?: number;
}

export function getEmailTemplate(
  type: string,
  payload: EmailTemplatePayload
): { subject: string; html: string } {
  switch (type) {
    case "welcome":
      return {
        subject: "Welcome to LeadScout 🎯",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5; color: #1f2937;">
            <h1 style="color: #2563eb;">Welcome to LeadScout, ${payload.name || "friend"}!</h1>
            <p>You have <strong>20 free credits</strong> loaded into your wallet.</p>
            <p>Here is what you can do right now:</p>
            <ul>
              <li>Run your first targeted client search</li>
              <li>Scan local businesses for critical marketing gaps</li>
              <li>Instantly generate copy-paste outreach pitches</li>
            </ul>
            <p><a href="https://leadscout.io/search" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">Find My First Client →</a></p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 12px;">Questions? Contact official support at <a href="mailto:officalleadscout@gmail.com">officalleadscout@gmail.com</a></p>
          </div>
        `,
      };

    case "search_complete":
      return {
        subject: `Your search found ${payload.totalFound || "new"} clients — LeadScout`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5; color: #1f2937;">
            <h2>Search Complete!</h2>
            <p>Your search for <strong>${payload.businessType || "businesses"}</strong> in <strong>${payload.city || "your target city"}</strong> is done.</p>
            <p>Results summary:</p>
            <ul>
              <li>${payload.totalFound || 0} businesses scanned</li>
              <li>${payload.gapCount || 0} with actionable opportunity gaps</li>
              <li>Top lead: <strong>${payload.topBusinessName || "Lead"}</strong> (Score ${payload.topScore || 90}/100)</li>
            </ul>
            <p><a href="https://leadscout.io/leads" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">View Your Leads →</a></p>
          </div>
        `,
      };

    case "low_credits":
      return {
        subject: `Running low — ${payload.credits || 10} credits left`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5; color: #1f2937;">
            <h2>Credit Balance Alert</h2>
            <p>You have <strong>${payload.credits || 10} credits</strong> remaining in your LeadScout wallet.</p>
            <p>Top up to keep finding clients:</p>
            <p><a href="https://leadscout.io/credits" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">Buy Credits & Plans →</a></p>
          </div>
        `,
      };

    case "credits_purchased":
      return {
        subject: `${payload.credits || 100} credits added to your account`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5; color: #1f2937;">
            <h2>Payment Confirmed!</h2>
            <p>We've added <strong>${payload.credits} credits</strong> to your account (${payload.packName || "Credit Pack"}).</p>
            <p><a href="https://leadscout.io/search" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">Start Searching →</a></p>
          </div>
        `,
      };

    case "subscription_activated":
      return {
        subject: `Welcome to ${payload.planName || "Subscription"} — ${payload.monthlyCredits || 300} credits ready 🎉`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5; color: #1f2937;">
            <h2>Subscription Active!</h2>
            <p>Your <strong>${payload.planName}</strong> plan is live with <strong>${payload.monthlyCredits} monthly credits</strong>.</p>
            <p><a href="https://leadscout.io/search" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">Start Finding Clients →</a></p>
          </div>
        `,
      };

    case "payment_failed":
      return {
        subject: "Action needed — payment failed",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.5; color: #1f2937;">
            <h2 style="color: #dc2626;">Payment Failed</h2>
            <p>We could not process your subscription payment. Your account has a 3-day grace period.</p>
            <p><a href="${payload.portalUrl || "https://leadscout.io/credits"}" style="display: inline-block; padding: 10px 20px; background: #dc2626; color: #ffffff; text-decoration: none; border-radius: 8px;">Update Payment Method →</a></p>
          </div>
        `,
      };

    default:
      return {
        subject: "Notification from LeadScout",
        html: `<p>You have a new update in LeadScout.</p>`,
      };
  }
}
