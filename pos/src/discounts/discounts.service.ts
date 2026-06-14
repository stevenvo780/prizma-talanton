import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discounts } from './entities/discounts.entity';
import { CreateDiscountsDto } from './dto/create-discounts.dto';
import { UpdateDiscountsDto } from './dto/update-discounts.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discounts)
    private discountsRepository: Repository<Discounts>,
  ) {}
  async create(createDiscountsDto: CreateDiscountsDto, user: User) {
    const newDiscounts = this.discountsRepository.create(createDiscountsDto);
    newDiscounts.user = user;
    return this.discountsRepository.save(newDiscounts);
  }

  findAll(userId: string) {
    return this.discountsRepository.find({
      where: { user: { id: userId } },
    });
  }

  findOne(id: number, userId: string) {
    return this.discountsRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async update(id: number, updateDiscountsDto: UpdateDiscountsDto) {
    const discounts = await this.discountsRepository.findOne({ where: { id } });
    Object.assign(discounts, updateDiscountsDto);
    return this.discountsRepository.save(discounts);
  }

  remove(id: number) {
    return this.discountsRepository.delete(id);
  }
}
