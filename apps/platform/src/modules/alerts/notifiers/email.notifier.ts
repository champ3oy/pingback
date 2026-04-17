import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailNotifier {
  private resend: Resend;
  private dashboardUrl: string;
  private readonly logger = new Logger(EmailNotifier.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('resend.apiKey');
    this.resend = new Resend(apiKey);
    this.dashboardUrl = this.config.get<string>('dashboardUrl') ?? '';
  }

  async send(params: {
    to: string;
    jobName: string;
    projectName: string;
    errorMessage: string;
    attempt: number;
    executionId: string;
    projectId: string;
  }) {
    try {
      await this.resend.emails.send({
        from: 'Pingback <alerts@pingback.dev>',
        to: params.to,
        subject: `[Pingback] Job "${params.jobName}" failed`,
        html: `
          <h2>Job Failure Alert</h2>
          <p><strong>Job:</strong> ${params.jobName}</p>
          <p><strong>Project:</strong> ${params.projectName}</p>
          <p><strong>Error:</strong> ${params.errorMessage}</p>
          <p><strong>Attempt:</strong> ${params.attempt}</p>
          <p><a href="${this.dashboardUrl}/projects/${params.projectId}/executions/${params.executionId}">View Execution</a></p>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send alert email: ${(err as Error).message}`);
    }
  }
}
