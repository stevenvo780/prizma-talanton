import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrizmaHubService } from './prizma-hub.service';

/**
 * Prizma ecosystem integration module.
 *
 * Provides the canonical `prizma-contracts` HubClient (source="talanton")
 * wrapped as the injectable {@link PrizmaHubService}. Marked @Global so any
 * feature module can inject it without re-importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrizmaHubService],
  exports: [PrizmaHubService],
})
export class PrizmaModule {}
