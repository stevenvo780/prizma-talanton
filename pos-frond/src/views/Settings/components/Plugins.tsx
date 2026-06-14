import React, { useState, useEffect } from 'react';
import { Button, Form, Container, Card } from 'react-bootstrap';
import api from '../../../utils/axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../redux/ui';
import { Config, ConfigPlugins } from '../../../utils/types';

const defaultPluginsConfig: ConfigPlugins = {
  graf: {
    auth_token: '',
    enabled: false
  },
  meravuelta: {
    auth_token: '',
    enabled: false
  },
  fiar: {
    auth_token: '',
    enabled: false
  }
};

const PluginsConfigView: React.FC = () => {
  const dispatch = useDispatch();

  const [config, setConfig] = useState<Config>({
    iva: 0,
    withholdingTax: 0,
    initialConsecutive: 0,
    finalConsecutive: 0,
    currentConsecutive: 0,
    pluginsConfig: defaultPluginsConfig,
  });
  const [editMode, setEditMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await api.get('/config');
      const fetchedConfig = res.data as Config;
      setConfig({
        ...fetchedConfig,
        pluginsConfig: {
          ...defaultPluginsConfig,
          ...fetchedConfig.pluginsConfig,
        },
      });
    };
    fetchConfig();
  }, []);

  const handleEditMode = () => {
    setEditMode(!editMode);
  };

  const handlePluginConfigChange = (plugin: keyof ConfigPlugins, key: string, value: any) => {
    setConfig({
      ...config,
      pluginsConfig: {
        ...config.pluginsConfig,
        [plugin]: {
          ...config.pluginsConfig[plugin],
          [key]: value,
        },
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.post('/config', config);
      dispatch(addNotification({ message: 'Configuración de plugins guardada', color: 'success' }));
      handleEditMode();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al guardar plugins', color: 'danger' }));
    }
  };

  return (
    <Container fluid>
      <Card style={{ margin: '10px' }}>
        <Card.Body>
          <Card.Title>Configuración de Plugins</Card.Title>
          {editMode ? (
            <Form onSubmit={handleSubmit}>
              {/* Graf */}
              <Form.Group>
                <Form.Label>Token de Graf</Form.Label>
                <Form.Control
                  type="text"
                  value={config.pluginsConfig.graf.auth_token}
                  onChange={e => handlePluginConfigChange('graf', 'auth_token', e.target.value)}
                />
                <Form.Check
                  type="checkbox"
                  label="Habilitado"
                  checked={config.pluginsConfig.graf.enabled}
                  onChange={e => handlePluginConfigChange('graf', 'enabled', e.currentTarget.checked)}
                />
              </Form.Group>
              {/* MeraVuelta */}
              <Form.Group style={{ marginTop: '1rem' }}>
                <Form.Label>Token de MeraVuelta</Form.Label>
                <Form.Control
                  type="text"
                  value={config.pluginsConfig.meravuelta.auth_token}
                  onChange={e => handlePluginConfigChange('meravuelta', 'auth_token', e.target.value)}
                />
                <Form.Check
                  type="checkbox"
                  label="Habilitado"
                  checked={config.pluginsConfig.meravuelta.enabled}
                  onChange={e => handlePluginConfigChange('meravuelta', 'enabled', e.currentTarget.checked)}
                />
              </Form.Group>
              {/* Fiar */}
              <Form.Group style={{ marginTop: '1rem' }}>
                <Form.Label>Token de Fiar</Form.Label>
                <Form.Control
                  type="text"
                  value={config.pluginsConfig.fiar.auth_token}
                  onChange={e => handlePluginConfigChange('fiar', 'auth_token', e.target.value)}
                />
                <Form.Check
                  type="checkbox"
                  label="Habilitado"
                  checked={config.pluginsConfig.fiar.enabled}
                  onChange={e => handlePluginConfigChange('fiar', 'enabled', e.currentTarget.checked)}
                />
              </Form.Group>
              <br />
              <Button variant="outline-success" type="submit">Guardar</Button>
              <Button variant="outline-danger" onClick={handleEditMode} style={{ marginLeft: '10px' }}>Cancelar</Button>
            </Form>
          ) : (
            <>
              <p>Graf: {config.pluginsConfig.graf.enabled ? 'Habilitado' : 'Deshabilitado'}</p>
              <p>MeraVuelta: {config.pluginsConfig.meravuelta.enabled ? 'Habilitado' : 'Deshabilitado'}</p>
              <p>Fiar: {config.pluginsConfig.fiar.enabled ? 'Habilitado' : 'Deshabilitado'}</p>
              <Button variant="outline-primary" onClick={handleEditMode}>Editar configuración</Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PluginsConfigView;
