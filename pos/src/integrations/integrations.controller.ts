import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Profile } from '../profile/entities/profile.entity';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
  ) {}

  @Get('plugins')
  @ApiOperation({ summary: 'Listar plugins del usuario actual (tenant)' })
  async list(@Req() req: any) {
    const userId = req.user?.id;
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    return user?.profile?.pluginsConfig || {};
  }

  @Put('plugins')
  @ApiOperation({ summary: 'Actualizar plugins del usuario actual' })
  async update(@Req() req: any, @Body() body: { pluginsConfig: any }) {
    const userId = req.user?.id;
    const user = await this.users.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user?.profile) return {};
    user.profile.pluginsConfig = {
      ...(user.profile.pluginsConfig || {}),
      ...(body.pluginsConfig || {}),
    } as any;
    await this.profiles.save(user.profile);
    return user.profile.pluginsConfig;
  }
}
