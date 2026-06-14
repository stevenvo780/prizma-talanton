import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Pagination, Container } from 'react-bootstrap';
import api from '../../../utils/axios';
import { CategoryPricing } from '../../../utils/types';
import { addNotification } from '../../../redux/ui';
import { useDispatch } from 'react-redux';

const CategoryPricingCRUD: React.FC = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState<CategoryPricing[]>([]);
  const [selectedCategoryPricing, setSelectedCategoryPricing] = useState<CategoryPricing | null>(null);
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(5);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await api.get('/category-pricing');
    setCategories(response.data);
  };

  const handleShowModal = (categoryPricing: CategoryPricing | null = null) => {
    setSelectedCategoryPricing(categoryPricing);
    setName(categoryPricing ? categoryPricing.name : '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategoryPricing(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selectedCategoryPricing) {
        await api.patch(`/category-pricing/${selectedCategoryPricing.id}`, { name });
      } else {
        await api.post('/category-pricing', { name });
      }
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchCategories();
      handleCloseModal();
    } catch (error) {
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
    }
  };

  const deleteCategoryPricing = async (categoryPricing: CategoryPricing) => {
    try {
      await api.delete(`/category-pricing/${categoryPricing.id}`);
      dispatch(addNotification({ message: 'Se borro correctamente', color: 'success' }));
      fetchCategories();
    } catch (error) {
      dispatch(addNotification({ message: 'Error al borrar', color: 'danger' }));
    }
  };

  const indexOfLastCategoryPricing = currentPage * categoriesPerPage;
  const indexOfFirstCategoryPricing = indexOfLastCategoryPricing - categoriesPerPage;
  const currentCategories = categories.slice(indexOfFirstCategoryPricing, indexOfLastCategoryPricing);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  let active = currentPage;
  let items = [];
  for (let number = 1; number <= Math.ceil(categories.length / categoriesPerPage); number++) {
    items.push(
      <Pagination.Item key={number} active={number === active} onClick={() => paginate(number)}>
        {number}
      </Pagination.Item>,
    );
  }

  return (
    <Container fluid>
      <Button variant="outline-primary" onClick={() => handleShowModal()} style={{ margin: '10px' }}>Crear nueva categoría de precio</Button>
      <Table bordered>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre de la categoría de precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentCategories.map((categoryPricing: CategoryPricing, index: number) => (
            <tr key={categoryPricing.id}>
              <td>{index + 1}</td>
              <td>{categoryPricing.name}</td>
              <td width={"20%"}>
                <Button variant="outline-info" onClick={() => handleShowModal(categoryPricing)} style={{ margin: '5px' }}>Editar</Button>
                <Button variant="outline-danger" onClick={() => deleteCategoryPricing(categoryPricing)} style={{ margin: '5px' }}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination style={{ margin: '10px' }}>{items}</Pagination>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCategoryPricing ? 'Actualizar' : 'Crear'} Categoría de Precio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Nombre de la categoría de precio</Form.Label>
              <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit} variant="outline-success" type="submit">
            {selectedCategoryPricing ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoryPricingCRUD;
