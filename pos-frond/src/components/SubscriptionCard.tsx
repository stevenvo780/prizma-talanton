import React from 'react';
import { PlanType, Frequency } from '../services/mercadoPagoApi';

interface Props {
  planType: PlanType;
  planName: string;
  price: number;
  invoiceLimit: number;
  frequency: Frequency;
  onFrequencyChange: (f: Frequency) => void;
  onSubscribe: () => void;
}

const SubscriptionCard: React.FC<Props> = ({
  planName,
  price,
  invoiceLimit,
  frequency,
  onFrequencyChange,
  onSubscribe
}) => (
  <div className="subscription-card p-3 border rounded text-center">
    <h4>{planName}</h4>
    <p>Precio: ${price}</p>
    <p>Límite de facturas: {invoiceLimit}</p>
    <select
      className="form-select mb-2"
      value={frequency}
      onChange={e => onFrequencyChange(e.target.value as Frequency)}
    >
      <option value="MONTHLY">Mensual</option>
      <option value="ANNUALLY">Anual</option>
    </select>
    <button className="btn btn-primary" onClick={onSubscribe}>
      Contratar
    </button>
  </div>
);

export default SubscriptionCard;
