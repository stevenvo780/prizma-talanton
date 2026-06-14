import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import api from '../../utils/axios';
import { auth } from '../../utils/firebase';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { addNotification } from '../../redux/ui';

const EditProfile: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.userData);
  const userId = user?.id;
  const [profileId, setProfileId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [nit, setNit] = useState('');
  const [dv, setDv] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [taxRegime, setTaxRegime] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoadingData(true);
    Promise.all([
      api.get(`/user/${userId}`),
      api.get(`/profile/user/${userId}`)
    ]).then(([resUser, resProfile]) => {
      const u = resUser.data as any;
      const p = resProfile.data as any;
      setName(u.name);
      setEmail(u.email);
      setPhone(p.phone || '');
      setCompanyName(p.companyName || '');
      setApiKey(u.apiKey || '');
      setNit(p.nit || '');
      setDv(p.dv || '');
      setLegalAddress(p.legalAddress || '');
      setTaxRegime(p.taxRegime || '');
      setProfileId(p.id);
    }).catch(err => {
      dispatch(addNotification({ message: 'Error cargando datos', color: 'danger' }));
    }).finally(() => setLoadingData(false));
  }, [userId, dispatch]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await api.patch(`/user/${userId}`, { name, email, apiKey });
      if (auth.currentUser && auth.currentUser.email !== email) {
        await auth.currentUser.updateEmail(email);
      }
      if (profileId) {
        await api.patch(`/profile/${profileId}`, {
          phone,
          companyName,
          nit,
          dv,
          legalAddress,
          taxRegime
        });
      }
      dispatch(addNotification({ message: 'Perfil actualizado con éxito', color: 'success' }));
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      dispatch(addNotification({ message: `Error al guardar: ${msg}`, color: 'danger' }));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!email) return;
    try {
      await auth.sendPasswordResetEmail(email);
      dispatch(addNotification({ message: 'Correo de restablecimiento enviado', color: 'info' }));
    } catch (error: any) {
      const msg = error.message;
      dispatch(addNotification({ message: `Error al cambiar contraseña: ${msg}`, color: 'danger' }));
    }
  };

  return (
    <Container className="mt-4">
      <h3>Editar Perfil</h3>
      {loadingData ? (
        <Spinner animation="border" />
      ) : (
        <Form data-tour="profile-form">
          <Row>
            <Col md={6}>
              <Form.Group controlId="name">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="email">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mt-3">
            <Col md={6}>
              <Form.Group controlId="phone">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="companyName">
                <Form.Label>Nombre de la Empresa</Form.Label>
                <Form.Control
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6}>
              <Form.Group controlId="apiKey">
                <Form.Label>API Key</Form.Label>
                <Form.Control
                  type="text"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={3}>
              <Form.Group controlId="nit">
                <Form.Label>NIT</Form.Label>
                <Form.Control
                  type="text"
                  value={nit}
                  onChange={e => setNit(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="dv">
                <Form.Label>Dígito de Verificación</Form.Label>
                <Form.Control
                  type="text"
                  value={dv}
                  onChange={e => setDv(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="legalAddress">
                <Form.Label>Dirección Legal</Form.Label>
                <Form.Control
                  type="text"
                  value={legalAddress}
                  onChange={e => setLegalAddress(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group controlId="taxRegime">
                <Form.Label>Régimen Tributario</Form.Label>
                <Form.Control
                  type="text"
                  value={taxRegime}
                  onChange={e => setTaxRegime(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="mt-4">
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>{' '}
            <Button variant="secondary" onClick={handleChangePassword} disabled={saving}>
              Cambiar Contraseña
            </Button>
          </div>
        </Form>
      )}
    </Container>
  );
};

export default EditProfile;
