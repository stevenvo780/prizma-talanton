import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OlympoHubService } from './hub.service';

/**
 * Olympo ecosystem integration module.
 *
 * Provides the canonical `@olympo/contracts` HubClient (source="sinergia")
 * wrapped as the injectable {@link OlympoHubService}. Marked @Global so any
 * feature module can inject it without re-importing.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [OlympoHubService],
  exports: [OlympoHubService],
})
export class OlympoModule {}
