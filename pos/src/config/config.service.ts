import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from './entities/config.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { User } from '../user/entities/user.entity';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
    private profileService: ProfileService,
  ) {}

  async config(createConfigDto: CreateConfigDto, user: User) {
    let config: Config = await this.configRepository.findOne({
      where: { user: { id: user.id } },
    });
    if (!config) {
      config = new Config();
      config.currentConsecutive = createConfigDto.initialConsecutive;
    } else {
      if (createConfigDto.initialConsecutive !== config.initialConsecutive) {
        createConfigDto.currentConsecutive = createConfigDto.initialConsecutive;
      }
    }
    Object.assign(config, createConfigDto);
    config.user = user;

    return await this.configRepository.save(config);
  }

  async get(userId: string) {
    let config: Config = await this.configRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!config) {
      config = new Config();
      config.initialConsecutive = 1;
      config.finalConsecutive = 100;
      config.currentConsecutive = 1;
      config.pluginsConfig = {
        graf: {
          auth_token: '',
          enabled: false,
        },
        meravuelta: {
          auth_token: '',
          enabled: false,
        },
        fiar: {
          auth_token: '',
          enabled: false,
        },
      };
      const profile = await this.profileService.findByUserId(userId);
      if (profile) {
        config.user = profile.user;
      }
      return await this.configRepository.save(config);
    }
    return config;
  }
}
