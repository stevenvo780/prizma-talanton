import { PartialType } from '@nestjs/swagger';
import { CreateCategoryPricingDto } from './create-category-pricing.dto';

export class UpdateCategoryPricingDto extends PartialType(
  CreateCategoryPricingDto,
) {}
