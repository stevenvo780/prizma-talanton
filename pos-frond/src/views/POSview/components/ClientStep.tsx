import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import api from '../../../utils/axios';
import { X, ArrowRight } from 'react-bootstrap-icons';
import { Container, Row, Col, Card, Form, Button, Modal } from 'react-bootstrap';
import { Client, TypeDocument } from '../../../utils/types';

interface ClientStepProps {
  client: Client | undefined;
  setClient: (client: Client | undefined) => void;
  onSaveClient: (client: Client | undefined) => void;
}

const ClientStep: React.FC<ClientStepProps> = ({ client, setClient, onSaveClient }) => {
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const loadClientOptions = async (inputValue: string) => {
    console.log("Loading client options with input value:", inputValue);
    try {
      const endpoint = inputValue.trim()
        ? `/client/get/search?q=${encodeURIComponent(inputValue.trim())}`
        : '/client';
      const response = await api.get(endpoint);
      return response.data.map((c: Client) => ({
        value: c,
        label: `${c.name} ${c.surname || ''} - ${c.documentNumber || 'Sin documento'}`
      }));
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  };

  const formatOptionLabel = ({ value, label }: { value: Client, label: string }) => {
    return (
      <div>
        <div style={{ fontWeight: 'bold' }}>{value.name} {value.surname || ''}</div>
        <div style={{ fontSize: '0.8em' }}>
          {value.documentNumber && `Doc: ${value.documentNumber}`}
          {value.documentNumber && value.phone && ' | '}
          {value.phone && `Tel: ${value.phone}`}
        </div>
      </div>
    );
  };

  // Cargar lista de clientes al montar el componente
  const [clientOptions, setClientOptions] = useState<any[]>([]);

  useEffect(() => {
    api.get('/client')
      .then(response => {
        const options = response.data.map((c: Client) => ({
          value: c,
          label: `${c.name} ${c.surname || ''} - ${c.documentNumber || 'Sin documento'}`
        }));
        setClientOptions(options);
      })
      .catch(error => console.error("Error al cargar clientes:", error));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value } as Client);
    if (name === 'documentNumber' || name === 'phone') setError(null);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClient({ ...client, [name]: value } as Client);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clientToSave = { ...client } as Client;
    if (!clientToSave.documentNumber && !clientToSave.phone) {
      setError('Debe ingresar al menos Documento o Teléfono.');
      return;
    }
    onSaveClient(clientToSave);
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <AsyncSelect
                  cacheOptions
                  defaultOptions={clientOptions}
                  loadOptions={loadClientOptions}
                  onChange={opt => setClient(opt ? opt.value : undefined)}
                  value={client ? {
                    value: client,
                    label: `${client.name} ${client.surname || ''} - ${client.documentNumber || 'Sin documento'}`
                  } : null}
                  formatOptionLabel={formatOptionLabel}
                  placeholder="Buscar o seleccionar cliente..."
                  className="flex-grow-1"
                  noOptionsMessage={() => "No se encontraron clientes"}
                  loadingMessage={() => "Cargando clientes..."}
                />
                {client && (
                  <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => setClient(undefined)}>
                    <X />
                  </Button>
                )}
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Documento {!(client?.phone) && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    type="text"
                    name="documentNumber"
                    placeholder="Ingrese número de documento"
                    value={client?.documentNumber || ''}
                    onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Cliente</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Ingrese nombre"
                    value={client?.name || ''}
                    onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Código de Ruta</Form.Label>
                  <Form.Control
                    type="text"
                    name="routeCode"
                    placeholder="Ingrese código de ruta"
                    value={client?.routeCode || ''}
                    onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono {!(client?.documentNumber) && <span className="text-danger">*</span>}</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    placeholder="Ingrese teléfono"
                    value={client?.phone || ''}
                    onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Ingrese email"
                    value={client?.email || ''}
                    onChange={handleChange} />
                </Form.Group>

                {error && <div className="text-danger mb-2">{error}</div>}
                <div className="d-flex justify-content-between mt-4">
                  <Button variant="secondary" size="sm" onClick={() => setShowMore(true)}>
                    Añadir más datos
                  </Button>
                  <Button variant="primary" type="submit">
                    Continuar <ArrowRight />
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showMore} onHide={() => setShowMore(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Añadir más datos</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Apellido Cliente</Form.Label>
                <Form.Control
                  type="text"
                  name="surname"
                  placeholder="Ingrese apellido"
                  value={client?.surname || ''}
                  onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Documento</Form.Label>
                <Form.Select
                  name="typeDocument"
                  value={client?.typeDocument || TypeDocument.CC}
                  onChange={handleSelectChange}>
                  <option value={TypeDocument.CC}>Cédula de Ciudadanía</option>
                  <option value={TypeDocument.NIT}>NIT</option>
                  <option value={TypeDocument.TI}>Tarjeta de Identidad</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Dirección</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  placeholder="Ingrese dirección"
                  value={client?.address || ''}
                  onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Departamento</Form.Label>
                <Form.Control
                  type="text"
                  name="department"
                  placeholder="Ingrese departamento"
                  value={client?.department || ''}
                  onChange={handleChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ciudad</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  placeholder="Ingrese ciudad"
                  value={client?.city || ''}
                  onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Barrio</Form.Label>
                <Form.Control
                  type="text"
                  name="neighborhood"
                  placeholder="Ingrese barrio"
                  value={client?.neighborhood || ''}
                  onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Grupo Residencial</Form.Label>
                <Form.Control
                  type="text"
                  name="residentialGroup"
                  placeholder="Ingrese grupo residencial"
                  value={client?.residentialGroup || ''}
                  onChange={handleChange} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Número de Casa/Apartamento</Form.Label>
                <Form.Control
                  type="text"
                  name="houseNumber"
                  placeholder="Ingrese número de casa o apartamento"
                  value={client?.houseNumber || ''}
                  onChange={handleChange} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMore(false)}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClientStep;
