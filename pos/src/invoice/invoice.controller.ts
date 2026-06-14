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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';

@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth()
@ApiTags('invoice')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiCreatedResponse({
    description: 'The invoice has been successfully created.',
  })
  @Post(':id')
  create(
    @Param('id') id: number | string,
    @Request() req: RequestWithUser,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoiceService.create(createInvoiceDto, req.user, id);
  }

  @ApiOperation({ summary: 'Get all invoices with filters' })
  @ApiOkResponse({
    description: 'Return filtered invoices with pagination.',
    type: [CreateInvoiceDto],
  })
  @Get()
  findAll(@Request() req: RequestWithUser, @Query() filters: FilterInvoiceDto) {
    return this.invoiceService.findAllWithFilters(req.user.id, filters);
  }

  @ApiOperation({ summary: 'Export invoices to Excel' })
  @ApiOkResponse({
    description: 'Export invoices to Excel file.',
  })
  @Get('export/excel')
  async exportToExcel(
    @Request() req: RequestWithUser,
    @Query() filters: FilterInvoiceDto,
    @Res() res: Response,
  ) {
    const buffer = await this.invoiceService.exportToExcel(
      req.user.id,
      filters,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=facturas_${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @ApiOperation({ summary: 'Export products summary to Excel' })
  @ApiOkResponse({
    description: 'Export products summary to Excel file.',
  })
  @Get('export/products')
  async exportProductsSummary(
    @Request() req: RequestWithUser,
    @Query() filters: FilterInvoiceDto,
    @Res() res: Response,
  ) {
    const buffer = await this.invoiceService.exportProductsSummary(
      req.user.id,
      filters,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=productos_resumen_${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiOkResponse({ description: 'Return an invoice.', type: CreateInvoiceDto })
  @ApiNotFoundResponse({ description: 'Invoice not found.' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.invoiceService.findOne(+id, req.user.id);
  }

  @ApiOperation({ summary: 'Update an invoice by ID' })
  @ApiOkResponse({ description: 'The invoice has been successfully updated.' })
  @ApiNotFoundResponse({ description: 'Invoice not found.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(+id, updateInvoiceDto);
  }

  @ApiOperation({ summary: 'Delete an invoice by ID' })
  @ApiNoContentResponse({
    description: 'The invoice has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Invoice not found.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(+id);
  }
}
