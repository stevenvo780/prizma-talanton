import React, { useState, useEffect } from 'react';
import { Button, Form, Container, Card } from 'react-bootstrap';
import api from '../../../utils/axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../redux/ui';
import { Config, ConfigPlugins } from '../../../utils/types';

const defaultPluginsConfig: ConfigPlugins = {
  hermes: {
    auth_token: '',
    enabled: false
  },
  talaria: {
    auth_token: '',
    enabled: false
  },
  pistis: {
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
              {/* Hermes (legacy: hermes) */}
              <Form.Group>
                <Form.Label>Token de Hermes</Form.Label>
                <Form.Control
                  type="text"
                  value={config.pluginsConfig.hermes.auth_token}
                  onChange={e => handlePluginConfigChange('hermes', 'auth_token', e.target.value)}
                />
                <Form.Check
                  type="checkbox"
                  label="Habilitado"
                  checked={config.pluginsConfig.hermes.enabled}
                  onChange={e => handlePluginConfigChange('hermes', 'enabled', e.currentTarget.checked)}
                />
              </Form.Group>
              {/* Talaria (legacy: talaria) */}
              <Form.Group style={{ marginTop: '1rem' }}>
                <Form.Label>Token de Talaria</Form.Label>
                <Form.Control
                  type="text"
                  value={config.pluginsConfig.talaria.auth_token}
                  onChange={e => handlePluginConfigChange('talaria', 'auth_token', e.target.value)}
                />
                <Form.Check
                  type="checkbox"
                  label="Habilitado"
                  checked={config.pluginsConfig.talaria.enabled}
                  onChange={e => handlePluginConfigChange('talaria', 'enabled', e.currentTarget.checked)}
                />
              </Form.Group>
              {/* Pistis (legacy: pistis) */}
              <Form.Group style={{ marginTop: '1rem' }}>
                <Form.Label>Token de Pistis</Form.Label>
                <Form.Control
                  type="text"
                  value={config.pluginsConfig.pistis.auth_token}
                  onChange={e => handlePluginConfigChange('pistis', 'auth_token', e.target.value)}
                />
                <Form.Check
                  type="checkbox"
                  label="Habilitado"
                  checked={config.pluginsConfig.pistis.enabled}
                  onChange={e => handlePluginConfigChange('pistis', 'enabled', e.currentTarget.checked)}
                />
              </Form.Group>
              <br />
              <Button variant="outline-success" type="submit">Guardar</Button>
              <Button variant="outline-danger" onClick={handleEditMode} style={{ marginLeft: '10px' }}>Cancelar</Button>
            </Form>
          ) : (
            <>
              <p>Hermes: {config.pluginsConfig.hermes.enabled ? 'Habilitado' : 'Deshabilitado'}</p>
              <p>Talaria: {config.pluginsConfig.talaria.enabled ? 'Habilitado' : 'Deshabilitado'}</p>
              <p>Pistis: {config.pluginsConfig.pistis.enabled ? 'Habilitado' : 'Deshabilitado'}</p>
              <Button variant="outline-primary" onClick={handleEditMode}>Editar configuración</Button>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PluginsConfigView;
