import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from './entities/webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
  ) {}

  async create(createWebhookDto: CreateWebhookDto, user: User) {
    const webhook = this.webhookRepository.create(createWebhookDto);
    webhook.user = user;
    return this.webhookRepository.save(webhook);
  }

  findAll(userId: string) {
    return this.webhookRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  findOne(id: number, userId: string) {
    return this.webhookRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });
  }

  findByBounceRoute(bounceRoute: string, userId: string) {
    return this.webhookRepository.findOne({
      where: { bounceRoute, user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id: number, updateWebhookDto: UpdateWebhookDto) {
    return this.webhookRepository.update(id, updateWebhookDto);
  }

  async remove(id: number) {
    return this.webhookRepository.delete(id);
  }
}
