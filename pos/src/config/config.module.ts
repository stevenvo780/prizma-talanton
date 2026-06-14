import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { PluginConfigService } from './plugin-config.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config } from './entities/config.entity';
import { UserModule } from '../user/user.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    HttpModule,
    NestConfigModule,
    TypeOrmModule.forFeature([Config]),
    UserModule,
    ProfileModule,
  ],
  controllers: [ConfigController],
  providers: [ConfigService, PluginConfigService],
  exports: [ConfigService, PluginConfigService],
})
export class ConfigModule {}
