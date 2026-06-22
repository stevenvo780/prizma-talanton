import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/auth';
import axios from '../../utils/axios';
import { addNotification } from '../../redux/ui';
import { useNavigate } from 'react-router-dom';
import { auth as firebaseAuth } from '../../utils/firebase';
import { User } from '../../utils/types';

export enum TypeDocuments {
  CC = 'CC',
  NIT = 'NIT',
}

interface RegisterModalProps {
  show: boolean;
  onHide: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ show, onHide }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      dispatch(addNotification({ message: 'Las contraseñas no coinciden', color: 'danger' }));
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/auth/register', { 
        email, 
        password, 
        companyName, 
        phone, 
      });
      
      if (response.status === 201) {
        // Hacer login en Firebase para obtener un token válido
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        const token = await firebaseUser?.getIdToken();

        // Obtener datos completos del usuario desde el backend
        const meResponse = await axios.get('/user/get/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = meResponse.data as User;

        dispatch(login({
          token: token || '',
          user: {
            ...userData,
            id: firebaseUser?.uid || '',
            email: firebaseUser?.email || '',
            name: firebaseUser?.displayName || companyName || email.split('@')[0],
            apiKey: userData.apiKey || '',
          },
        }));
        navigate('/');
        dispatch(addNotification({ message: 'Registro exitoso', color: 'success' }));
        onHide();
      } else {
        console.error('Error en el registro:', response?.data?.message);
        dispatch(addNotification({ 
          message: response?.data?.message ? response?.data?.message : 'Error al registrar', 
          color: 'danger' 
        }));
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || '';
      
      // Si el email ya existe (409), intentar login directo
      if (error?.response?.status === 409) {
        try {
          const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
          const firebaseUser = userCredential.user;
          const token = await firebaseUser?.getIdToken();
          const meResponse = await axios.get('/user/get/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = meResponse.data as User;

          dispatch(login({
            token: token || '',
            user: {
              ...userData,
              id: firebaseUser?.uid || '',
              email: firebaseUser?.email || '',
              name: firebaseUser?.displayName || companyName || email.split('@')[0],
              apiKey: userData.apiKey || '',
            },
          }));
          navigate('/');
          dispatch(addNotification({ message: 'Bienvenido de vuelta', color: 'success' }));
          onHide();
          return;
        } catch (loginError: any) {
          dispatch(addNotification({ 
            message: 'El correo ya est\u00e1 registrado. Intenta iniciar sesi\u00f3n con tu contrase\u00f1a.', 
            color: 'warning' 
          }));
          return;
        }
      }
      
      console.error(errorMsg);
      dispatch(addNotification({ 
        message: errorMsg || 'Error al registrar', 
        color: 'danger' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCompanyName('');
    setPhone('');
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="lg" 
      centered
      backdrop="static"
    >
      <Modal.Header closeButton>
        <Modal.Title>Registro de Usuario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form id="register-form" onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formBasicEmail">
                <Form.Label>Correo</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formBasicPhone">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Teléfono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formBasicCompanyName">
                <Form.Label>Nombre de la compañía</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nombre de la compañía"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <hr className="my-4" />
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formBasicPassword">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
                <Form.Label>Confirmar contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" type="button" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          form="register-form"
          disabled={isLoading}
        >
          {isLoading ? 'Registrando...' : 'Registrar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RegisterModal;
