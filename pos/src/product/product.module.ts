import { Module, forwardRef } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';
import { Invoice } from '../invoice/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, User, Invoice]),
    forwardRef(() => UserModule),
    forwardRef(() => CategoryModule),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, TypeOrmModule],
})
export class ProductModule {}
