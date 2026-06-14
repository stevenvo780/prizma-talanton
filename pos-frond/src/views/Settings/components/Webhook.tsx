import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Pagination, Row, Col, Container } from 'react-bootstrap';
import api from '../../../utils/axios';
import { Webhook, HttpMethod, RouteApi } from '../../../utils/types';
import { addNotification } from '../../../redux/ui';
import { useDispatch } from 'react-redux';

const WebhookCRUD: React.FC = () => {
  const dispatch = useDispatch();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [bounceRoute, setBounceRoute] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState<HttpMethod>(HttpMethod.GET);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [webhooksPerPage] = useState(5);

  const fetchWebhooks = async () => {
    const response = await api.get('/webhook');
    setWebhooks(response.data);
  };

  const handleShowModal = (webhook: Webhook | null = null) => {
    if (webhook) {
      setSelectedWebhook(webhook);
      setBounceRoute(webhook.bounceRoute);
      setTargetUrl(webhook.targetUrl);
      setHttpMethod(webhook.httpMethod);
    } else {
      setBounceRoute('');
      setTargetUrl('');
      setHttpMethod(HttpMethod.GET);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedWebhook(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selectedWebhook) {
        await api.patch(`/webhook/${selectedWebhook.id}`, { bounceRoute, targetUrl, httpMethod });
      } else {
        await api.post('/webhook', { bounceRoute, targetUrl, httpMethod });
      }
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchWebhooks();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
    }
  };

  const deleteWebhook = async (webhook: Webhook) => {
    try {
      await api.delete(`/webhook/${webhook.id}`);
      fetchWebhooks();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al eliminar', color: 'danger' }));
    }
  };

  const indexOfLastWebhook = currentPage * webhooksPerPage;
  const indexOfFirstWebhook = indexOfLastWebhook - webhooksPerPage;
  const currentWebhooks = webhooks.slice(indexOfFirstWebhook, indexOfLastWebhook);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  let active = currentPage;
  let items = [];
  for (let number = 1; number <= Math.ceil(webhooks.length / webhooksPerPage); number++) {
    items.push(
      <Pagination.Item key={number} active={number === active} onClick={() => paginate(number)}>
        {number}
      </Pagination.Item>,
    );
  }

  const [bounceRoutes, setBounceRoutes] = useState<RouteApi[]>([]);

  const fetchBounceRoutes = async () => {
    const response = await api.get('/routes');
    setBounceRoutes(response.data);
  };
  useEffect(() => {
    fetchWebhooks();
    fetchBounceRoutes();
  }, []);
  return (
    <Container fluid>
      <Button variant="outline-primary" onClick={() => handleShowModal()} style={{ margin: '10px' }}>Crear nuevo webhook</Button>
      <Table bordered>
        <thead>
          <tr>
            <th>#</th>
            <th>Ruta de rebote</th>
            <th>URL objetivo</th>
            <th>Método HTTP</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentWebhooks.map((webhook: Webhook, index: number) => (
            <tr key={webhook.id}>
              <td>{index + 1}</td>
              <td>{webhook.bounceRoute}</td>
              <td>{webhook.targetUrl}</td>
              <td>{webhook.httpMethod}</td>
              <td>
                <Button variant="outline-info" onClick={() => handleShowModal(webhook)} style={{ margin: '5px' }}>Editar</Button>
                <Button variant="outline-danger" onClick={() => deleteWebhook(webhook)} style={{ margin: '5px' }}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination style={{ margin: '10px' }}>{items}</Pagination>
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title>{selectedWebhook ? 'Actualizar' : 'Crear'} Webhook</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
          <Form>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Control as="select" style={{ margin: '10px 0' }} value={bounceRoute} onChange={(e) => setBounceRoute(e.target.value)}>
                    {bounceRoutes.map((route, index) => (
                      <option key={index} value={route.path}>{route.method} - {route.path}</option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Control style={{ margin: '10px 0' }} placeholder='URL objetivo' type="text" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Control as="select" style={{ margin: '10px 0' }} value={httpMethod} onChange={(e) => setHttpMethod(e.target.value as HttpMethod)}>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit} variant="outline-success" type="submit">
            {selectedWebhook ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default WebhookCRUD;
