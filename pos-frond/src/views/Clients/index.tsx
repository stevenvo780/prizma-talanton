import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Pagination, Row, Col, Container, Card, Collapse } from 'react-bootstrap';
import api from '../../utils/axios';
import { Client, TypeDocument } from '../../utils/types';
import { addNotification } from '../../redux/ui';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { EyeFill, CheckCircle, Trash, FunnelFill, Download, ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import './ClientList.css';

const ClientCRUD: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [name, setName] = useState<string | undefined>();
  const [surname, setSurname] = useState<string | undefined>();
  const [email, setEmail] = useState<string | undefined>();
  const [phone, setPhone] = useState<string | undefined>();
  const [address, setAddress] = useState<string | undefined>();
  const [documentNumber, setDocumentNumber] = useState<string | undefined>();
  const [typeDocument, setTypeDocument] = useState<TypeDocument>(TypeDocument.CC);
  const [department, setDepartment] = useState<string | undefined>();
  const [city, setCity] = useState<string | undefined>();
  const [neighborhood, setNeighborhood] = useState<string | undefined>();
  const [residentialGroup, setResidentialGroup] = useState<string | undefined>();
  const [houseNumber, setHouseNumber] = useState<string | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(8);
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeDocumentFilter, setTypeDocumentFilter] = useState<TypeDocument | ''>('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const params = new URLSearchParams();
        if (searchFilter) params.append('search', searchFilter);
        if (departmentFilter) params.append('department', departmentFilter);
        if (cityFilter) params.append('city', cityFilter);
        if (typeDocumentFilter) params.append('typeDocument', typeDocumentFilter);
        
        const response = await api.get(`/client?${params.toString()}`);
        setFilteredClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        dispatch(addNotification({ message: 'Error al cargar clientes', color: 'danger' }));
      }
    };

    fetchClients();
  }, [searchFilter, departmentFilter, cityFilter, typeDocumentFilter, dispatch]);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilter) params.append('search', searchFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (cityFilter) params.append('city', cityFilter);
      if (typeDocumentFilter) params.append('typeDocument', typeDocumentFilter);
      
      const response = await api.get(`/client?${params.toString()}`);
      setFilteredClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      dispatch(addNotification({ message: 'Error al cargar clientes', color: 'danger' }));
    }
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilter) params.append('search', searchFilter);
      if (departmentFilter) params.append('department', departmentFilter);
      if (cityFilter) params.append('city', cityFilter);
      if (typeDocumentFilter) params.append('typeDocument', typeDocumentFilter);
      
      const response = await api.get(`/client/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Crear URL para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener fecha actual para el nombre del archivo
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      link.setAttribute('download', `clientes_${dateStr}.xlsx`);
      
      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL
      window.URL.revokeObjectURL(url);
      
      dispatch(addNotification({ message: 'Archivo Excel descargado exitosamente', color: 'success' }));
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      dispatch(addNotification({ message: 'Error al exportar a Excel', color: 'danger' }));
    }
  };

  const clearFilters = () => {
    setSearchFilter('');
    setDepartmentFilter('');
    setCityFilter('');
    setTypeDocumentFilter('');
  };

  const handleShowModal = (client: Client | null = null) => {
    if (client) {
      setSelectedClient(client);
      if (client.name) setName(client.name);
      if (client.surname) setSurname(client.surname);
      if (client.email) setEmail(client.email);
      if (client.phone) setPhone(client.phone);
      if (client.address) setAddress(client.address);
      if (client.documentNumber) setDocumentNumber(client?.documentNumber);
      if (client.typeDocument) setTypeDocument(client.typeDocument);
      if (client.department) setDepartment(client.department);
      if (client.city) setCity(client.city);
      if (client.neighborhood) setNeighborhood(client.neighborhood);
      if (client.residentialGroup) setResidentialGroup(client.residentialGroup);
      if (client.houseNumber) setHouseNumber(client.houseNumber);
    } else {
      setName(undefined);
      setSurname(undefined);
      setEmail(undefined);
      setPhone(undefined);
      setAddress(undefined);
      setDocumentNumber(undefined);
      setTypeDocument(TypeDocument.CC);
      setDepartment(undefined);
      setCity(undefined);
      setNeighborhood(undefined);
      setResidentialGroup(undefined);
      setHouseNumber(undefined);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  const handleShowDetailModal = (client: Client) => {
    setViewClient(client);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setViewClient(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const clientData = { 
        name, 
        surname, 
        email, 
        phone, 
        address, 
        documentNumber, 
        typeDocument,
        department,
        city,
        neighborhood,
        residentialGroup,
        houseNumber
      };
      
      if (selectedClient) {
        await api.patch(`/client/${selectedClient.id}`, clientData);
      } else {
        await api.post('/client', clientData);
      }
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchClients();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
    }
  };

  const deleteClient = async (client: Client) => {
    try {
      await api.delete(`/client/${client.id}`);
      dispatch(addNotification({ message: 'Se borro correctamente', color: 'success' }));
      fetchClients();
      handleCloseDetailModal();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al eliminar', color: 'danger' }));
    }
  };

  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  let active = currentPage;
  let items = [];
  for (let number = 1; number <= Math.ceil(filteredClients.length / clientsPerPage); number++) {
    items.push(
      <Pagination.Item key={number} active={number === active} onClick={() => paginate(number)}>
        {number}
      </Pagination.Item>,
    );
  }

  return (
    <Container fluid>
      {/* Panel de estadísticas */}
      <div className="clients-stats">
        <Row>
          <Col md={12}>
            <Row>
              <Col md={4}>
                <div className="h4">{filteredClients.length}</div>
                <small>Total de Clientes</small>
              </Col>
              <Col md={4}>
                <div className="h4">{Array.from(new Set(filteredClients.map(c => c.department).filter(Boolean))).length}</div>
                <small>Departamentos</small>
              </Col>
              <Col md={4}>
                <div className="h4">{Array.from(new Set(filteredClients.map(c => c.city).filter(Boolean))).length}</div>
                <small>Ciudades</small>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Panel de filtros */}
      <div className="clients-filters" data-tour="clients-search">
        <div className="d-flex justify-content-between align-items-center">
          <h6>
            <FunnelFill className="me-2" />
            Filtros de Búsqueda
          </h6>
          <Button
            variant="link"
            className="p-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
        
        <Collapse in={showFilters}>
          <div>
            <Row className="mt-3">
              <Col md={3}>
                <div className="clients-filter-section">
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre, email, teléfono..."
                    value={searchFilter}
                    onChange={(e) => {
                      setSearchFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </Col>
              <Col md={3}>
                <div className="clients-filter-section">
                  <Form.Control
                    type="text"
                    placeholder="Filtrar por departamento"
                    value={departmentFilter}
                    onChange={(e) => {
                      setDepartmentFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </Col>
              <Col md={3}>
                <div className="clients-filter-section">
                  <Form.Control
                    type="text"
                    placeholder="Filtrar por ciudad"
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </Col>
              <Col md={3}>
                <div className="clients-filter-section">
                  <Form.Select
                    value={typeDocumentFilter}
                    onChange={(e) => {
                      setTypeDocumentFilter(e.target.value as TypeDocument | '');
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Todos los tipos de documento</option>
                    <option value={TypeDocument.CC}>Cédula de Ciudadanía</option>
                    <option value={TypeDocument.NIT}>NIT</option>
                    <option value={TypeDocument.TI}>Tarjeta de Identidad</option>
                  </Form.Select>
                </div>
              </Col>
            </Row>
            
            <Row className="mt-2">
              <Col>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={clearFilters}
                  className="me-2"
                >
                  Limpiar Filtros
                </Button>
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={exportToExcel}
                >
                  <Download className="me-1" />
                  Exportar a Excel
                </Button>
              </Col>
            </Row>
          </div>
        </Collapse>
      </div>

      {/* Acciones principales */}
      <div className="clients-actions">
        <Button variant="outline-primary" onClick={() => handleShowModal()} data-tour="clients-add-btn">
          Crear nuevo cliente
        </Button>
      </div>
      
      <Row xs={1} md={2} lg={4} className="g-4" data-tour="clients-table">
        {currentClients.map((client: Client) => (
          <Col key={client.id}>
            <Card className="h-100 shadow-sm">
              <Card.Body>
                <Card.Title>{client.name} {client.surname}</Card.Title>
                <Card.Text>
                  <i className="bi bi-envelope"></i> {client.email}<br />
                  <i className="bi bi-telephone"></i> {client.phone}
                </Card.Text>
                <Row className="mt-3">
                  <Col xs={6} className="px-1">
                    <Button variant="outline-info" size="sm" onClick={() => handleShowDetailModal(client)} className="w-100">
                      <EyeFill className="me-1" /> Detalle
                    </Button>
                  </Col>
                  <Col xs={6} className="px-1">
                    <Button variant="outline-primary" size="sm" onClick={() => navigate(`/pos?clientId=${client.id}`)} className="w-100">
                      <CheckCircle className="me-1" /> Seleccionar
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Pagination style={{ margin: '20px 0', justifyContent: 'center' }}>{items}</Pagination>
      
      {/* Modal para creación/edición */}
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title>{selectedClient ? 'Actualizar' : 'Crear'} Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Nombre' type="text" value={name} onChange={(e) => setName(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Apellido' type="text" value={surname} onChange={(e) => setSurname(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Email' type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Teléfono' type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Número de Documento' type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
                  <Form.Select style={{ margin: '10px 0' }} value={typeDocument} onChange={(e) => setTypeDocument(e.target.value as TypeDocument)}>
                    <option value={TypeDocument.CC}>Cédula de Ciudadanía</option>
                    <option value={TypeDocument.NIT}>NIT</option>
                    <option value={TypeDocument.TI}>Tarjeta de Identidad</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Dirección' type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Departamento' type="text" value={department} onChange={(e) => setDepartment(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Ciudad' type="text" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Barrio' type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Grupo Residencial' type="text" value={residentialGroup} onChange={(e) => setResidentialGroup(e.target.value)} />
                  <Form.Control style={{ margin: '10px 0' }} placeholder='Número de Casa/Apartamento' type="text" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit} variant="outline-success" type="submit">
            {selectedClient ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para ver detalles */}
      <Modal show={showDetailModal} onHide={handleCloseDetailModal}>
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title>Detalles del Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
          {viewClient && (
            <div>
              <p><strong>Nombre:</strong> {viewClient.name} {viewClient.surname}</p>
              <p><strong>Email:</strong> {viewClient.email}</p>
              <p><strong>Teléfono:</strong> {viewClient.phone}</p>
              <p><strong>Tipo de Documento:</strong> {viewClient.typeDocument}</p>
              <p><strong>Número de Documento:</strong> {viewClient.documentNumber}</p>
              <p><strong>Dirección:</strong> {viewClient.address}</p>
              <p><strong>Departamento:</strong> {viewClient.department}</p>
              <p><strong>Ciudad:</strong> {viewClient.city}</p>
              <p><strong>Barrio:</strong> {viewClient.neighborhood}</p>
              <p><strong>Grupo Residencial:</strong> {viewClient.residentialGroup}</p>
              <p><strong>Número de Casa/Apartamento:</strong> {viewClient.houseNumber}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-info" size="sm" onClick={() => {
            handleShowModal(viewClient);
            handleCloseDetailModal();
          }}>
            <EyeFill className="me-1" /> Editar
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => viewClient && deleteClient(viewClient)}>
            <Trash className="me-1" /> Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClientCRUD;
