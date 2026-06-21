import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <Container fluid>
      <h1 style={{ margin: '10px 0 20px' }}>Dashboard</h1>
      <Row>
        <Col md={4}>
          <Card style={{ margin: '10px' }}>
            <Card.Body>
              <Card.Title>Punto de venta</Card.Title>
              <Card.Text>
                Accede directamente a la pantalla de ventas para registrar
                facturas.
              </Card.Text>
              <Link to="/pos">Ir al POS →</Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card style={{ margin: '10px' }}>
            <Card.Body>
              <Card.Title>Productos</Card.Title>
              <Card.Text>
                Gestiona el catálogo, precios, stock e impuestos por producto.
              </Card.Text>
              <Link to="/products">Ver productos →</Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card style={{ margin: '10px' }}>
            <Card.Body>
              <Card.Title>Clientes</Card.Title>
              <Card.Text>
                Consulta y edita la base de datos de clientes del negocio.
              </Card.Text>
              <Link to="/clients">Ver clientes →</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
