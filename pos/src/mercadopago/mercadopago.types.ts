import { PlanType } from '../user/entities/subscription.entity';
import { PaymentFrequency } from './entities/payment-source.entity';

// ─── Mercado Pago API Interfaces ───

export interface MpAutoRecurring {
  frequency: number;
  frequency_type: 'months' | 'days';
  transaction_amount: number;
  currency_id: string;
  start_date?: string;
  end_date?: string;
  repetitions?: number;
  billing_day?: number;
  billing_day_proportional?: boolean;
  free_trial?: {
    frequency: number;
    frequency_type: 'months' | 'days';
  };
}

export interface MpPreapprovalPlan {
  id: string;
  application_id: number;
  collector_id: number;
  reason: string;
  auto_recurring: MpAutoRecurring;
  back_url: string;
  external_reference?: string;
  init_point: string;
  date_created: string;
  last_modified: string;
  status: string;
}

export interface MpPreapproval {
  id: string;
  version: number;
  application_id: number;
  collector_id: number;
  preapproval_plan_id?: string;
  reason: string;
  external_reference?: string;
  back_url: string;
  init_point: string;
  auto_recurring: MpAutoRecurring;
  payer_id: number;
  card_id: number;
  payment_method_id: number;
  next_payment_date: string;
  date_created: string;
  last_modified: string;
  status: MpSubscriptionStatus;
  payer_email?: string;
}

export type MpSubscriptionStatus =
  | 'pending'
  | 'authorized'
  | 'paused'
  | 'cancelled';

// ─── Webhook ───

export interface MpWebhookPayload {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

// ─── DTOs internos ───

export interface CreateSubscriptionInput {
  userId: string;
  email: string;
  planType: PlanType;
  frequency: PaymentFrequency;
}

export interface SubscriptionResult {
  initPoint: string;
  mpSubscriptionId: string;
  planType: PlanType;
  frequency: PaymentFrequency;
}

export interface PlanConfig {
  planType: PlanType;
  frequency: PaymentFrequency;
  mpPlanId?: string; // ID del plan en MP, se crea on-demand
}
