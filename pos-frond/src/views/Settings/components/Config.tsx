import React, { useState, useEffect } from 'react';
import { Button, Form, Container, Row, Col } from 'react-bootstrap';
import { PencilFill, CheckLg, XLg, Hash } from 'react-bootstrap-icons';
import api from '../../../utils/axios';
import { Config, ConfigPlugins } from '../../../utils/types';
import { addNotification } from '../../../redux/ui';
import { useDispatch } from 'react-redux';

const ConfigView: React.FC = () => {
  const dispatch = useDispatch();
  const defaultPluginsConfig: ConfigPlugins = {
    hermes: { auth_token: '', enabled: false },
    talaria: { auth_token: '', enabled: false },
    pistis: { auth_token: '', enabled: false },
  };

  const [config, setConfig] = useState<Config>({
    iva: 0,
    withholdingTax: 0,
    initialConsecutive: 0,
    finalConsecutive: 0,
    currentConsecutive: 0,
    pluginsConfig: defaultPluginsConfig,
  });
  const [editMode, setEditMode] = useState<boolean>(false);

  const fetchConfig = async () => {
    const response = await api.get('/config');
    setConfig(response.data);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/config', config);
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchConfig();
      setEditMode(false);
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const StatBadge: React.FC<{ label: string; val: number }> = ({ label, val }) => (
    <div className="rounded-3 p-3" style={{ background: '#f8f9ff', border: '1px solid #e0e0ff' }}>
      <p style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p className="fw-bold mb-0" style={{ fontSize: '1.25rem', color: '#1a1a2e' }}>{val}</p>
    </div>
  );

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0">Consecutivos</h5>
          <small className="text-muted">Configuración de numeración de documentos</small>
        </div>
        {!editMode && (
          <Button
            size="sm"
            onClick={() => setEditMode(true)}
            className="d-flex align-items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px' }}
          >
            <PencilFill size={13} />
            <span>Editar</span>
          </Button>
        )}
      </div>

      {!editMode ? (
        <Row className="g-3">
          <Col xs={12} sm={4}>
            <StatBadge label="Consecutivo inicial" val={config.initialConsecutive ?? 0} />
          </Col>
          <Col xs={12} sm={4}>
            <StatBadge label="Consecutivo final" val={config.finalConsecutive ?? 0} />
          </Col>
          <Col xs={12} sm={4}>
            <StatBadge label="Consecutivo actual" val={config.currentConsecutive ?? 0} />
          </Col>
        </Row>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Row className="g-3 mb-4">
            <Col xs={12} sm={4}>
              <Form.Group>
                <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                  <Hash size={13} className="me-1" />Consecutivo inicial
                </Form.Label>
                <Form.Control
                  type="number"
                  value={config.initialConsecutive?.toString()}
                  onChange={(e) => setConfig({ ...config, initialConsecutive: parseInt(e.target.value, 10) })}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group>
                <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                  <Hash size={13} className="me-1" />Consecutivo final
                </Form.Label>
                <Form.Control
                  type="number"
                  value={config.finalConsecutive?.toString()}
                  onChange={(e) => setConfig({ ...config, finalConsecutive: parseInt(e.target.value, 10) })}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={4}>
              <Form.Group>
                <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                  <Hash size={13} className="me-1" />Consecutivo actual
                </Form.Label>
                <Form.Control
                  type="number"
                  value={config.currentConsecutive?.toString()}
                  onChange={(e) => setConfig({ ...config, currentConsecutive: parseInt(e.target.value, 10) })}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex gap-2">
            <Button
              type="submit"
              className="d-flex align-items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px' }}
            >
              <CheckLg size={15} />
              Guardar
            </Button>
            <Button
              variant="light"
              onClick={() => setEditMode(false)}
              className="d-flex align-items-center gap-2"
            >
              <XLg size={13} />
              Cancelar
            </Button>
          </div>
        </Form>
      )}
    </Container>
  );
};

export default ConfigView;