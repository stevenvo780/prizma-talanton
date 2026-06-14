import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DianInvoiceService } from './dian-invoice.service';
import {
  EmitDianInvoiceDto,
  EmitDianInvoiceFreeDto,
  EmitCreditNoteDto,
  ConfigureDianProviderDto,
} from './dto/dian-invoice.dto';
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
@ApiTags('dian-invoice')
@Controller('dian-invoice')
export class DianInvoiceController {
  constructor(private readonly dianInvoiceService: DianInvoiceService) {}

  // ─── Configurar Proveedor ────────────────────────────────────

  @ApiOperation({
    summary: 'Configurar proveedor de facturación electrónica (Alegra)',
    description:
      'Configura las credenciales del proveedor de facturación electrónica DIAN. ' +
      'Se validan las credenciales antes de guardarlas.',
  })
  @ApiCreatedResponse({
    description: 'Proveedor configurado correctamente.',
  })
  @Post('configure')
  configure(
    @Request() req: RequestWithUser,
    @Body() dto: ConfigureDianProviderDto,
  ) {
    return this.dianInvoiceService.configureProvider(dto, req.user);
  }

  // ─── Emitir Factura Electrónica desde POS ────────────────────

  @ApiOperation({
    summary: 'Emitir factura electrónica DIAN desde una factura del POS',
    description:
      'Toma una factura existente del POS y la emite como factura electrónica ante la DIAN ' +
      'a través del proveedor configurado (Alegra).',
  })
  @ApiCreatedResponse({
    description: 'Factura electrónica emitida correctamente.',
  })
  @Post('emit')
  emit(@Request() req: RequestWithUser, @Body() dto: EmitDianInvoiceDto) {
    return this.dianInvoiceService.emitFromInvoice(dto, req.user);
  }

  // ─── Emitir Factura Electrónica Libre ────────────────────────

  @ApiOperation({
    summary: 'Emitir factura electrónica DIAN libre (sin factura POS)',
    description:
      'Crea y emite una factura electrónica directamente con los datos proporcionados, ' +
      'sin necesidad de tener una factura previa en el POS.',
  })
  @ApiCreatedResponse({
    description: 'Factura electrónica libre emitida correctamente.',
  })
  @Post('emit-free')
  emitFree(
    @Request() req: RequestWithUser,
    @Body() dto: EmitDianInvoiceFreeDto,
  ) {
    return this.dianInvoiceService.emitFree(dto, req.user);
  }

  // ─── Emitir Nota Crédito ─────────────────────────────────────

  @ApiOperation({
    summary: 'Emitir nota crédito electrónica DIAN',
    description:
      'Emite una nota crédito electrónica sobre una factura previamente timbrada ante la DIAN. ' +
      'Razones: 1=Devolución, 2=Anulación, 3=Descuento, 4=Ajuste precio, 5=Otros.',
  })
  @ApiCreatedResponse({
    description: 'Nota crédito emitida correctamente.',
  })
  @Post('credit-note')
  creditNote(@Request() req: RequestWithUser, @Body() dto: EmitCreditNoteDto) {
    return this.dianInvoiceService.emitCreditNote(dto, req.user);
  }

  // ─── Consultar Estado ────────────────────────────────────────

  @ApiOperation({
    summary: 'Consultar estado de un documento electrónico ante la DIAN',
    description:
      'Consulta y actualiza el estado del documento electrónico ante la DIAN. ' +
      'Retorna CUFE, estado del timbrado y URLs de PDF/QR.',
  })
  @ApiOkResponse({
    description: 'Estado del documento electrónico.',
  })
  @Get('status/:id')
  checkStatus(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.dianInvoiceService.checkStatus(+id, req.user);
  }

  // ─── Obtener PDF ─────────────────────────────────────────────

  @ApiOperation({
    summary: 'Obtener URL del PDF del documento electrónico',
  })
  @ApiOkResponse({ description: 'URL del PDF.' })
  @ApiNotFoundResponse({ description: 'Documento no encontrado.' })
  @Get('pdf/:id')
  getPdf(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.dianInvoiceService.getPdf(+id, req.user);
  }

  // ─── Listar Documentos Electrónicos ──────────────────────────

  @ApiOperation({
    summary: 'Listar todos los documentos electrónicos DIAN del usuario',
  })
  @ApiOkResponse({
    description: 'Lista de documentos electrónicos.',
  })
  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.dianInvoiceService.findAll(req.user.id);
  }

  // ─── Consultar un Documento ──────────────────────────────────

  @ApiOperation({
    summary: 'Consultar un documento electrónico por ID',
  })
  @ApiOkResponse({ description: 'Documento electrónico.' })
  @ApiNotFoundResponse({ description: 'Documento no encontrado.' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.dianInvoiceService.findOne(+id, req.user.id);
  }

  // ─── Consultar Numeraciones de Facturación ───────────────────

  @ApiOperation({
    summary: 'Consultar resoluciones/numeraciones de facturación configuradas',
    description:
      'Obtiene las numeraciones de facturación (resoluciones DIAN) configuradas ' +
      'en el proveedor de facturación electrónica.',
  })
  @ApiOkResponse({
    description: 'Lista de numeraciones de facturación.',
  })
  @Get('number-templates/list')
  getNumberTemplates(@Request() req: RequestWithUser) {
    return this.dianInvoiceService.getNumberTemplates(req.user);
  }
}
