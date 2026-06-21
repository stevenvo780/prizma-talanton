import React, { useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/auth';
import axios from '../../utils/axios';
import { addNotification } from '../../redux/ui';
import { useNavigate } from 'react-router-dom';
import { storage } from '../../utils/firebase';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  surname: string;
  logo: string;
  companyName: string;
  typeDocument: TypeDocuments;
  phone: string;
}

export enum TypeDocuments {
  CC = 'CC',
  NIT = 'NIT',
}

const RegisterPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [typeDocument, setTypeDocument] = useState(TypeDocuments.CC);
  const [phone, setPhone] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(URL.createObjectURL(e.target.files[0]));
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      dispatch(addNotification({ message: 'Las contraseñas no coinciden', color: 'danger' }));
      setIsLoading(false);
      return;
    }

    try {
      let logoUrl = '';
      if (logoFile) {
        const uploadTask = storage.ref(`images/${logoFile.name}`).put(logoFile);
        await new Promise((resolve, reject) => {
          uploadTask.on("state_changed", snapshot => { }, error => reject(error), () => {
            storage.ref("images").child(logoFile.name).getDownloadURL().then(url => { logoUrl = url; resolve(url); });
          });
        });
      }
      setLogo(logoUrl);
      const response = await axios.post('/auth/register', { email, password, name, surname, logo: logoUrl, companyName, typeDocument, phone, documentNumber });
      if (response.status === 201) {
        dispatch(login(response.data));
        navigate('/pos');
        dispatch(addNotification({ message: 'Registro exitoso', color: 'success' }));
      } else {
        console.error('Error en el registro:', response?.data?.message);
        dispatch(addNotification({ message: response?.data?.message ? response?.data?.message : 'Error al registrar', color: 'danger' }));
      }
    } catch (error: any) {
      console.error(error?.response?.data?.message)
      dispatch(addNotification({ message: error?.response?.data?.message ? error?.response?.data?.message : 'Error al registrar', color: 'danger' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <h2>Registro</h2>
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col sm={5}>        <Form.Group controlId="formBasicEmail">
            <Form.Control
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
            <br />
            <Form.Group controlId="formBasicPassword">
              <Form.Control
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="formBasicConfirmPassword">
              <Form.Control
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </Form.Group>
            <br />
            <Form.Group controlId="formBasicName">
              <Form.Control
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Form.Group>
            <br />
            <Form.Group controlId="formBasicSurname">
              <Form.Control
                type="text"
                placeholder="Apellido"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
              />
            </Form.Group></Col>
          <Col sm={5}>   <Form.Group controlId="formBasicPhone">
            <Form.Control
              type="text"
              placeholder="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </Form.Group>
            <br />
            <Form.Group controlId="formBasicLogo">
              <Form.Label>Logo</Form.Label>
              <Form.Control
                type="file"
                onChange={handleLogoChange}
              />
              {logo && <img src={logo} alt="Preview" style={{ width: '100px' }} />}
            </Form.Group>
            <br />
            <Form.Group controlId="formBasicCompanyName">
              <Form.Control
                type="text"
                placeholder="Nombre de la compañía"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </Form.Group>
            <br />
            <Form.Group controlId="formBasicTypeDocument">
              <Form.Control as="select" value={typeDocument} onChange={(e) => setTypeDocument(e.target.value as TypeDocuments)} required>
                <option value={TypeDocuments.CC}>CC</option>
                <option value={TypeDocuments.NIT}>NIT</option>
              </Form.Control>
            </Form.Group>
            <br />
            <Form.Group controlId="formBasicDocumentNumber">
              <Form.Control
                type="text"
                placeholder="Número de Documento"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Registrar'}
        </Button>
      </Form>
    </Container>
  );
};

export default RegisterPage;
