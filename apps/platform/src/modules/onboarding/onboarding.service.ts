import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Task, PingbackContext } from "@usepingback/nestjs";
import { Resend } from "resend";

@Injectable()
export class OnboardingService {
  private resend: Resend;
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>("resend.apiKey");
    this.resend = new Resend(apiKey);
  }

  @Task("send-onboarding-email", { retries: 3, timeout: "30s" })
  async sendOnboardingEmail(
    ctx: PingbackContext,
    payload: { email: string; name?: string },
  ) {
    const { email, name } = payload;
    const displayName = name || email.split("@")[0];

    ctx.log(`Sending onboarding email to ${email}`);

    await this.resend.emails.send({
      from: "Pingback <hello@pingback.lol>",
      to: email,
      subject: "Welcome to Pingback",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Welcome to Pingback, ${displayName}</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            You're all set to run reliable cron jobs and background tasks from your codebase.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">Here's how to get started:</p>
          <ol style="font-size: 15px; line-height: 1.8; color: #374151; padding-left: 20px;">
            <li>Create a project and grab your API key</li>
            <li>Install the SDK: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">npm install @usepingback/next</code></li>
            <li>Define your first cron job or background task</li>
            <li>Deploy and watch it run in your dashboard</li>
          </ol>
          <a href="https://pingback.lol/docs/getting-started"
             style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #e8b44a; color: #2a1f0a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Read the docs
          </a>
          <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">
            If you have any questions, just reply to this email.
          </p>
        </div>
      `,
    });

    ctx.log(`Onboarding email sent to ${email}`);
    return { sent: true, email };
  }
}
