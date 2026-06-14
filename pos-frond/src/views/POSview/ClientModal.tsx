import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, InputGroup, FormControl } from 'react-bootstrap';
import { Client } from '../../utils/types';
import api from '../../utils/axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../redux/ui';

interface ClientModalProps {
  showClientModal: boolean;
  setShowClientModal: (show: boolean) => void;
  onClientSelect: (client: Client) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ showClientModal, setShowClientModal, onClientSelect }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get(`/client/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching clients:", error);
      dispatch(addNotification({ message: 'Error al buscar clientes', color: 'danger' }));
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    if (showClientModal) {
      setIsLoading(true);
      api.get('/client')
        .then(response => setSearchResults(response.data))
        .catch(error => {
          console.error("Error al listar clientes:", error);
          dispatch(addNotification({ message: 'Error al listar clientes', color: 'danger' }));
          setSearchResults([]);
        })
        .finally(() => setIsLoading(false));
    } else {
      setSearchTerm('');
      setSearchResults([]);
    }
  }, [showClientModal, dispatch]);

  return (
    <Modal show={showClientModal} onHide={() => setShowClientModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Buscar Cliente</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <InputGroup className="mb-3">
          <FormControl
            placeholder="Buscar por nombre, apellido o documento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button variant="outline-secondary" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </InputGroup>

        <Table striped bordered hover responsive size="sm">
          <thead>
            <tr>
              <th>Documento</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="text-center text-muted">No se encontraron clientes.</td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center text-muted">Buscando...</td>
              </tr>
            )}
            {searchResults.map((client) => (
              <tr key={client.id}>
                <td>{client.documentNumber}</td>
                <td>{client.name}</td>
                <td>{client.surname}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td>
                  <Button variant="outline-success" size="sm" onClick={() => onClientSelect(client)}>
                    Seleccionar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowClientModal(false)}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClientModal;
