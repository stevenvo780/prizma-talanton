import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taxes } from './entities/taxes.entity';
import { CreateTaxesDto } from './dto/create-taxes.dto';
import { UpdateTaxesDto } from './dto/update-taxes.dto';
import { User } from '../user/entities/user.entity';
@Injectable()
export class TaxesService {
  constructor(
    @InjectRepository(Taxes)
    private taxesRepository: Repository<Taxes>,
  ) {}

  async create(createTaxesDto: CreateTaxesDto, user: User) {
    const newTaxes = this.taxesRepository.create(createTaxesDto);
    newTaxes.user = user;
    return this.taxesRepository.save(newTaxes);
  }

  findAll(userId: string) {
    return this.taxesRepository.find({
      where: { user: { id: userId } },
    });
  }

  findOne(id: number, userId: string) {
    return this.taxesRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async update(id: number, updateTaxesDto: UpdateTaxesDto) {
    const taxes = await this.taxesRepository.findOne({ where: { id } });
    Object.assign(taxes, updateTaxesDto);
    return this.taxesRepository.save(taxes);
  }

  remove(id: number) {
    return this.taxesRepository.delete(id);
  }
}
