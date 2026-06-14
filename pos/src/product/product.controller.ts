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
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchByCategoryDto } from './dto/search.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@ApiTags('product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: 'Search products by category' })
  @ApiOkResponse({ description: 'Return products found by category.' })
  @Get('search')
  findProductsByCategory(
    @Request() req: RequestWithUser,
    @Query() searchByCategoryDto: SearchByCategoryDto,
  ) {
    return this.productService.search(searchByCategoryDto, req.user.id);
  }

  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({
    description: 'The product has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(createProductDto, req.user);
  }

  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ description: 'Return all products.' })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.productService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiOkResponse({ description: 'Return a product.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.productService.findOne(+id, req.user.id);
  }

  @ApiOperation({ summary: 'Update a product by ID' })
  @ApiOkResponse({ description: 'The product has been successfully updated.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @ApiOperation({ summary: 'Delete a product by ID' })
  @ApiOkResponse({ description: 'The product has been successfully deleted.' })
  @ApiNotFoundResponse({ description: 'Product not found.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
