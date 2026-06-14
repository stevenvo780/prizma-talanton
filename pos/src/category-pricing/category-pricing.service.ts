import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryPricing } from './entities/category-pricing.entity';
import { CreateCategoryPricingDto } from './dto/create-category-pricing.dto';
import { UpdateCategoryPricingDto } from './dto/update-category-pricing.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CategoryPricingService {
  constructor(
    @InjectRepository(CategoryPricing)
    private categoryPricingRepository: Repository<CategoryPricing>,
  ) {}
  async create(createCategoryPricingDto: CreateCategoryPricingDto, user: User) {
    const newCategoryPricing = this.categoryPricingRepository.create(
      createCategoryPricingDto,
    );
    newCategoryPricing.user = user;
    return this.categoryPricingRepository.save(newCategoryPricing);
  }

  findAll(userId: string) {
    return this.categoryPricingRepository.find({
      where: { user: { id: userId } },
    });
  }

  findOne(id: number, userId: string) {
    return this.categoryPricingRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async update(id: number, updateCategoryPricingDto: UpdateCategoryPricingDto) {
    const categoryPricing = await this.categoryPricingRepository.findOne({
      where: { id },
    });
    Object.assign(categoryPricing, updateCategoryPricingDto);
    return this.categoryPricingRepository.save(categoryPricing);
  }

  remove(id: number) {
    return this.categoryPricingRepository.delete(id);
  }
}
