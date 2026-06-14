import { NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto) {
    return this.userRepository.save(createUserDto);
  }

  findAll() {
    return this.userRepository.find();
  }

  findOne(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUserWithEmail = await this.findOneByEmail(
        updateUserDto.email,
      );
      if (existingUserWithEmail && existingUserWithEmail.id !== id) {
        throw new ConflictException(
          `El correo electrónico "${updateUserDto.email}" ya está en uso.`,
        );
      }
    }

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  remove(id: string) {
    return this.userRepository.delete(id);
  }

  async findMe(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    return user;
  }

  findByAuthToken(authToken: string) {
    return this.userRepository.findOne({
      where: { auth_token: authToken },
      relations: ['profile'],
    });
  }
}
