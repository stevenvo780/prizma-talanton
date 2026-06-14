import React, { useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import { CheckLg, ListOl, Cart3 } from 'react-bootstrap-icons';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../../redux/ui';

const POS_VIEW_MODE_KEY = 'posViewMode';

const MODES = [
  {
    value: 'step-by-step' as const,
    label: 'Modo Paso a Paso',
    description: 'Flujo guiado: Cliente → Productos → Pago',
    Icon: ListOl,
  },
  {
    value: 'direct' as const,
    label: 'Modo Directo',
    description: 'Productos y carrito en una sola pantalla',
    Icon: Cart3,
  },
];

const PosViewModeSettings: React.FC = () => {
  const dispatch = useDispatch();
  const [selectedMode, setSelectedMode] = useState<'step-by-step' | 'direct'>(
    () => (localStorage.getItem(POS_VIEW_MODE_KEY) as 'step-by-step' | 'direct') || 'step-by-step'
  );

  const handleSave = () => {
    try {
      localStorage.setItem(POS_VIEW_MODE_KEY, selectedMode);
      dispatch(addNotification({ message: 'Modo de vista POS guardado correctamente.', color: 'success' }));
    } catch (error) {
      console.error('Error saving POS view mode to localStorage:', error);
      dispatch(addNotification({ message: 'Error al guardar la configuración del modo de vista.', color: 'danger' }));
    }
  };

  return (
    <Container fluid className="p-3 p-md-4">
      <div className="mb-4">
        <h5 className="fw-bold mb-0">Modo Vista POS</h5>
        <small className="text-muted">Elige cómo quieres operar el Punto de Venta</small>
      </div>

      <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
        {MODES.map(({ value, label, description, Icon }) => {
          const isSelected = selectedMode === value;
          return (
            <button
              key={value}
              onClick={() => setSelectedMode(value)}
              className="border-0 rounded-3 p-4 text-start flex-fill"
              style={{
                background: isSelected ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f9fafb',
                color: isSelected ? '#fff' : '#374151',
                boxShadow: isSelected ? '0 4px 15px rgba(99,102,241,.35)' : '0 1px 3px rgba(0,0,0,.08)',
                cursor: 'pointer',
                transition: 'all .2s ease',
                outline: isSelected ? 'none' : '1px solid #e5e7eb',
              }}
            >
              <Icon size={28} className="mb-3" style={{ opacity: isSelected ? 1 : 0.5 }} />
              <p className="fw-bold mb-1" style={{ fontSize: '0.95rem' }}>{label}</p>
              <p className="mb-0" style={{ fontSize: '0.8rem', opacity: 0.85 }}>{description}</p>
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleSave}
        className="d-flex align-items-center gap-2"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px' }}
      >
        <CheckLg size={15} />
        Guardar preferencia
      </Button>
    </Container>
  );
};

export default PosViewModeSettings;
