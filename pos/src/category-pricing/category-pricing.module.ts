import { Module, forwardRef } from '@nestjs/common';
import { CategoryPricingService } from './category-pricing.service';
import { CategoryPricingController } from './category-pricing.controller';
import { UserModule } from '../user/user.module';
import { CategoryPricing } from './entities/category-pricing.entity';
import { ProductModule } from '../product/product.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryPricing]),
    forwardRef(() => ProductModule),
    UserModule,
  ],
  controllers: [CategoryPricingController],
  providers: [CategoryPricingService],
})
export class CategoryPricingModule {}
