import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private subscriptionService: SubscriptionService) {}

  @Post('polar')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleWebhook(@Body() payload: any) {
    const type = payload.type;
    const data = payload.data;

    this.logger.log(`Received Polar webhook: ${type}`);

    const externalId = data?.customer?.externalId;
    if (!externalId) {
      this.logger.warn(`Webhook ${type}: no externalId on customer, skipping`);
      return { received: true };
    }

    switch (type) {
      case 'subscription.active':
      case 'subscription.updated': {
        const plan = this.subscriptionService.getPlanForProduct(data.productId);
        if (plan) {
          await this.subscriptionService.updateUserPlan(externalId, plan, data.id);
        } else {
          this.logger.warn(`Unknown product ID: ${data.productId}`);
        }
        break;
      }

      case 'subscription.canceled':
        this.logger.log(`Subscription canceled for user ${externalId}, keeping plan until period ends`);
        break;

      case 'subscription.revoked':
        await this.subscriptionService.updateUserPlan(externalId, 'free', undefined);
        break;

      default:
        this.logger.debug(`Unhandled webhook type: ${type}`);
    }

    return { received: true };
  }
}
