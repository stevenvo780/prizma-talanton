import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Pagination, Container } from 'react-bootstrap';
import api from '../../../utils/axios';
import { Category } from '../../../utils/types';
import { addNotification } from '../../../redux/ui';
import { useDispatch } from 'react-redux';

const CategoryCRUD: React.FC = () => {
  const dispatch = useDispatch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(5);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await api.get('/category');
    setCategories(response.data);
  };

  const handleShowModal = (category: Category | null = null) => {
    setSelectedCategory(category);
    setName(category?.name ? category.name : '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selectedCategory) {
        await api.patch(`/category/${selectedCategory.id}`, { name });
      } else {
        await api.post('/category', { name });
      }
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchCategories();
      handleCloseModal();
    } catch (error) {
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
    }
  };

  const deleteCategory = async (category: Category) => {
    try {
      await api.delete(`/category/${category.id}`);
      dispatch(addNotification({ message: 'Se borro correctamente', color: 'success' }));
      fetchCategories();
    } catch (error) {
      dispatch(addNotification({ message: 'Error al borrar', color: 'danger' }));
    }
  };

  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);

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
      <Button variant="outline-primary" onClick={() => handleShowModal()} style={{ margin: '10px' }}>Crear nueva categoría</Button>
      <Table bordered>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre de la categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentCategories.map((category: Category, index: number) => (
            <tr key={category.id}>
              <td>{index + 1}</td>
              <td>{category.name}</td>
              <td width={"20%"}>
                <Button variant="outline-info" onClick={() => handleShowModal(category)} style={{ margin: '5px' }}>Editar</Button>
                <Button variant="outline-danger" onClick={() => deleteCategory(category)} style={{ margin: '5px' }}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination style={{ margin: '10px' }}>{items}</Pagination>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{selectedCategory ? 'Actualizar' : 'Crear'} Categoría</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Nombre de la categoría</Form.Label>
              <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit} variant="outline-success" type="submit">
            {selectedCategory ? 'Actualizar' : 'Crear'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoryCRUD;
