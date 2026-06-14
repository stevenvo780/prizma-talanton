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
import { DiscountsService } from './discounts.service';
import { CreateDiscountsDto } from './dto/create-discounts.dto';
import { UpdateDiscountsDto } from './dto/update-discounts.dto';
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
@ApiTags('discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @ApiOperation({ summary: 'Create a new discounts' })
  @ApiCreatedResponse({
    description: 'The discounts has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createDiscountsDto: CreateDiscountsDto,
  ) {
    return this.discountsService.create(createDiscountsDto, req.user);
  }

  @ApiOperation({ summary: 'Get all categories' })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.discountsService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a discounts by ID' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.discountsService.findOne(+id, req.user.id);
  }

  @ApiOperation({ summary: 'Update a discounts by ID' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDiscountsDto: UpdateDiscountsDto,
  ) {
    return this.discountsService.update(+id, updateDiscountsDto);
  }

  @ApiOperation({ summary: 'Delete a discounts by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.discountsService.remove(+id);
  }
}
