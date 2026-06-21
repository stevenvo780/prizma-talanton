import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrizmaHubLegacyService } from './prizma-hub.service';

/**
 * Legacy compatibility module for the previous "Hub Central" webhook bridge.
 *
 * Superseded by the canonical {@link PrizmaHubService} in `src/prizma/`, which
 * publishes events through the `prizma-contracts` HubClient. This module is
 * retained only for the historical webhook sink at
 * `${PRIZMA_NOUS_URL}/api/v1/webhooks/venta-pos-creada` (kept in sync until the
 * receiver is fully migrated to the canonical event envelope).
 *
 * Canonical source is `talanton`; URL/secret env vars are `PRIZMA_NOUS_*`.
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [PrizmaHubLegacyService],
  exports: [PrizmaHubLegacyService],
})
export class PrizmaHubLegacyModule {}