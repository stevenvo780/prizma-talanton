import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface Props {
  show: boolean;
  onHide: () => void;
  planName: string;
  frequency: 'MONTHLY' | 'ANNUALLY';
}

const ConfirmationModal: React.FC<Props> = ({
  show,
  onHide,
  planName,
  frequency
}) => (
  <Modal show={show} onHide={onHide} centered>
    <Modal.Header closeButton>
      <Modal.Title>¡Suscripción exitosa!</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>Plan: {planName}</p>
      <p>Frecuencia: {frequency === 'MONTHLY' ? 'Mensual' : 'Anual'}</p>
      <p>Gracias por su confianza.</p>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="primary" onClick={onHide}>
        Cerrar
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmationModal;
