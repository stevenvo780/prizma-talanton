import React, { useState } from 'react';
import { Container, Row, Col, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import SubscriptionConfirm from '../../components/CreditCardForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import { subscribe as subscribeApi, PlanType, Frequency } from '../../services/mercadoPagoApi';
import { addNotification } from '../../redux/ui';
import {
  RocketTakeoffFill,
  StarFill,
  Gem,
  CheckLg,
  ShieldLockFill,
  LightningChargeFill,
  TelephoneFill,
  LightbulbFill,
  CreditCard2Back,
} from 'react-bootstrap-icons';
import './Subscribe.css';

const PLAN_DETAILS: Array<{
  type: PlanType;
  name: string;
  price: number;
  invoiceLimit: number;
  color: string;
  icon: React.ReactNode | string;
  features: string[];
  popular?: boolean;
}> = [
  { 
    type: 'BASIC', 
    name: 'Básico', 
    price: 49000, 
    invoiceLimit: 200,
    color: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
    icon: <RocketTakeoffFill size={28} />,
    features: [
      '200 facturas/mes',
      'POS web completo',
      'API REST incluida',
      'Webhooks básicos',
      '1 usuario',
      'Soporte por email',
    ]
  },
  { 
    type: 'STANDARD', 
    name: 'Estándar', 
    price: 99000, 
    invoiceLimit: 1000,
    color: 'linear-gradient(135deg, var(--success-color) 0%, var(--primary-color) 100%)',
    icon: <StarFill size={28} />,
    features: [
      '1.000 facturas/mes',
      'POS end-to-end completo',
      'API REST + webhooks avanzados',
      'Integración DIAN automática',
      'Notificaciones en tiempo real',
      '5 usuarios',
      'Soporte prioritario',
    ],
    popular: true
  },
  { 
    type: 'PREMIUM', 
    name: 'Premium', 
    price: 199000, 
    invoiceLimit: 999999,
    color: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--dark-color) 100%)',
    icon: <Gem size={28} />,
    features: [
      'Facturas ilimitadas',
      'POS + API + Webhooks sin límites',
      'SDK & documentación API completa',
      'Integración DIAN + Alegra',
      'Webhooks personalizados',
      'Usuarios ilimitados',
      'Soporte 24/7 dedicado',
      'Personalización completa',
    ]
  }
];

const SubscribePage: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedPlan, setSelectedPlan] = useState(PLAN_DETAILS[0]);
  const [frequency, setFrequency] = useState<Frequency>('MONTHLY');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const openForm = (plan: typeof PLAN_DETAILS[0]) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleSubscribeConfirm = async () => {
    setLoading(true);
    try {
      const result = await subscribeApi({
        planType: selectedPlan.type,
        frequency,
      });

      if (result.success && result.data?.initPoint) {
        dispatch(addNotification({ message: result.message || 'Redirigiendo a Mercado Pago...', color: 'success' }));
        window.location.href = result.data.initPoint;
      } else {
        dispatch(addNotification({ 
          message: result.message || 'Error en la suscripción', 
          color: 'danger' 
        }));
      }
    } catch (err: any) {
      dispatch(addNotification({ 
        message: err.response?.data?.message || 'Error en la suscripción', 
        color: 'danger' 
      }));
    } finally {
      setLoading(false);
      setShowForm(false);
    }
  };

  return (
    <div className="subscribe-page">
      {/* Hero Section */}
      <section className="hero-section text-center py-5">
        <Container>
          <h1 className="hero-title">Elige el plan perfecto para tu negocio</h1>
          <p className="hero-subtitle">
            POS end-to-end con API REST y webhooks para conectar tu operación de extremo a extremo
          </p>
          <div className="frequency-toggle">
            <button 
              className={`freq-btn ${frequency === 'MONTHLY' ? 'active' : ''}`}
              onClick={() => setFrequency('MONTHLY')}
            >
              Mensual
            </button>
            <button 
              className={`freq-btn ${frequency === 'ANNUALLY' ? 'active' : ''}`}
              onClick={() => setFrequency('ANNUALLY')}
            >
              Anual <span className="discount-badge">-20%</span>
            </button>
          </div>
        </Container>
      </section>

      {/* Plans Section */}
      <Container className="plans-section py-5" data-tour="subscribe-plans">
        <Row className="justify-content-center">
          {PLAN_DETAILS.map((plan, index) => (
            <Col lg={4} md={6} sm={12} key={plan.type} className="mb-4">
              <div className={`plan-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="popular-badge">Más Popular</div>}
                
                <div className="plan-header" style={{ background: plan.color }}>
                  <div className="plan-icon">{plan.icon}</div>
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    <span className="currency">$</span>
                    <span className="amount">
                      {(frequency === 'ANNUALLY'
                        ? Math.round(plan.price * 0.8)
                        : plan.price
                      ).toLocaleString('es-CO')}
                    </span>
                    <span className="period">/{frequency === 'MONTHLY' ? 'mes' : 'año'}</span>
                  </div>
                  {frequency === 'ANNUALLY' && (
                    <div className="savings">
                      Ahorra ${Math.round(plan.price * 0.2 * 12).toLocaleString('es-CO')} al año
                    </div>
                  )}
                </div>

                <div className="plan-body">
                  <div className="invoice-limit">
                    <strong>{plan.invoiceLimit >= 999999 ? 'Ilimitadas' : plan.invoiceLimit.toLocaleString('es-CO')}</strong> facturas incluidas
                  </div>
                  
                  <ul className="features-list">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>
                        <span className="check-icon"><CheckLg /></span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button 
                    className="subscribe-btn"
                    onClick={() => openForm(plan)}
                  >
                    Comenzar ahora
                  </button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Trust Section */}
      <section className="trust-section py-5">
        <Container>
          <Row className="text-center">
            <Col md={3} sm={6}>
              <div className="trust-item">
                <div className="trust-icon"><ShieldLockFill size={32} /></div>
                <h4>Seguro</h4>
                <p>Datos protegidos con encriptación SSL y firma DIAN</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="trust-item">
                <div className="trust-icon"><LightningChargeFill size={32} /></div>
                <h4>API en tiempo real</h4>
                <p>REST API + webhooks para integrar cualquier sistema</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="trust-item">
                <div className="trust-icon"><TelephoneFill size={32} /></div>
                <h4>Soporte</h4>
                <p>Equipo técnico colombiano cuando lo necesites</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="trust-item">
                <div className="trust-icon"><LightbulbFill size={32} /></div>
                <h4>End-to-End</h4>
                <p>Desde el POS hasta la factura DIAN sin fricciones</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Modals */}
      {/* Modal de Confirmación */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered size="lg">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>
            <span className="modal-icon"><CreditCard2Back size={24} /></span>
            Confirmar Suscripción
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <SubscriptionConfirm
            onConfirm={handleSubscribeConfirm}
            loading={loading}
            onCancel={() => setShowForm(false)}
            planName={selectedPlan.name}
            frequency={frequency === 'MONTHLY' ? 'Mensual' : 'Anual'}
          />
        </Modal.Body>
      </Modal>

      <ConfirmationModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        planName={selectedPlan.name}
        frequency={frequency}
      />
    </div>
  );
};

export default SubscribePage;
