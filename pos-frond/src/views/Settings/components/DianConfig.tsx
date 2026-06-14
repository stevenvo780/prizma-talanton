import React, { useState, useEffect, useCallback } from 'react';
import {
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Badge,
  Table,
  Accordion,
  ListGroup,
} from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../redux/ui';
import { fmtCOP } from '../../../utils/format';
import {
  CheckCircleFill,
  HourglassSplit,
  XCircleFill,
  ExclamationTriangleFill,
  ClipboardCheck,
  LightbulbFill,
  KeyFill,
  BookHalf,
  ArrowRepeat,
} from 'react-bootstrap-icons';
import {
  configureDianProvider,
  getNumberTemplates,
  listDianInvoices,
  NumberTemplate,
  DianInvoiceRecord,
} from '../../../services/dianService';
import api from '../../../utils/axios';

const DianConfig: React.FC = () => {
  const dispatch = useDispatch();

  // Estado de configuración
  const [providerName] = useState('alegra');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [validating, setValidating] = useState(true);

  // Numeraciones
  const [numberTemplates, setNumberTemplates] = useState<NumberTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Historial de facturas electrónicas
  const [dianInvoices, setDianInvoices] = useState<DianInvoiceRecord[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Datos de perfil empresa
  const [companyName, setCompanyName] = useState('');
  const [nit, setNit] = useState('');

  // Cargar estado actual
  const loadCurrentConfig = useCallback(async () => {
    setValidating(true);
    try {
      const { data: profile } = await api.get(`/profile`);
      const profiles = Array.isArray(profile) ? profile : [profile];
      const p = profiles[0];
      if (p) {
        setCompanyName(p.companyName || '');
        setNit(p.nit || '');
        if (p.dianConfig) {
          setEmail(p.dianConfig.email || '');
          setToken(p.dianConfig.token ? '••••••••••••••••••••' : '');
          setIsConfigured(true);
        }
      }
    } catch {
      // No profile yet, that's ok
    } finally {
      setValidating(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentConfig();
  }, [loadCurrentConfig]);

  // Cargar numeraciones cuando está configurado
  useEffect(() => {
    if (isConfigured) {
      loadNumberTemplates();
      loadDianInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured]);

  const loadNumberTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const templates = await getNumberTemplates();
      setNumberTemplates(templates);
    } catch {
      // silently fail
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadDianInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const invoices = await listDianInvoices();
      setDianInvoices(invoices);
    } catch {
      // silently fail
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!email || !token || token === '••••••••••••••••••••') {
      dispatch(
        addNotification({
          message: 'Ingresa el email y token de tu cuenta de Alegra',
          color: 'warning',
        }),
      );
      return;
    }

    setSaving(true);
    try {
      const result = await configureDianProvider({
        providerName,
        email,
        token,
      });

      if (result.valid) {
        setIsConfigured(true);
        dispatch(
          addNotification({
            message: '✅ Credenciales de Alegra configuradas y validadas correctamente',
            color: 'success',
          }),
        );
        loadNumberTemplates();
        loadDianInvoices();
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || 'Error al validar credenciales';
      dispatch(addNotification({ message: msg, color: 'danger' }));
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'STAMPED':
        return <Badge bg="success"><CheckCircleFill className="me-1" /> Timbrada</Badge>;
      case 'PENDING':
        return <Badge bg="warning"><HourglassSplit className="me-1" /> Pendiente</Badge>;
      case 'REJECTED':
        return <Badge bg="danger"><XCircleFill className="me-1" /> Rechazada</Badge>;
      case 'ERROR':
        return <Badge bg="danger"><ExclamationTriangleFill className="me-1" /> Error</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (validating) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Estado general */}
      <Alert variant={isConfigured ? 'success' : 'warning'} className="d-flex align-items-center">
        <div>
          <strong>{isConfigured ? <><CheckCircleFill className="me-1" /> Proveedor configurado</> : <><ExclamationTriangleFill className="me-1" /> Facturación electrónica no configurada</>}</strong>
          <br />
          <small>
            {isConfigured
              ? `Conectado a Alegra como ${email}`
              : 'Configura tus credenciales de Alegra para emitir facturas electrónicas ante la DIAN.'}
          </small>
        </div>
      </Alert>

      {/* Datos de empresa */}
      {(!nit || !companyName) && (
        <Alert variant="info">
          <strong><ClipboardCheck className="me-1" /> Datos de empresa incompletos</strong>
          <br />
          <small>
            Para facturar electrónicamente necesitas tener configurado tu NIT y razón social.{' '}
            <a href="/profile">Ir a Perfil →</a>
          </small>
        </Alert>
      )}

      <Accordion defaultActiveKey={isConfigured ? '' : '0'} className="mb-4">
        {/* Guía paso a paso */}
        <Accordion.Item eventKey="guide">
          <Accordion.Header>
            <BookHalf className="me-1" /> Guía: Cómo habilitar la facturación electrónica
          </Accordion.Header>
          <Accordion.Body>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <strong>Paso 1:</strong> Crea una cuenta en{' '}
                <a href="https://app.alegra.com/register" target="_blank" rel="noreferrer">
                  Alegra
                </a>{' '}
                con los datos de <strong>tu empresa</strong> (NIT, razón social, dirección).
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Paso 2:</strong> En Alegra, ve a{' '}
                <a href="https://mi.alegra.com/fe-wizard" target="_blank" rel="noreferrer">
                  Configuración → Habilitar Factura Electrónica
                </a>{' '}
                y completa los 7 pasos del wizard DIAN:
                <ul className="mt-2 mb-0">
                  <li>Datos de empresa (NIT, razón social, municipio)</li>
                  <li>Habilitación ante la DIAN</li>
                  <li>Modo de operación (producción/pruebas)</li>
                  <li>Set de pruebas DIAN</li>
                  <li>Asociar prefijos de resolución</li>
                  <li>Configurar numeraciones autorizadas</li>
                  <li>Aceptar términos y condiciones</li>
                </ul>
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Paso 3:</strong> En Alegra, ve a{' '}
                <a href="https://mi.alegra.com/integrations" target="_blank" rel="noreferrer">
                  Configuración → Integraciones → Integración Manual (API)
                </a>{' '}
                y copia tu <strong>email</strong> y <strong>token</strong>.
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Paso 4:</strong> Pega las credenciales aquí abajo y guarda. ¡Listo!
              </ListGroup.Item>
            </ListGroup>
            <Alert variant="light" className="mt-3 mb-0">
              <small>
                <strong><LightbulbFill className="me-1" /> Importante:</strong> Cada empresa que use Sinergia POS debe crear su propia cuenta de Alegra
                con su NIT y resolución DIAN. Así cada negocio factura bajo su propia identidad fiscal.
              </small>
            </Alert>
          </Accordion.Body>
        </Accordion.Item>

        {/* Configuración de credenciales */}
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <KeyFill className="me-1" /> Credenciales de Alegra {isConfigured && <Badge bg="success" className="ms-2">Configurado</Badge>}
          </Accordion.Header>
          <Accordion.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Proveedor</Form.Label>
                    <Form.Control type="text" value="Alegra" disabled />
                    <Form.Text className="text-muted">
                      Proveedor de facturación electrónica ante la DIAN
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email de Alegra *</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="correo@tuempresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      El email con el que te registraste en Alegra
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Token API *</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="fb5d887fb7400e0f0a13"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      onFocus={() => {
                        if (token === '••••••••••••••••••••') setToken('');
                      }}
                    />
                    <Form.Text className="text-muted">
                      Encuéntralo en Alegra → Configuración → Integraciones → API Manual
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <Button
                variant="primary"
                onClick={handleSaveCredentials}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Validando...
                  </>
                ) : isConfigured ? (
                  <><ArrowRepeat className="me-1" /> Actualizar credenciales</>
                ) : (
                  <>Guardar y validar</>
                )}
              </Button>
            </Form>
          </Accordion.Body>
        </Accordion.Item>

        {/* Numeraciones / Resoluciones DIAN */}
        {isConfigured && (
          <Accordion.Item eventKey="1">
            <Accordion.Header>
              📄 Resoluciones y Numeraciones DIAN
            </Accordion.Header>
            <Accordion.Body>
              {loadingTemplates ? (
                <div className="text-center py-3">
                  <Spinner size="sm" /> Cargando numeraciones...
                </div>
              ) : numberTemplates.length === 0 ? (
                <Alert variant="warning">
                  <strong>No hay numeraciones electrónicas configuradas.</strong>
                  <br />
                  <small>
                    Completa el{' '}
                    <a href="https://mi.alegra.com/fe-wizard" target="_blank" rel="noreferrer">
                      wizard de habilitación DIAN en Alegra
                    </a>{' '}
                    para obtener tus resoluciones y numeraciones autorizadas.
                  </small>
                </Alert>
              ) : (
                <Table bordered size="sm" responsive>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Prefijo</th>
                      <th>Resolución</th>
                      <th>Rango</th>
                      <th>Siguiente #</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {numberTemplates.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>{t.prefix || '—'}</td>
                        <td>{t.resolutionNumber || '—'}</td>
                        <td>
                          {t.startNumber && t.endNumber
                            ? `${t.startNumber} - ${t.endNumber}`
                            : '—'}
                        </td>
                        <td>{t.nextNumber}</td>
                        <td>
                          {t.isElectronic ? (
                            <Badge bg="primary">Electrónica</Badge>
                          ) : (
                            <Badge bg="secondary">Normal</Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg={t.status === 'active' ? 'success' : 'secondary'}>
                            {t.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={loadNumberTemplates}
                disabled={loadingTemplates}
              >
                <ArrowRepeat className="me-1" /> Actualizar
              </Button>
            </Accordion.Body>
          </Accordion.Item>
        )}

        {/* Historial de facturas electrónicas */}
        {isConfigured && (
          <Accordion.Item eventKey="2">
            <Accordion.Header>
              <ClipboardCheck className="me-1" /> Historial de Facturas Electrónicas ({dianInvoices.length})
            </Accordion.Header>
            <Accordion.Body>
              {loadingInvoices ? (
                <div className="text-center py-3">
                  <Spinner size="sm" /> Cargando...
                </div>
              ) : dianInvoices.length === 0 ? (
                <Alert variant="info">
                  No se han emitido facturas electrónicas aún. Emite una factura desde el POS
                  seleccionando el tipo "Factura Electrónica".
                </Alert>
              ) : (
                <Table bordered size="sm" responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Documento</th>
                      <th>CUFE</th>
                      <th>Total</th>
                      <th>Estado DIAN</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dianInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{inv.id}</td>
                        <td>
                          {inv.prefix ? `${inv.prefix}-` : ''}
                          {inv.documentNumber}
                        </td>
                        <td>
                          <small title={inv.cufe}>
                            {inv.cufe ? `${inv.cufe.substring(0, 12)}...` : '—'}
                          </small>
                        </td>
                        <td>{fmtCOP(inv.total ?? 0)}</td>
                        <td>{getStatusBadge(inv.dianStatus)}</td>
                        <td>
                          {inv.stampDate
                            ? new Date(inv.stampDate).toLocaleDateString()
                            : new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {inv.pdfUrl && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                href={inv.pdfUrl}
                                target="_blank"
                                title="Descargar PDF"
                              >
                                PDF
                              </Button>
                            )}
                            {inv.xmlUrl && (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                href={inv.xmlUrl}
                                target="_blank"
                                title="Descargar XML"
                              >
                                XML
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={loadDianInvoices}
                disabled={loadingInvoices}
              >
                <ArrowRepeat className="me-1" /> Actualizar
              </Button>
            </Accordion.Body>
          </Accordion.Item>
        )}
      </Accordion>
    </div>
  );
};

export default DianConfig;
