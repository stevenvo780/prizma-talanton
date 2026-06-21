import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private dataSource: DataSource,
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
        hermes: {
          auth_token: '',
          enabled: false,
        },
        talaria: {
          auth_token: '',
          enabled: false,
        },
        pistis: {
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

  /**
   * Atomically increment the consecutive counter for a user.
   * Uses an UPDATE statement with INCREMENT to avoid race conditions.
   * @param userId - The ID of the user
   * @returns The new consecutive number, or throws error if not found
   */
  async incrementConsecutiveAtomic(userId: string): Promise<number> {
    // Use a database transaction with pessimistic locking (SELECT FOR UPDATE)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Use pessimistic write lock to ensure no race conditions
      const config = await queryRunner.manager.findOne(Config, {
        where: { user: { id: userId } },
        lock: { mode: 'pessimistic_write' },
        relations: ['user'],
      });

      if (!config) {
        throw new Error(`Config not found for user: ${userId}`);
      }

      // Validate consecutive hasn't exceeded final consecutive
      if (config.currentConsecutive >= config.finalConsecutive) {
        throw new Error(
          `Consecutive number limit reached: ${config.currentConsecutive} >= ${config.finalConsecutive}`,
        );
      }

      // Atomically increment the currentConsecutive
      config.currentConsecutive += 1;
      const updated = await queryRunner.manager.save(Config, config);

      await queryRunner.commitTransaction();
      return updated.currentConsecutive;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
