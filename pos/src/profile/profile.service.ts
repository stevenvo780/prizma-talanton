import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private userService: UserService,
  ) {}

  async create(createProfileDto: CreateProfileDto) {
    const user = await this.userService.findOne(createProfileDto.userId);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const profile = this.profileRepository.create({
      ...createProfileDto,
      user,
    });

    return this.profileRepository.save(profile);
  }

  findAll() {
    return this.profileRepository.find({ relations: ['user'] });
  }

  findOne(id: number) {
    return this.profileRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  findByUserId(userId: string) {
    return this.profileRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: number, updateProfileDto: UpdateProfileDto) {
    const profile = await this.profileRepository.findOne({ where: { id } });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    if (updateProfileDto.userId) {
      const user = await this.userService.findOne(updateProfileDto.userId);
      if (user) {
        profile.user = user;
      }
    }

    Object.assign(profile, updateProfileDto);

    return this.profileRepository.save(profile);
  }

  remove(id: number) {
    return this.profileRepository.delete(id);
  }
}
