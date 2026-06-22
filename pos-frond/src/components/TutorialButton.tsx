/**
 * TutorialButton.tsx
 *
 * Botón flotante "?" que aparece en el Header para relanzar
 * el tutorial de la vista actual en cualquier momento.
 */
import React, { useState } from 'react';
import { OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { QuestionCircleFill, ArrowRepeat } from 'react-bootstrap-icons';
import { useTutorial } from './TutorialContext';
import { TOUR_BY_ROUTE, ROUTE_LABELS } from '../utils/tours';

const TutorialButton: React.FC = () => {
  const { startTour, stopTour, resetAll, seenRoutes, currentRoute, isTourActive } = useTutorial();
  const [showMenu, setShowMenu] = useState(false);

  const hasTour = Boolean(TOUR_BY_ROUTE[currentRoute]?.length);
  const hasSeenCurrent = seenRoutes.has(currentRoute);
  const routeLabel = ROUTE_LABELS[currentRoute] ?? 'esta sección';

  if (!hasTour) return null;

  // Cuando el tour está activo, mostrar botón de cierre encima del overlay de driver.js
  // Usamos pointer-events: all + z-index superior al overlay (100000) para que sea clickeable
  if (isTourActive) {
    return (
      <div style={{ position: 'relative', zIndex: 100002, pointerEvents: 'all' }}>
        <Button
          variant="outline-danger"
          size="sm"
          style={{
            borderRadius: '50%',
            width: 34,
            height: 34,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => stopTour()}
          title="Cerrar tutorial"
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>✕</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', zIndex: 100001 }}
      data-tour="header-tutorial-btn"
    >
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip id="tutorial-tooltip">
            {hasSeenCurrent
              ? `Repetir tutorial: ${routeLabel}`
              : `Ver tutorial: ${routeLabel}`}
          </Tooltip>
        }
      >
        <Button
          variant="outline-secondary"
          size="sm"
          style={{
            borderRadius: '50%',
            width: 34,
            height: 34,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid var(--medium-gray, #ccc)',
            backgroundColor: 'transparent',
            color: 'var(--primary-color, #43b5a6)',
            marginRight: 4,
          }}
          onClick={() => {
            setShowMenu((v) => !v);
          }}
          title="Ayuda / Tutorial"
        >
          <QuestionCircleFill size={16} />
        </Button>
      </OverlayTrigger>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            zIndex: 1100,
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
            minWidth: 220,
            padding: '8px 0',
          }}
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* Overlay para cerrar al hacer clic fuera */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: -1,
            }}
            onClick={() => setShowMenu(false)}
          />

          <div
            style={{
              padding: '4px 16px 8px',
              fontSize: 12,
              color: '#888',
              borderBottom: '1px solid #f0f0f0',
              marginBottom: 4,
            }}
          >
            Tutorial · {routeLabel}
          </div>

          <button
            onClick={() => {
              setShowMenu(false);
              startTour(currentRoute);
            }}
            style={menuItemStyle}
          >
            <QuestionCircleFill size={14} style={{ marginRight: 8, color: '#43b5a6' }} />
            {hasSeenCurrent ? 'Repetir tutorial' : 'Ver tutorial'}
          </button>

          <button
            onClick={() => {
              setShowMenu(false);
              resetAll();
              setTimeout(() => startTour(currentRoute), 100);
            }}
            style={menuItemStyle}
          >
            <ArrowRepeat size={14} style={{ marginRight: 8, color: '#f5a623' }} />
            Reiniciar todos los tutoriales
          </button>
        </div>
      )}
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  background: 'none',
  border: 'none',
  padding: '8px 16px',
  fontSize: 14,
  color: '#333',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s',
};

export default TutorialButton;
