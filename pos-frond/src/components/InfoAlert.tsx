import * as React from 'react';
import { Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { removeNotification } from '../redux/ui';
import { RootState } from '../redux/store';
import ReactDOM from 'react-dom';

interface AlertComponentProps {
  id: string;
  color: string;
  message: string;
  onRemoveNotification: (id: string) => void;
}

const InfoAlert: React.FC = () => {
  const notifications = useSelector((state: RootState) => state.ui.notifications);
  const dispatch = useDispatch();

  const handleRemoveNotification = (id: string) => {
    dispatch(removeNotification(id));
  };
  return (
    <div className='info-alert'>
      {notifications.map((notification, i) => (
        <AlertComponent
          key={i}
          id={notification.id || ''}
          color={notification.color || 'success'}
          message={notification.message}
          onRemoveNotification={handleRemoveNotification}
        />
      ))}
    </div>
  );
};

const AlertComponent: React.FC<AlertComponentProps> = ({ id, color, message, onRemoveNotification }) => {
  const [show, setShow] = React.useState(true);

  const onDismiss = () => {
    setShow(false);
    onRemoveNotification(id);
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemoveNotification(id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onRemoveNotification]);

  if (!show) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        zIndex: 9999,
        right: '20px',
        top: '40px',
      }}
    >
      <Alert
        variant={color}
        dismissible
        onClose={onDismiss}
        style={{
          display: 'inline-block',
          whiteSpace: 'pre-wrap',
          pointerEvents: 'auto',
          wordWrap: 'break-word',
        }}
      >
        {message}
      </Alert>
    </div>,
    document.body
  );
};

export default InfoAlert;
