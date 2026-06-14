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
import { CategoryPricingService } from './category-pricing.service';
import { CreateCategoryPricingDto } from './dto/create-category-pricing.dto';
import { UpdateCategoryPricingDto } from './dto/update-category-pricing.dto';
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
@ApiTags('category-pricing')
@Controller('category-pricing')
export class CategoryPricingController {
  constructor(
    private readonly categoryPricingService: CategoryPricingService,
  ) {}

  @ApiOperation({ summary: 'Create a new categoryPricing' })
  @ApiCreatedResponse({
    description: 'The categoryPricing has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createCategoryPricingDto: CreateCategoryPricingDto,
  ) {
    return this.categoryPricingService.create(
      createCategoryPricingDto,
      req.user,
    );
  }

  @ApiOperation({ summary: 'Get all categories' })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.categoryPricingService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a categoryPricing by ID' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.categoryPricingService.findOne(+id, req.user.id);
  }

  @ApiOperation({ summary: 'Update a categoryPricing by ID' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryPricingDto: UpdateCategoryPricingDto,
  ) {
    return this.categoryPricingService.update(+id, updateCategoryPricingDto);
  }

  @ApiOperation({ summary: 'Delete a categoryPricing by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryPricingService.remove(+id);
  }
}
