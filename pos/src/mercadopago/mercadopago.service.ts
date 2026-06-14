import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import {
  PaymentFrequency,
  PaymentSource,
} from './entities/payment-source.entity';
import {
  PLAN_DETAILS,
  PlanType,
  Subscription,
} from '../user/entities/subscription.entity';
import { UserService } from '../user/user.service';
import {
  MpPreapproval,
  MpPreapprovalPlan,
  MpWebhookPayload,
  SubscriptionResult,
} from './mercadopago.types';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly api: AxiosInstance;

  /** Cache en memoria de planId de MP por "planType-frequency" */
  private planIdCache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(PaymentSource)
    private paymentSourceRepository: Repository<PaymentSource>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {
    this.api = axios.create({
      baseURL: 'https://api.mercadopago.com',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });
  }

  // ─────────────────────────────────────────────
  // PLANES
  // ─────────────────────────────────────────────

  /**
   * Obtiene o crea un plan de suscripción en MP para la combinación planType + frequency.
   */
  async getOrCreatePlan(
    planType: PlanType,
    frequency: PaymentFrequency,
  ): Promise<string> {
    const cacheKey = `${planType}-${frequency}`;
    if (this.planIdCache.has(cacheKey)) {
      return this.planIdCache.get(cacheKey);
    }

    // Buscar en MP si ya existe
    try {
      const searchRes = await this.api.get<{ results: MpPreapprovalPlan[] }>(
        '/preapproval_plan/search',
        {
          params: {
            status: 'active',
            q: `Sinergia POS ${planType} ${frequency}`,
          },
        },
      );
      const existing = searchRes.data.results?.find(
        (p) =>
          p.reason ===
          `Sinergia POS - Plan ${PLAN_DETAILS[planType].name} (${
            frequency === PaymentFrequency.MONTHLY ? 'Mensual' : 'Anual'
          })`,
      );
      if (existing) {
        this.planIdCache.set(cacheKey, existing.id);
        this.logger.log(`Plan encontrado en MP: ${existing.id} (${cacheKey})`);
        return existing.id;
      }
    } catch {
      // Si falla la búsqueda, intentamos crear
    }

    // Crear plan
    const plan = PLAN_DETAILS[planType];
    let amount = plan.price;
    let freqType: 'months' | 'days' = 'months';
    let freq = 1;

    if (frequency === PaymentFrequency.ANNUALLY) {
      amount = plan.price * 12 * 0.8;
      freq = 12;
      freqType = 'months';
    }

    const reasonLabel =
      frequency === PaymentFrequency.MONTHLY ? 'Mensual' : 'Anual';

    const body = {
      reason: `Sinergia POS - Plan ${plan.name} (${reasonLabel})`,
      auto_recurring: {
        frequency: freq,
        frequency_type: freqType,
        transaction_amount: amount,
        currency_id: 'COP',
      },
      back_url: process.env.MP_BACK_URL || 'https://sinergia-pos.com/subscribe',
    };

    try {
      const res = await this.api.post<MpPreapprovalPlan>(
        '/preapproval_plan',
        body,
      );
      const planId = res.data.id;
      this.planIdCache.set(cacheKey, planId);
      this.logger.log(`Plan creado en MP: ${planId} (${cacheKey})`);
      return planId;
    } catch (error: any) {
      this.logger.error(
        'Error creando plan en MP:',
        error?.response?.data || error.message,
      );
      throw new BadRequestException({
        message: 'Error al crear plan de suscripción en Mercado Pago',
        details: error?.response?.data?.message || error.message,
      });
    }
  }

  // ─────────────────────────────────────────────
  // SUSCRIPCIONES
  // ─────────────────────────────────────────────

  /**
   * Crea una suscripción de MP con auto_recurring inline.
   * Sin cardTokenId → genera init_point (URL de checkout) para que el usuario pague.
   * Con cardTokenId → crea la suscripción directamente autorizada.
   */
  async createSubscription(data: {
    userId: string;
    email: string;
    planType: PlanType;
    frequency: PaymentFrequency;
    cardTokenId?: string;
  }): Promise<SubscriptionResult> {
    const user = await this.userService.findOne(data.userId);
    if (!user) {
      throw new BadRequestException({
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND',
      });
    }

    const plan = PLAN_DETAILS[data.planType];
    let amount = plan.price;
    let freqType: 'months' | 'days' = 'months';
    let freq = 1;

    if (data.frequency === PaymentFrequency.ANNUALLY) {
      amount = plan.price * 12 * 0.8; // 20% descuento anual
      freq = 12;
      freqType = 'months';
    }

    const reasonLabel =
      data.frequency === PaymentFrequency.MONTHLY ? 'Mensual' : 'Anual';

    const body: Record<string, any> = {
      reason: `Sinergia POS - Plan ${plan.name} (${reasonLabel})`,
      auto_recurring: {
        frequency: freq,
        frequency_type: freqType,
        transaction_amount: amount,
        currency_id: 'COP',
      },
      payer_email: data.email,
      external_reference: `${data.userId}|${data.planType}|${data.frequency}`,
      back_url: process.env.MP_BACK_URL || 'https://sinergia-pos.com/subscribe',
      status: 'pending',
    };

    if (data.cardTokenId) {
      body.card_token_id = data.cardTokenId;
      body.status = 'authorized';
    }

    try {
      const res = await this.api.post<MpPreapproval>('/preapproval', body);
      const preapproval = res.data;

      this.logger.log(
        `Suscripción MP creada: ${preapproval.id} | status=${
          preapproval.status
        } | plan=${data.planType} ${data.frequency} | init_point=${
          preapproval.init_point ? 'SÍ' : 'NO'
        }`,
      );

      // Guardar PaymentSource y Subscription localmente
      await this.saveLocalSubscription(
        user,
        data.planType,
        data.frequency,
        preapproval.id,
        preapproval.status,
      );

      return {
        initPoint: preapproval.init_point,
        mpSubscriptionId: preapproval.id,
        planType: data.planType,
        frequency: data.frequency,
      };
    } catch (error: any) {
      this.logger.error(
        'Error creando suscripción MP:',
        error?.response?.data || error.message,
      );
      throw new BadRequestException({
        message: 'Error al crear suscripción en Mercado Pago',
        details: error?.response?.data?.message || error.message,
      });
    }
  }

  /**
   * Cancela la suscripción activa de un usuario (en MP y localmente).
   */
  async cancelSubscription(userId: string): Promise<Subscription> {
    const paymentSources = await this.paymentSourceRepository.find({
      where: { user: { id: userId }, active: true },
    });

    for (const ps of paymentSources) {
      // Cancelar en Mercado Pago
      if (ps.mpPreapprovalId) {
        try {
          await this.api.put(`/preapproval/${ps.mpPreapprovalId}`, {
            status: 'cancelled',
          });
          this.logger.log(
            `Suscripción MP ${ps.mpPreapprovalId} cancelada en MP`,
          );
        } catch (error: any) {
          this.logger.warn(
            `No se pudo cancelar suscripción MP ${ps.mpPreapprovalId}: ${
              error?.response?.data?.message || error.message
            }`,
          );
        }
      }
      ps.active = false;
      await this.paymentSourceRepository.save(ps);
    }

    const activeSubscription = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, active: true },
    });

    if (!activeSubscription) {
      this.logger.warn(
        `No se encontró suscripción activa para usuario ${userId}`,
      );
      return null;
    }

    activeSubscription.active = false;
    activeSubscription.endDate = new Date();
    const cancelled = await this.subscriptionRepository.save(
      activeSubscription,
    );
    this.logger.log(
      `Suscripción #${cancelled.id} cancelada para usuario ${userId}`,
    );
    return cancelled;
  }

  /**
   * Obtiene el estado actual de la suscripción MP de un usuario.
   */
  async getSubscriptionStatus(
    userId: string,
  ): Promise<{ local: Subscription | null; mp: MpPreapproval | null }> {
    const localSub = await this.subscriptionRepository.findOne({
      where: { user: { id: userId }, active: true },
    });

    if (!localSub) {
      return { local: null, mp: null };
    }

    const paymentSource = await this.paymentSourceRepository.findOne({
      where: { user: { id: userId }, active: true },
    });

    let mpData: MpPreapproval | null = null;
    if (paymentSource?.mpPreapprovalId) {
      try {
        const res = await this.api.get<MpPreapproval>(
          `/preapproval/${paymentSource.mpPreapprovalId}`,
        );
        mpData = res.data;
      } catch {
        this.logger.warn(
          `No se pudo obtener suscripción MP ${paymentSource.mpPreapprovalId}`,
        );
      }
    }

    return { local: localSub, mp: mpData };
  }

  // ─────────────────────────────────────────────
  // WEBHOOK
  // ─────────────────────────────────────────────

  /**
   * Procesa notificaciones webhook de Mercado Pago.
   * MP envía eventos tipo: subscription_preapproval, payment, etc.
   */
  async handleWebhook(payload: MpWebhookPayload): Promise<{
    processed: boolean;
    action: string;
  }> {
    this.logger.log(
      `Webhook recibido: type=${payload.type} action=${payload.action} data.id=${payload.data?.id}`,
    );

    if (payload.type === 'subscription_preapproval') {
      return this.handlePreapprovalWebhook(payload.data.id);
    }

    if (payload.type === 'payment') {
      // Para pagos, podemos actualizar estado de la suscripción
      this.logger.log(`Pago recibido: ${payload.data.id} - ${payload.action}`);
      return { processed: true, action: payload.action };
    }

    return { processed: false, action: payload.action };
  }

  private async handlePreapprovalWebhook(
    preapprovalId: string,
  ): Promise<{ processed: boolean; action: string }> {
    try {
      const res = await this.api.get<MpPreapproval>(
        `/preapproval/${preapprovalId}`,
      );
      const preapproval = res.data;

      this.logger.log(
        `Preapproval ${preapprovalId}: status=${preapproval.status}, external_reference=${preapproval.external_reference}`,
      );

      // Buscar PaymentSource asociado
      const paymentSource = await this.paymentSourceRepository.findOne({
        where: { mpPreapprovalId: preapprovalId },
        relations: ['user'],
      });

      if (!paymentSource) {
        // Puede ser una suscripción nueva creada desde el checkout MP
        if (preapproval.external_reference) {
          await this.handleNewPreapproval(preapproval);
        }
        return { processed: true, action: 'new_preapproval' };
      }

      // Actualizar según el estado
      if (preapproval.status === 'authorized') {
        // Activar suscripción
        paymentSource.active = true;
        if (preapproval.next_payment_date) {
          paymentSource.nextCharge = new Date(preapproval.next_payment_date);
        }
        await this.paymentSourceRepository.save(paymentSource);

        const sub = await this.subscriptionRepository.findOne({
          where: { user: { id: paymentSource.user.id }, active: true },
        });
        if (sub && !sub.active) {
          sub.active = true;
          await this.subscriptionRepository.save(sub);
        }

        this.logger.log(
          `Suscripción activada para usuario ${paymentSource.user.id}`,
        );
      } else if (
        preapproval.status === 'cancelled' ||
        preapproval.status === 'paused'
      ) {
        paymentSource.active = false;
        await this.paymentSourceRepository.save(paymentSource);

        const sub = await this.subscriptionRepository.findOne({
          where: { user: { id: paymentSource.user.id }, active: true },
        });
        if (sub) {
          sub.active = false;
          sub.endDate = new Date();
          await this.subscriptionRepository.save(sub);
        }

        this.logger.log(
          `Suscripción ${preapproval.status} para usuario ${paymentSource.user.id}`,
        );
      }

      return { processed: true, action: `preapproval_${preapproval.status}` };
    } catch (error: any) {
      this.logger.error(
        `Error procesando webhook preapproval ${preapprovalId}:`,
        error?.response?.data || error.message,
      );
      return { processed: false, action: 'error' };
    }
  }

  /**
   * Cuando llega un webhook de un preapproval que no tenemos registrado localmente,
   * intentamos crear las entidades locales.
   */
  private async handleNewPreapproval(
    preapproval: MpPreapproval,
  ): Promise<void> {
    if (!preapproval.external_reference) return;

    const [userId, planType, frequency] =
      preapproval.external_reference.split('|');
    if (!userId || !planType || !frequency) {
      this.logger.warn(
        `external_reference inválido: ${preapproval.external_reference}`,
      );
      return;
    }

    const user = await this.userService.findOne(userId);
    if (!user) {
      this.logger.warn(
        `Usuario ${userId} no encontrado para preapproval ${preapproval.id}`,
      );
      return;
    }

    await this.saveLocalSubscription(
      user,
      planType as PlanType,
      frequency as PaymentFrequency,
      preapproval.id,
      preapproval.status,
    );
  }

  // ─────────────────────────────────────────────
  // SYNC (cron)
  // ─────────────────────────────────────────────

  /**
   * Sincroniza el estado de las suscripciones activas locales con MP.
   * Útil para detectar cancelaciones o vencimientos.
   */
  async syncSubscriptions(): Promise<{
    checked: number;
    updated: number;
  }> {
    const activeSources = await this.paymentSourceRepository.find({
      where: { active: true },
      relations: ['user'],
    });

    let checked = 0;
    let updated = 0;

    for (const source of activeSources) {
      if (!source.mpPreapprovalId) continue;

      checked++;
      try {
        const res = await this.api.get<MpPreapproval>(
          `/preapproval/${source.mpPreapprovalId}`,
        );
        const mp = res.data;

        if (mp.status === 'cancelled' || mp.status === 'paused') {
          source.active = false;
          await this.paymentSourceRepository.save(source);

          const sub = await this.subscriptionRepository.findOne({
            where: { user: { id: source.user.id }, active: true },
          });
          if (sub) {
            sub.active = false;
            sub.endDate = new Date();
            await this.subscriptionRepository.save(sub);
          }
          updated++;
          this.logger.log(
            `Sync: suscripción ${source.mpPreapprovalId} → ${mp.status} para usuario ${source.user.id}`,
          );
        } else if (mp.next_payment_date) {
          const nextPayment = new Date(mp.next_payment_date);
          if (
            !source.nextCharge ||
            source.nextCharge.getTime() !== nextPayment.getTime()
          ) {
            source.nextCharge = nextPayment;
            await this.paymentSourceRepository.save(source);

            // Actualizar endDate de la suscripción
            const sub = await this.subscriptionRepository.findOne({
              where: { user: { id: source.user.id }, active: true },
            });
            if (sub) {
              sub.endDate = nextPayment;
              await this.subscriptionRepository.save(sub);
            }
            updated++;
          }
        }
      } catch (error: any) {
        this.logger.warn(
          `Sync: error consultando ${source.mpPreapprovalId}: ${
            error?.response?.status || error.message
          }`,
        );
      }
    }

    this.logger.log(
      `Sync completado: ${checked} verificadas, ${updated} actualizadas`,
    );
    return { checked, updated };
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private async saveLocalSubscription(
    user: any,
    planType: PlanType,
    frequency: PaymentFrequency,
    mpPreapprovalId: string,
    mpStatus: string,
  ): Promise<void> {
    // Desactivar fuentes de pago anteriores del usuario
    const oldSources = await this.paymentSourceRepository.find({
      where: { user: { id: user.id }, active: true },
    });
    for (const old of oldSources) {
      old.active = false;
      await this.paymentSourceRepository.save(old);
    }

    // Crear nueva PaymentSource
    const paymentSource = new PaymentSource();
    paymentSource.mpPreapprovalId = mpPreapprovalId;
    paymentSource.active = mpStatus === 'authorized';
    paymentSource.frequency = frequency;
    paymentSource.nextCharge = this.calculateNextChargeDate(frequency);
    paymentSource.planType = planType;
    paymentSource.user = user;
    const savedSource = await this.paymentSourceRepository.save(paymentSource);
    this.logger.log(
      `PaymentSource #${savedSource.id} creado (MP: ${mpPreapprovalId})`,
    );

    // Desactivar suscripciones anteriores
    const oldSubs = await this.subscriptionRepository.find({
      where: { user: { id: user.id }, active: true },
    });
    for (const oldSub of oldSubs) {
      oldSub.active = false;
      await this.subscriptionRepository.save(oldSub);
    }

    // Crear nueva Subscription
    const subscription = new Subscription();
    subscription.user = user;
    subscription.planType = planType;
    subscription.frequency = frequency;
    subscription.startDate = new Date();
    subscription.endDate = this.calculateNextChargeDate(frequency);
    subscription.active = mpStatus === 'authorized';
    subscription.paymentSourceId = savedSource.id;
    const savedSub = await this.subscriptionRepository.save(subscription);
    this.logger.log(
      `Suscripción #${savedSub.id} creada: ${savedSub.planType} ${savedSub.frequency} → active=${savedSub.active}`,
    );
  }

  private calculateNextChargeDate(frequency: PaymentFrequency | string): Date {
    const nextDate = new Date();
    if (frequency === PaymentFrequency.MONTHLY || frequency === 'MONTHLY') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (
      frequency === PaymentFrequency.ANNUALLY ||
      frequency === 'ANNUALLY'
    ) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    return nextDate;
  }
}
