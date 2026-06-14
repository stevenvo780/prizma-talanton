import { Injectable } from '@nestjs/common';
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

  async update(id: number, updateCashBoxDto: UpdateCashBoxDto) {
    const updatedCashBox = await this.cashBoxRepository.findOne({
      where: { id },
    });
    Object.assign(updatedCashBox, updateCashBoxDto);
    return this.cashBoxRepository.save(updatedCashBox);
  }

  remove(id: number) {
    return this.cashBoxRepository.delete(id);
  }

  async cashIn(identifier: number | string, amount: number) {
    const isNumeric = !isNaN(+identifier as any);
    const where = isNumeric
      ? { id: +identifier }
      : { name: identifier as string };

    let cashBox = await this.cashBoxRepository.findOne({ where });
    if (!cashBox) {
      const data: Partial<CashBox> = {
        cashIn: 0,
        cashOut: 0,
        balance: 0,
        user: null,
        ...(!isNumeric ? { name: identifier as string } : {}),
      };
      cashBox = this.cashBoxRepository.create(data);
      cashBox = await this.cashBoxRepository.save(cashBox);
    }

    cashBox.cashIn += amount;
    cashBox.balance += amount;
    return this.cashBoxRepository.save(cashBox);
  }

  async cashOut(identifier: number | string, amount: number) {
    const isNumeric = !isNaN(+identifier as any);
    const where = isNumeric
      ? { id: +identifier }
      : { name: identifier as string };

    const cashBox = await this.cashBoxRepository.findOne({ where });
    if (!cashBox) throw new Error('Cash box not found');
    if (cashBox.balance < amount)
      throw new Error('Insufficient balance in the cash box');

    cashBox.cashOut += amount;
    cashBox.balance -= amount;
    return this.cashBoxRepository.save(cashBox);
  }

  async adjustBalance(identifier: number | string, newBalance: number) {
    const isNumeric = !isNaN(+identifier as any);
    const where = isNumeric
      ? { id: +identifier }
      : { name: identifier as string };

    const cashBox = await this.cashBoxRepository.findOne({ where });
    if (!cashBox) throw new Error('Cash box not found');

    cashBox.balance = newBalance;
    return this.cashBoxRepository.save(cashBox);
  }
}
