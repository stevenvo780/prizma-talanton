import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, Container } from 'react-bootstrap';
import { PencilFill, TrashFill, PlusCircleFill, Calculator } from 'react-bootstrap-icons';
import api from '../../../utils/axios';
import { Taxes, Operators } from '../../../utils/types';
import { addNotification } from '../../../redux/ui';
import { useDispatch } from 'react-redux';

const TaxesCRUD: React.FC = () => {
  const dispatch = useDispatch();
  const [taxes, setTaxes] = useState<Taxes[]>([]);
  const [selectedTax, setSelectedTax] = useState<Taxes | null>(null);
  const [name, setName] = useState('');
  const [value, setValue] = useState(0);
  const [operator, setOperator] = useState(Operators.Percentage);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchTaxes(); }, []);

  const fetchTaxes = async () => {
    const response = await api.get('/taxes');
    setTaxes(response.data);
  };

  const handleShowModal = (tax: Taxes | null = null) => {
    setSelectedTax(tax);
    setName(tax ? tax.name : '');
    setValue(tax ? tax.value : 0);
    setOperator(tax ? tax.operator : Operators.Percentage);
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setSelectedTax(null); };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selectedTax) {
        await api.patch(`/taxes/${selectedTax.id}`, { name, value, operator });
      } else {
        await api.post('/taxes', { name, value, operator });
      }
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchTaxes();
      handleCloseModal();
    } catch (error) {
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
    }
  };

  const deleteTax = async (tax: Taxes) => {
    try {
      await api.delete(`/taxes/${tax.id}`);
      dispatch(addNotification({ message: 'Se borro correctamente', color: 'success' }));
      fetchTaxes();
    } catch (error) {
      dispatch(addNotification({ message: 'Error al borrar', color: 'danger' }));
    }
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0">Impuestos</h5>
          <small className="text-muted">Configura los impuestos aplicables</small>
        </div>
        <Button
          size="sm"
          onClick={() => handleShowModal()}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px' }}
          className="d-flex align-items-center gap-2"
        >
          <PlusCircleFill size={14} />
          <span>Nuevo impuesto</span>
        </Button>
      </div>

      {taxes.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <Calculator size={48} className="mb-3 opacity-25" />
          <p className="mb-0">No hay impuestos registrados.</p>
        </div>
      ) : (
        <Row className="g-3">
          {taxes.map((tax: Taxes) => (
            <Col key={tax.id} xs={12} sm={6} xl={4}>
              <div className="rounded-3 p-3 h-100" style={{ border: '1px solid #e9ecef', background: '#fafafa' }}>
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <p className="fw-semibold mb-1" style={{ fontSize: '1rem' }}>{tax.name}</p>
                    <div className="d-flex gap-2 align-items-center">
                      <Badge bg="primary" style={{ fontSize: '0.75rem' }}>{tax.value}{tax.operator === Operators.Percentage ? '%' : ''}</Badge>
                      <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>{tax.operator}</Badge>
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-light btn-sm rounded-2 p-1" onClick={() => handleShowModal(tax)} title="Editar" style={{ lineHeight: 1 }}>
                      <PencilFill size={13} className="text-primary" />
                    </button>
                    <button className="btn btn-light btn-sm rounded-2 p-1" onClick={() => deleteTax(tax)} title="Eliminar" style={{ lineHeight: 1 }}>
                      <TrashFill size={13} className="text-danger" />
                    </button>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef' }}>
          <Modal.Title style={{ fontSize: '1.05rem' }}>
            {selectedTax ? 'Actualizar impuesto' : 'Nuevo impuesto'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Nombre</Form.Label>
              <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: IVA 19%" />
            </Form.Group>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Valor</Form.Label>
                  <Form.Control type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>Operador</Form.Label>
                  <Form.Select value={operator} onChange={(e) => setOperator(e.target.value as Operators)}>
                    <option value={Operators.Percentage}>{Operators.Percentage}</option>
                    <option value={Operators.Subtraction}>{Operators.Subtraction}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #e9ecef' }}>
          <Button variant="light" onClick={handleCloseModal}>Cancelar</Button>
          <Button onClick={handleSubmit} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none' }}>
            {selectedTax ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TaxesCRUD;
