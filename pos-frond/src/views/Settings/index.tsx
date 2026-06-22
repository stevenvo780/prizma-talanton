import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import {
  FileEarmarkText,
  Calculator,
  TagFill,
  GearFill,
  Link45deg,
  CashCoin,
  PuzzleFill,
  Display,
} from 'react-bootstrap-icons';
import DianConfig from './components/DianConfig';
import Taxes from './components/Taxes';
import ConfigurationView from './components/Config';
import DiscountsView from './components/Discounts';
import WebhookCRUD from './components/Webhook';
import CashBoxCRUD from './components/CashBox';
import ConfigView from './components/Plugins';
import PosViewModeSettings from './components/PosViewModeSettings';

const TABS = [
  { key: 'dian',        label: 'DIAN / Facturación', Icon: FileEarmarkText },
  { key: 'taxes',       label: 'Impuestos',           Icon: Calculator      },
  { key: 'discounts',   label: 'Beneficios',          Icon: TagFill         },
  { key: 'config',      label: 'Consecutivos',        Icon: GearFill        },
  { key: 'cashbox',     label: 'Cajas',               Icon: CashCoin        },
  { key: 'webhooks',    label: 'Webhooks',            Icon: Link45deg       },
  { key: 'plugins',     label: 'Plugins',             Icon: PuzzleFill      },
  { key: 'posViewMode', label: 'Modo Vista POS',      Icon: Display         },
];

const PANELS: Record<string, React.ReactNode> = {
  dian:        <DianConfig />,
  taxes:       <Taxes />,
  discounts:   <DiscountsView />,
  config:      <ConfigurationView />,
  cashbox:     <CashBoxCRUD />,
  webhooks:    <WebhookCRUD />,
  plugins:     <ConfigView />,
  posViewMode: <PosViewModeSettings />,
};

const Settings: React.FC = () => {
  const [activeKey, setActiveKey] = useState('dian');

  return (
    <Container fluid className="py-3 px-2 px-md-4">
      {/* Page header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-0" style={{ color: '#1a1f36' }}>Configuración</h4>
        <small className="text-muted">Gestiona todos los parámetros del sistema</small>
      </div>

      <Row className="g-0" style={{ minHeight: '70vh' }}>
        {/* ── Sidebar ── */}
        <Col
          xs={12} md={3} lg={2}
          className="mb-3 mb-md-0"
          style={{ borderRight: '1px solid #e9ecef' }}
        >
          <nav
            className="d-flex flex-row flex-md-column flex-wrap gap-1 pe-md-2"
            style={{ position: 'sticky', top: '1rem' }}
          >
            {TABS.map(({ key, label, Icon }) => {
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveKey(key)}
                  data-tour={`settings-tab-${key}`}
                  className="d-flex align-items-center gap-2 border-0 rounded-3 text-start px-3 py-2"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)'
                      : 'transparent',
                    color: isActive ? '#fff' : '#4b5563',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'background .18s,color .18s',
                    minWidth: 0,
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span className="text-truncate">{label}</span>
                </button>
              );
            })}
          </nav>
        </Col>

        {/* ── Panel content ── */}
        <Col xs={12} md={9} lg={10} className="ps-md-4">
          <div
            className="rounded-3 bg-white shadow-sm"
            style={{ border: '1px solid #e9ecef', minHeight: '60vh', overflow: 'hidden' }}
          >
            {PANELS[activeKey]}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
