import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterClientDto } from './dto/filter-client.dto';
import { User } from '../user/entities/user.entity';
import { uid } from 'uid';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto, user: User) {
    let client;
    let existingField: string | null = null;

    if (createClientDto.documentNumber) {
      client = await this.clientRepository.findOne({
        where: {
          documentNumber: createClientDto.documentNumber,
          user: { id: user.id },
        },
      });
      if (client) existingField = 'documento';
    }
    if (!client && createClientDto.phone) {
      client = await this.clientRepository.findOne({
        where: { phone: createClientDto.phone, user: { id: user.id } },
      });
      if (client) existingField = 'teléfono';
    }
    if (!client && createClientDto.email) {
      client = await this.clientRepository.findOne({
        where: { email: createClientDto.email, user: { id: user.id } },
      });
      if (client) existingField = 'correo electrónico';
    }

    if (client && existingField) {
      throw new ConflictException(
        `Ya existe un cliente con ese ${existingField}. Puede buscarlo y editarlo.`,
      );
    }

    client = new Client();
    Object.assign(client, createClientDto);
    client.user = user;
    client.id = uid(16);
    try {
      return await this.clientRepository.save(client);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  findAll(userId: string) {
    return this.clientRepository.find({
      where: { user: { id: userId } },
      order: { id: 'DESC' },
    });
  }

  findOne(id: string, userId: string) {
    return this.clientRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['invoices'],
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    return this.clientRepository.update(id, updateClientDto);
  }

  remove(id: string) {
    return this.clientRepository.delete(id);
  }

  async search(query: string, userId: string) {
    return this.clientRepository
      .createQueryBuilder('client')
      .where('client.userId = :userId', { userId })
      .andWhere(
        `(
        similarity(client.name, :q) > 0.2 OR
        similarity(client.surname, :q) > 0.2 OR
        similarity(client.email, :q) > 0.2 OR
        similarity(client.phone, :q) > 0.2 OR
        similarity(client.documentNumber, :q) > 0.2
      )`,
        { q: query },
      )
      .orderBy(
        `GREATEST(
        similarity(client.name, :q),
        similarity(client.surname, :q),
        similarity(client.email, :q),
        similarity(client.phone, :q),
        similarity(client.documentNumber, :q)
      )`,
        'DESC',
      )
      .limit(20)
      .getMany();
  }

  async findAllWithFilters(userId: string, filters: FilterClientDto) {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.user = :userId', { userId });

    if (filters.search) {
      queryBuilder.andWhere(
        '(client.name ILIKE :search OR client.surname ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search OR client.documentNumber ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.department) {
      queryBuilder.andWhere('client.department ILIKE :department', {
        department: `%${filters.department}%`,
      });
    }

    if (filters.city) {
      queryBuilder.andWhere('client.city ILIKE :city', {
        city: `%${filters.city}%`,
      });
    }

    if (filters.typeDocument) {
      queryBuilder.andWhere('client.typeDocument = :typeDocument', {
        typeDocument: filters.typeDocument,
      });
    }

    const sortBy = filters.sortBy || 'id';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`client.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    return queryBuilder.getMany();
  }

  async exportToExcel(userId: string, filters: FilterClientDto) {
    const clients = await this.findAllWithFilters(userId, filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clientes');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Nombre', key: 'name', width: 20 },
      { header: 'Apellido', key: 'surname', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Dirección', key: 'address', width: 40 },
      { header: 'Documento', key: 'documentNumber', width: 20 },
      { header: 'Tipo Documento', key: 'typeDocument', width: 25 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Ciudad', key: 'city', width: 20 },
      { header: 'Barrio', key: 'neighborhood', width: 20 },
      { header: 'Conjunto', key: 'residentialGroup', width: 25 },
      { header: 'Casa/Apto', key: 'houseNumber', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const filterInfo = [];
    if (filters.search) filterInfo.push(`Búsqueda: ${filters.search}`);
    if (filters.department)
      filterInfo.push(`Departamento: ${filters.department}`);
    if (filters.city) filterInfo.push(`Ciudad: ${filters.city}`);
    if (filters.typeDocument)
      filterInfo.push(`Tipo Documento: ${filters.typeDocument}`);

    if (filterInfo.length > 0) {
      worksheet.insertRow(1, [`Filtros aplicados: ${filterInfo.join(', ')}`]);
      worksheet.getRow(1).font = { italic: true };
      worksheet.mergeCells('A1:M1');
      worksheet.insertRow(2, []);
    }

    clients.forEach((client) => {
      worksheet.addRow({
        id: client.id,
        name: client.name || '',
        surname: client.surname || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        documentNumber: client.documentNumber || '',
        typeDocument: client.typeDocument || '',
        department: client.department || '',
        city: client.city || '',
        neighborhood: client.neighborhood || '',
        residentialGroup: client.residentialGroup || '',
        houseNumber: client.houseNumber || '',
      });
    });

    const summaryRowIndex = worksheet.rowCount + 2;
    worksheet.addRow([]);
    worksheet.addRow([`Total de clientes: ${clients.length}`]);
    worksheet.getRow(summaryRowIndex + 1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
