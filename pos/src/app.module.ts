import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ClientModule } from './client/client.module';
import { InvoiceModule } from './invoice/invoice.module';
import { CashBoxModule } from './cash-box/cash-box.module';
import { WebhookModule } from './webhook/webhook.module';
import { WebhookModule as PluginWebhookModule } from './webhooks/webhook.module';
import { SharedModule } from './shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { TransformInterceptor } from './transform.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule as ConfigBilling } from './config/config.module';
import { CategoryPricingModule } from './category-pricing/category-pricing.module';
import { TaxesModule } from './taxes/taxes.module';
import { DiscountsModule } from './discounts/discounts.module';
import { DianInvoiceModule } from './dian-invoice/dian-invoice.module';
import { MercadoPagoModule } from './mercadopago/mercadopago.module';
import { ScheduleModule } from '@nestjs/schedule';
import AppProvider from './app.provider';
import { IntegrationsController } from './integrations/integrations.controller';
import { OlympoModule } from './cauce/cauce.module';
import { User } from './user/entities/user.entity';
import { Profile } from './profile/entities/profile.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    OlympoModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      ssl:
        process.env.NODE_ENV === 'PROD' ? { rejectUnauthorized: false } : false,
    }),
    TypeOrmModule.forFeature([User, Profile]),
    AuthModule,
    ProductModule,
    CategoryModule,
    UserModule,
    ClientModule,
    InvoiceModule,
    CashBoxModule,
    WebhookModule,
    PluginWebhookModule,
    SharedModule,
    ConfigBilling,
    CategoryPricingModule,
    TaxesModule,
    DiscountsModule,
    DianInvoiceModule,
    MercadoPagoModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, IntegrationsController],
  providers: [
    AppService,
    AppProvider,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {
    // Add any middleware here if needed
  }
}
