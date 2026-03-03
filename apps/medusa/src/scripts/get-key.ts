
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { IApiKeyModuleService } from '@medusajs/types';
import type { ExecArgs } from '@medusajs/framework/types';

export default async function getKey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const apiKeyModuleService: IApiKeyModuleService = container.resolve(Modules.API_KEY);

  const [apiKey] = await apiKeyModuleService.listApiKeys({
    type: 'publishable',
    title: 'Storefront'
  });

  if (apiKey) {
    logger.info(`CURRENT_PUBLISHABLE_KEY: ${apiKey.token}`);
  } else {
    logger.error('No storefront publishable key found.');
  }
}
