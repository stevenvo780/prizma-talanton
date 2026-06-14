import api from '../utils/axios';

export type PlanType = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type Frequency = 'MONTHLY' | 'ANNUALLY';

export interface SubscribePayload {
  planType: PlanType;
  frequency: Frequency;
  cardTokenId?: string;
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
  data?: {
    initPoint: string;
    mpSubscriptionId: string;
    planType: PlanType;
    frequency: Frequency;
  };
}

export interface SubscriptionStatus {
  success: boolean;
  data: {
    local: any;
    mp: any;
  };
}

/**
 * Crea una suscripción en Mercado Pago.
 * Retorna el initPoint (URL) al que debe redirigirse el usuario para completar el pago.
 */
export const subscribe = async (payload: SubscribePayload): Promise<SubscribeResponse> => {
  const response = await api.post('/mercadopago/subscribe', payload);
  return response.data;
};

/**
 * Cancela la suscripción activa del usuario.
 */
export const cancelSubscription = async (): Promise<any> => {
  const response = await api.post('/mercadopago/cancel-subscription');
  return response.data;
};

/**
 * Obtiene el estado actual de la suscripción del usuario.
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const response = await api.get('/mercadopago/subscription-status');
  return response.data;
};
