import React, { useState } from 'react';
import { Container, Tab, Nav } from 'react-bootstrap';
import ProductsCRUD from './components/ProductsCRUD';
import CategoryCRUD from './components/Category';
import CategoryPricingCRUD from './components/CategoryPricing';

const Products: React.FC = () => {
  const [activeKey, setActiveKey] = useState('products');

  return (
    <Container fluid>
      <h2 className="mt-3 mb-3">Gestión de Productos</h2>
      <Tab.Container activeKey={activeKey} onSelect={(k) => k && setActiveKey(k)}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="products" data-tour="products-tab-products">Productos</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="categories" data-tour="products-tab-categories">Categorías</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="categoryPricing" data-tour="products-tab-pricing">Categorías de Precios</Nav.Link>
          </Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="products">
            <ProductsCRUD />
          </Tab.Pane>
          <Tab.Pane eventKey="categories">
            <CategoryCRUD />
          </Tab.Pane>
          <Tab.Pane eventKey="categoryPricing">
            <CategoryPricingCRUD />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  );
};

export default Products;
