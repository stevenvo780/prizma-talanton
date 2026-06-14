import React from 'react';
import { CheckLg } from 'react-bootstrap-icons';

interface StepperProps {
  currentStep: number;
  labels: string[];
  onStepClick?: (step: number) => void;
  enabledSteps?: boolean[];
}

const Stepper: React.FC<StepperProps> = ({ currentStep, labels, onStepClick, enabledSteps = [] }) => (
  <div className="d-flex justify-content-center align-items-center px-2 py-3">
    {labels.map((label, index) => {
      const step = index + 1;
      const isActive = currentStep === step;
      const isDone = currentStep > step;
      const isEnabled = enabledSteps[index] !== false;

      const circleStyle: React.CSSProperties = {
        width: 36,
        height: 36,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        flexShrink: 0,
        transition: 'all .2s',
        ...(isDone
          ? { background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,.4)' }
          : isActive
          ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 2px 12px rgba(99,102,241,.45)' }
          : { background: '#f3f4f6', color: '#9ca3af', border: '2px solid #e5e7eb' }),
      };

      return (
        <React.Fragment key={index}>
          <div
            className="d-flex flex-column align-items-center"
            style={{ minWidth: 60, cursor: onStepClick && isEnabled ? 'pointer' : 'default' }}
            onClick={() => onStepClick && isEnabled && onStepClick(step)}
          >
            <div style={circleStyle}>
              {isDone ? <CheckLg size={16} /> : step}
            </div>
            <span
              style={{
                marginTop: 6,
                fontSize: '0.72rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#6366f1' : isDone ? '#10b981' : '#9ca3af',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>

          {index < labels.length - 1 && (
            <div
              style={{
                height: 3,
                flex: 1,
                margin: '0 4px',
                marginBottom: 20,
                borderRadius: 4,
                background: isDone
                  ? 'linear-gradient(to right,#10b981,#059669)'
                  : '#e5e7eb',
                transition: 'background .3s',
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

export default Stepper;
