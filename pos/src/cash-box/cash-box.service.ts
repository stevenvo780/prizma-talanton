import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashBox } from './entities/cash-box.entity';
import { CreateCashBoxDto } from './dto/create-cash-box.dto';
import { UpdateCashBoxDto } from './dto/update-cash-box.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CashBoxService {
  constructor(
    @InjectRepository(CashBox)
    private cashBoxRepository: Repository<CashBox>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createCashBoxDto: CreateCashBoxDto) {
    const newUser = await this.userRepository.findOne({
      where: { id: createCashBoxDto.user.id },
    });
    const newCashBox = this.cashBoxRepository.create({
      ...createCashBoxDto,
      user: newUser,
    });
    return this.cashBoxRepository.save(newCashBox);
  }

  findAll(userId: string) {
    return this.cashBoxRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  findOne(id: number, userId: string) {
    return this.cashBoxRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: number, updateCashBoxDto: UpdateCashBoxDto, userId?: string) {
    const where = userId ? { id, user: { id: userId } } : { id };
    const updatedCashBox = await this.cashBoxRepository.findOne({
      where,
    });
    if (!updatedCashBox) {
      throw new NotFoundException('Cash box not found');
    }
    Object.assign(updatedCashBox, updateCashBoxDto);
    return this.cashBoxRepository.save(updatedCashBox);
  }

  remove(id: number) {
    return this.cashBoxRepository.delete(id);
  }

  async cashIn(identifier: number | string, amount: number, userId: string) {
    const isNumeric = !isNaN(+identifier as any);
    const where = isNumeric
      ? { id: +identifier, user: { id: userId } }
      : { name: identifier as string, user: { id: userId } };

    let cashBox = await this.cashBoxRepository.findOne({ where });
    if (!cashBox) {
      throw new NotFoundException('Cash box not found or does not belong to user');
    }

    cashBox.cashIn += amount;
    cashBox.balance += amount;
    return this.cashBoxRepository.save(cashBox);
  }

  async cashOut(identifier: number | string, amount: number, userId: string) {
    const isNumeric = !isNaN(+identifier as any);
    const where = isNumeric
      ? { id: +identifier, user: { id: userId } }
      : { name: identifier as string, user: { id: userId } };

    const cashBox = await this.cashBoxRepository.findOne({ where });
    if (!cashBox) {
      throw new NotFoundException('Cash box not found or does not belong to user');
    }
    if (cashBox.balance < amount) {
      throw new NotFoundException('Insufficient balance in the cash box');
    }

    cashBox.cashOut += amount;
    cashBox.balance -= amount;
    return this.cashBoxRepository.save(cashBox);
  }

  async adjustBalance(identifier: number | string, newBalance: number, userId: string) {
    const isNumeric = !isNaN(+identifier as any);
    const where = isNumeric
      ? { id: +identifier, user: { id: userId } }
      : { name: identifier as string, user: { id: userId } };

    const cashBox = await this.cashBoxRepository.findOne({ where });
    if (!cashBox) {
      throw new NotFoundException('Cash box not found or does not belong to user');
    }

    cashBox.balance = newBalance;
    return this.cashBoxRepository.save(cashBox);
  }
}
