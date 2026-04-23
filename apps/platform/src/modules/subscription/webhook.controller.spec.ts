import { Test } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { SubscriptionService } from './subscription.service';

describe('WebhookController', () => {
  let controller: WebhookController;
  let subscriptionService: Record<string, jest.Mock>;

  beforeEach(async () => {
    subscriptionService = {
      getPlanForProduct: jest.fn(),
      updateUserPlan: jest.fn().mockResolvedValue(undefined),
      createFreeSubscription: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: SubscriptionService, useValue: subscriptionService },
      ],
    }).compile();

    controller = module.get(WebhookController);
  });

  describe('handleWebhook', () => {
    it('should update plan on subscription.active', async () => {
      subscriptionService.getPlanForProduct.mockReturnValue('pro');

      const payload = {
        type: 'subscription.active',
        data: {
          id: 'sub-1',
          productId: 'prod-pro',
          customer: { externalId: 'user-1' },
        },
      };

      await controller.handleWebhook(payload);

      expect(subscriptionService.updateUserPlan).toHaveBeenCalledWith(
        'user-1',
        'pro',
        'sub-1',
      );
    });

    it('should revert to free on subscription.revoked', async () => {
      const payload = {
        type: 'subscription.revoked',
        data: {
          id: 'sub-1',
          productId: 'prod-pro',
          customer: { externalId: 'user-1' },
        },
      };

      await controller.handleWebhook(payload);

      expect(subscriptionService.updateUserPlan).toHaveBeenCalledWith(
        'user-1',
        'free',
        undefined,
      );
    });

    it('should ignore events without externalId', async () => {
      const payload = {
        type: 'subscription.active',
        data: {
          id: 'sub-1',
          productId: 'prod-pro',
          customer: { externalId: null },
        },
      };

      await controller.handleWebhook(payload);

      expect(subscriptionService.updateUserPlan).not.toHaveBeenCalled();
    });
  });
});
