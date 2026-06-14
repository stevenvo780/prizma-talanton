import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { CreateTaxesDto } from './dto/create-taxes.dto';
import { UpdateTaxesDto } from './dto/update-taxes.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@ApiTags('taxes')
@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @ApiOperation({ summary: 'Create a new taxes' })
  @ApiCreatedResponse({
    description: 'The taxes has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createTaxesDto: CreateTaxesDto,
  ) {
    return this.taxesService.create(createTaxesDto, req.user);
  }

  @ApiOperation({ summary: 'Get all categories' })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.taxesService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a taxes by ID' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.taxesService.findOne(+id, req.user.id);
  }

  @ApiOperation({ summary: 'Update a taxes by ID' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaxesDto: UpdateTaxesDto) {
    return this.taxesService.update(+id, updateTaxesDto);
  }

  @ApiOperation({ summary: 'Delete a taxes by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taxesService.remove(+id);
  }
}
