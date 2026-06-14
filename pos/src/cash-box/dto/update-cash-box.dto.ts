import { PartialType } from '@nestjs/swagger';
import { CreateCashBoxDto } from './create-cash-box.dto';

export class UpdateCashBoxDto extends PartialType(CreateCashBoxDto) {}
