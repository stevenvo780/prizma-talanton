import React from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import {
  CashCoin,
  Bank,
  JournalText,
  CreditCard,
  HandThumbsUp,
  ArrowLeft,
  CheckLg,
} from 'react-bootstrap-icons';
import { Product, ProductPriceType, PaymentType, PaymentStatus } from '../../../utils/types';
import { fmtCOP as fmt } from '../../../utils/format';

interface SummaryItem {
  product: Product;
  productQuantity: number;
  productSubtotal: number;
}

interface PaymentStepProps {
  selectedProducts: { product: Product; selectPriceType: ProductPriceType }[];
  summaryPerProduct: SummaryItem[];
  totalAmount: number;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  setPaymentType: (type: PaymentType) => void;
  invoiceType: string;
  setInvoiceType: (type: string) => void;
  paymentStatus: PaymentStatus;
  handlePaymentStatusChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onFinalize: () => void;
}

const PAYMENT_METHODS = [
  { name: 'Efectivo',      Icon: CashCoin,    type: PaymentType.CashOnDelivery,   color: '#10b981' },
  { name: 'Transferencia', Icon: Bank,        type: PaymentType.GatewayPayment,   color: '#3b82f6' },
  { name: 'CxC',           Icon: JournalText, type: PaymentType.AccountReceivable,color: '#f59e0b' },
  { name: 'Tarjetas',      Icon: CreditCard,  type: PaymentType.GatewayPayment,   color: '#6366f1' },
  { name: 'Fiar',          Icon: HandThumbsUp,  type: PaymentType.Fiar,             color: '#ec4899' },
];

const PaymentStep: React.FC<PaymentStepProps> = ({
  selectedProducts,
  summaryPerProduct,
  totalAmount,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  setPaymentType,
  invoiceType,
  setInvoiceType,
  paymentStatus,
  handlePaymentStatusChange,
  onBack,
  onFinalize,
}) => (
  <Container fluid className="px-2 px-md-4 py-3">
    <Row className="g-3">
      {/* Left: items list */}
      <Col xs={12} md={5}>
        <div className="rounded-3 p-3" style={{ border: '1px solid #e9ecef', background: '#fafafa' }}>
          <p className="fw-semibold mb-2" style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resumen del pedido
          </p>
          <div style={{ maxHeight: '45vh', overflowY: 'auto' }}>
            {selectedProducts.map((sp, i) => {
              const summary = summaryPerProduct[i];
              if (!summary) return null;
              return (
                <div key={i} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <p className="mb-0 fw-semibold" style={{ fontSize: '0.875rem' }}>{summary.product.name}</p>
                    <small className="text-muted">{sp.selectPriceType.category?.name} · ×{summary.productQuantity}</small>
                  </div>
                  <span className="fw-bold" style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', paddingLeft: 8 }}>
                    {fmt(summary.productSubtotal)}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            className="d-flex justify-content-between align-items-center mt-3 pt-2 fw-bold"
            style={{ borderTop: '2px solid #e9ecef', fontSize: '1.05rem' }}
          >
            <span>Total</span>
            <span style={{ color: '#6366f1' }}>{fmt(totalAmount)}</span>
          </div>
        </div>
      </Col>

      {/* Right: payment options */}
      <Col xs={12} md={7}>
        {/* Payment method grid */}
        <p className="fw-semibold mb-2" style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Método de pago
        </p>
        <Row className="g-2 mb-3">
          {PAYMENT_METHODS.map(({ name, Icon, type, color }) => {
            const isSelected = selectedPaymentMethod === name;
            return (
              <Col key={name} xs={4} sm={4}>
                <button
                  onClick={() => { setSelectedPaymentMethod(name); setPaymentType(type); }}
                  className="w-100 border-0 rounded-3 p-2 d-flex flex-column align-items-center gap-1"
                  style={{
                    background: isSelected ? color : '#f9fafb',
                    color: isSelected ? '#fff' : '#374151',
                    boxShadow: isSelected ? `0 3px 12px ${color}66` : '0 1px 3px rgba(0,0,0,.08)',
                    transition: 'all .18s',
                    cursor: 'pointer',
                    outline: isSelected ? 'none' : '1px solid #e5e7eb',
                    minHeight: 72,
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                  <span style={{ fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500 }}>{name}</span>
                </button>
              </Col>
            );
          })}
        </Row>

        {/* Invoice type */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Tipo de documento</Form.Label>
          <Form.Select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
            <option value="">Seleccione...</option>
            <option value="factura_electronica">Factura Electrónica</option>
            <option value="recibo_pos">Recibo POS</option>
            <option value="documento_equivalente">Documento Equivalente</option>
          </Form.Select>
        </Form.Group>

        {/* Paid toggle */}
        <button
          onClick={() => handlePaymentStatusChange({
            target: { checked: paymentStatus !== PaymentStatus.Paid },
          } as React.ChangeEvent<HTMLInputElement>)}
          className="w-100 rounded-3 border-0 d-flex align-items-center gap-3 p-3 mb-4"
          style={{
            background: paymentStatus === PaymentStatus.Paid ? '#d1fae5' : '#f9fafb',
            border: `2px solid ${paymentStatus === PaymentStatus.Paid ? '#10b981' : '#e5e7eb'}`,
            outline: 'none',
            cursor: 'pointer',
            transition: 'all .2s',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: paymentStatus === PaymentStatus.Paid ? '#10b981' : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background .2s',
              flexShrink: 0,
            }}
          >
            {paymentStatus === PaymentStatus.Paid && <CheckLg size={14} color="#fff" />}
          </div>
          <span className="fw-semibold" style={{ color: paymentStatus === PaymentStatus.Paid ? '#065f46' : '#374151' }}>
            Marcar como Pagado
          </span>
        </button>

        {/* Nav buttons */}
        <div className="d-flex gap-2">
          <Button
            variant="light"
            onClick={onBack}
            className="d-flex align-items-center gap-2 flex-fill justify-content-center"
            style={{ borderRadius: '10px', border: '1px solid #e5e7eb' }}
          >
            <ArrowLeft size={16} /> Atrás
          </Button>
          <Button
            onClick={onFinalize}
            className="d-flex align-items-center gap-2 flex-fill justify-content-center"
            style={{
              background: 'linear-gradient(135deg,#10b981,#059669)',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            <CheckLg size={16} /> Finalizar
          </Button>
        </div>
      </Col>
    </Row>
  </Container>
);

export default PaymentStep;
