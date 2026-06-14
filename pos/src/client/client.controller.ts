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
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientDto } from './dto/filter-client.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RequestWithUser } from '../auth/types';
import { Response } from 'express';
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
@ApiTags('client')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOperation({ summary: 'Create a new client' })
  @ApiCreatedResponse({
    description: 'The client has been successfully created.',
  })
  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientService.create(createClientDto, req.user);
  }

  @ApiOperation({ summary: 'Get all clients' })
  @ApiOkResponse({
    description: 'Return all clients.',
    type: [CreateClientDto],
  })
  @Get()
  findAll(@Request() req: RequestWithUser, @Query() filters?: FilterClientDto) {
    if (filters && Object.keys(filters).length > 0) {
      return this.clientService.findAllWithFilters(req.user.id, filters);
    }
    return this.clientService.findAll(req.user.id);
  }

  @ApiOperation({ summary: 'Export clients to Excel' })
  @ApiOkResponse({ description: 'Excel file with clients data.' })
  @Get('export/excel')
  async exportToExcel(
    @Request() req: RequestWithUser,
    @Query() filters: FilterClientDto,
    @Res() res: Response,
  ) {
    const buffer = await this.clientService.exportToExcel(req.user.id, filters);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=clientes_${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
    );

    res.send(buffer);
  }

  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiOkResponse({ description: 'Return a client.', type: CreateClientDto })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.clientService.findOne(id, req.user.id);
  }

  @ApiOperation({
    summary: 'Buscar clientes por cualquier campo (tipo buscador, flexible)',
  })
  @ApiOkResponse({ description: 'Clientes encontrados por búsqueda flexible.' })
  @Get('get/search')
  async search(@Request() req: RequestWithUser, @Query('q') q: string) {
    const query = req.query?.q || q;
    if (!query || typeof query !== 'string') {
      return [];
    }
    return this.clientService.search(query, req.user.id);
  }

  @ApiOperation({ summary: 'Update a client by ID' })
  @ApiOkResponse({ description: 'The client has been successfully updated.' })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(id, updateClientDto);
  }

  @ApiOperation({ summary: 'Delete a client by ID' })
  @ApiNoContentResponse({
    description: 'The client has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Client not found.' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientService.remove(id);
  }
}
