import React, { useState } from 'react';
import { Button, Alert, Form, Spinner } from 'react-bootstrap';

interface Props {
  onConfirm: () => void;
  loading: boolean;
  onCancel: () => void;
  planName: string;
  frequency: string;
}

const SubscriptionConfirm: React.FC<Props> = ({ 
  onConfirm, 
  loading, 
  onCancel, 
  planName, 
  frequency 
}) => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptDataProcessing, setAcceptDataProcessing] = useState(false);

  const handleConfirm = () => {
    if (acceptTerms && acceptDataProcessing) {
      onConfirm();
    }
  };

  const canProceed = acceptTerms && acceptDataProcessing;

  return (
    <div>
      <Alert variant="info">
        <h5>Confirmar Suscripción</h5>
        <p><strong>Plan:</strong> {planName}</p>
        <p><strong>Frecuencia:</strong> {frequency}</p>
        <p>Serás redirigido a Mercado Pago para completar el pago de forma segura.</p>
      </Alert>

      <Form>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="accept-terms"
            label={
              <span>
                Acepto los{' '}
                <a 
                  href="https://www.mercadopago.com.co/ayuda/terminos-y-condiciones_299" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  términos y condiciones
                </a>{' '}
                de Mercado Pago
              </span>
            }
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            id="accept-data-processing"
            label={
              <span>
                Autorizo el tratamiento de mis datos personales para el procesamiento del pago
              </span>
            }
            checked={acceptDataProcessing}
            onChange={(e) => setAcceptDataProcessing(e.target.checked)}
          />
        </Form.Group>

        <Alert variant="warning" className="small">
          <strong>Información importante:</strong>
          <ul className="mb-0 mt-2">
            <li>El pago se procesará a través de Mercado Pago, una plataforma segura certificada</li>
            <li>Recibirás una confirmación por email una vez completado el pago</li>
            <li>Puedes cancelar tu suscripción en cualquier momento</li>
          </ul>
        </Alert>
      </Form>
      
      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleConfirm} 
          disabled={!canProceed || loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Procesando...
            </>
          ) : (
            'Continuar a Pago'
          )}
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionConfirm;
