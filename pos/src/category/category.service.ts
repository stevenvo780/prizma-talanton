import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}
  async create(createCategoryDto: CreateCategoryDto, user: User) {
    const newCategory = this.categoryRepository.create(createCategoryDto);
    newCategory.user = user;
    return this.categoryRepository.save(newCategory);
  }

  findAll(userId: string) {
    return this.categoryRepository.find({
      where: { user: { id: userId } },
    });
  }

  findOne(id: number, userId: string) {
    return this.categoryRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  remove(id: number) {
    return this.categoryRepository.delete(id);
  }
}
