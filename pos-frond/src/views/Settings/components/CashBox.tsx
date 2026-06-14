import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, Container } from 'react-bootstrap';
import { PencilFill, TrashFill, PlusCircleFill, CashCoin } from 'react-bootstrap-icons';
import api from '../../../utils/axios';
import { CashBox } from '../../../utils/types';
import { addNotification } from '../../../redux/ui';
import { useDispatch } from 'react-redux';

import { fmtCOP as fmt } from '../../../utils/format';

const CashBoxCRUD: React.FC = () => {
  const dispatch = useDispatch();
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [selectedCashBox, setSelectedCashBox] = useState<CashBox | null>(null);
  const [name, setName] = useState<string>('');
  const [cashIn, setCashIn] = useState(0);
  const [cashOut, setCashOut] = useState(0);
  const [balance, setBalance] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchCashBoxes(); }, []);

  const fetchCashBoxes = async () => {
    const response = await api.get('/cash-box');
    setCashBoxes(response.data);
  };

  const handleShowModal = (cashBox: CashBox | null = null) => {
    if (cashBox) {
      setSelectedCashBox(cashBox);
      setName(cashBox.name);
      setCashIn(cashBox.cashIn);
      setCashOut(cashBox.cashOut);
      setBalance(cashBox.balance);
    } else {
      setSelectedCashBox(null);
      setName('');
      setCashIn(0);
      setCashOut(0);
      setBalance(0);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCashBox(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selectedCashBox) {
        await api.patch(`/cash-box/${selectedCashBox.id}`, { name, cashIn, cashOut, balance });
      } else {
        await api.post('/cash-box', { name, cashIn, cashOut, balance });
      }
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchCashBoxes();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
    }
  };

  const deleteCashBox = async (cashBox: CashBox) => {
    try {
      await api.delete(`/cash-box/${cashBox.id}`);
      dispatch(addNotification({ message: 'Se borro correctamente', color: 'success' }));
      fetchCashBoxes();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al eliminar', color: 'danger' }));
    }
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0">Cajas</h5>
          <small className="text-muted">Administra las cajas registradoras</small>
        </div>
        <Button
          size="sm"
          onClick={() => handleShowModal()}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px' }}
          className="d-flex align-items-center gap-2"
        >
          <PlusCircleFill size={14} />
          <span>Nueva caja</span>
        </Button>
      </div>

      {cashBoxes.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <CashCoin size={48} className="mb-3 opacity-25" />
          <p className="mb-0">No hay cajas registradas.</p>
        </div>
      ) : (
        <Row className="g-3">
          {cashBoxes.map((cashBox: CashBox) => (
            <Col key={cashBox.id} xs={12} sm={6} xl={4}>
              <div className="rounded-3 p-3 h-100" style={{ border: '1px solid #e9ecef', background: '#fafafa' }}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <p className="fw-semibold mb-0" style={{ fontSize: '1rem' }}>{cashBox.name}</p>
                    <Badge bg="secondary" className="mt-1" style={{ fontSize: '0.7rem' }}>#{cashBox.id}</Badge>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-light btn-sm rounded-2 p-1" onClick={() => handleShowModal(cashBox)} title="Editar" style={{ lineHeight: 1 }}>
                      <PencilFill size={13} className="text-primary" />
                    </button>
                    <button className="btn btn-light btn-sm rounded-2 p-1" onClick={() => deleteCashBox(cashBox)} title="Eliminar" style={{ lineHeight: 1 }}>
                      <TrashFill size={13} className="text-danger" />
                    </button>
                  </div>
                </div>
                <Row className="g-2 mt-1 text-center">
                  <Col>
                    <div className="rounded-2 p-2" style={{ background: '#d1fae5' }}>
                      <p style={{ fontSize: '0.65rem', color: '#065f46', marginBottom: 2 }}>ENTRADA</p>
                      <p className="fw-bold mb-0" style={{ fontSize: '0.8rem', color: '#065f46' }}>{fmt(cashBox.cashIn)}</p>
                    </div>
                  </Col>
                  <Col>
                    <div className="rounded-2 p-2" style={{ background: '#fee2e2' }}>
                      <p style={{ fontSize: '0.65rem', color: '#991b1b', marginBottom: 2 }}>SALIDA</p>
                      <p className="fw-bold mb-0" style={{ fontSize: '0.8rem', color: '#991b1b' }}>{fmt(cashBox.cashOut)}</p>
                    </div>
                  </Col>
                  <Col>
                    <div className="rounded-2 p-2" style={{ background: '#ede9fe' }}>
                      <p style={{ fontSize: '0.65rem', color: '#5b21b6', marginBottom: 2 }}>BALANCE</p>
                      <p className="fw-bold mb-0" style={{ fontSize: '0.8rem', color: '#5b21b6' }}>{fmt(cashBox.balance)}</p>
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef' }}>
          <Modal.Title style={{ fontSize: '1.05rem' }}>
            {selectedCashBox ? 'Actualizar caja' : 'Nueva caja'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Nombre</Form.Label>
              <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Caja principal" />
            </Form.Group>
            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Entrada</Form.Label>
                  <Form.Control type="number" value={cashIn} onChange={(e) => setCashIn(Number(e.target.value))} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Salida</Form.Label>
                  <Form.Control type="number" value={cashOut} onChange={(e) => setCashOut(Number(e.target.value))} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Balance</Form.Label>
                  <Form.Control type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e9ecef' }}>
          <Button variant="light" onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSubmit} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}>
            {selectedCashBox ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CashBoxCRUD;
