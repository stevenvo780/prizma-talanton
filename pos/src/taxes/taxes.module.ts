import { Module, forwardRef } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taxes } from './entities/taxes.entity';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Taxes]),
    forwardRef(() => ProductModule),
    UserModule,
  ],
  controllers: [TaxesController],
  providers: [TaxesService],
})
export class TaxesModule {}
