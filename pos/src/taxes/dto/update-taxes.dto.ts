import { PartialType } from '@nestjs/swagger';
import { CreateTaxesDto } from './create-taxes.dto';

export class UpdateTaxesDto extends PartialType(CreateTaxesDto) {}
