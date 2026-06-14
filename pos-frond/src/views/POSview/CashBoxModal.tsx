import React from 'react';
import { Modal, Button, Dropdown, Form, Row, Col } from 'react-bootstrap';
import { CashBox } from '../../utils/types';
import { fmtCOP } from '../../utils/format';

interface CashBoxModalProps {
  showCashBoxModal: boolean;
  setShowCashBoxModal: (show: boolean) => void;
  cashBoxes: CashBox[];
  selectedCashBox: CashBox | null;
  setSelectedCashBox: (cashBox: CashBox | null) => void;
  cashBoxAction: string;
  setCashBoxAction: (action: string) => void;
  cashBoxAmount: string;
  setCashBoxAmount: (amount: string) => void;
  handleCashBoxAction: () => Promise<void>;
}

const CashBoxModal: React.FC<CashBoxModalProps> = ({ showCashBoxModal, setShowCashBoxModal, cashBoxes, selectedCashBox, setSelectedCashBox, cashBoxAction, setCashBoxAction, cashBoxAmount, setCashBoxAmount, handleCashBoxAction }) => {
  return (
    <Modal show={showCashBoxModal} onHide={() => setShowCashBoxModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Caja</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Dropdown onSelect={(key) => {
          const cashBox: CashBox | undefined = cashBoxes.find(box => box.id === Number(key));
          if (cashBox) {
            setSelectedCashBox(cashBox);
          }
        }}>
          <Dropdown.Toggle variant="success" id="dropdown-basic">
            {selectedCashBox ? `Caja ${selectedCashBox.id}: Balance ${fmtCOP(selectedCashBox.balance)}` : 'Seleccione una caja'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {cashBoxes.map((box) => (
              <Dropdown.Item key={box.id} eventKey={box.id?.toString()}>{`Caja ${box.id}: Balance ${fmtCOP(box.balance)}`}</Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
        <br />
        <Row>
          <Col sm="4">
            <Form.Check
              type='radio'
              id='cash-in'
              label='Entrada de Caja'
              checked={cashBoxAction === 'cash-in'}
              onChange={() => setCashBoxAction('cash-in')}
            />
          </Col>
          <Col sm="4">
            <Form.Check
              type='radio'
              id='cash-out'
              label='Salida de Caja'
              checked={cashBoxAction === 'cash-out'}
              onChange={() => setCashBoxAction('cash-out')}
            />
          </Col>
          <Col sm="4">
            <Form.Check
              type='radio'
              id='adjust-balance'
              label='Ajustar Balance'
              checked={cashBoxAction === 'adjust-balance'}
              onChange={() => setCashBoxAction('adjust-balance')}
            />
          </Col>
        </Row>
        <br />
        <Form.Control type="number" placeholder="Cantidad" value={cashBoxAmount} onChange={e => setCashBoxAmount(e.target.value)} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowCashBoxModal(false)}>
          Cerrar
        </Button>
        <Button variant="primary" onClick={handleCashBoxAction}>
          Guardar Cambios
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CashBoxModal;
