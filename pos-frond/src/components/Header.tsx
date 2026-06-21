import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Button, Container, Offcanvas, Dropdown } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import { RootState } from '../redux/store';
import { logout } from '../redux/auth';
import { List as ListIcon, PersonCircle } from 'react-bootstrap-icons';
import api from '../utils/axios';
import { getCashBox, setCashBox } from '../redux/ui';
import styles from './Header.module.scss';
import TutorialButton from './TutorialButton';
import { fmtCOP } from '../utils/format';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const cashBoxes = useSelector((state: RootState) => state.ui.cashBoxes);
  const selectedCashBox = useSelector((state: RootState) => state.ui.cashBox);
  const [showSidebar, setShowSidebar] = useState(false);

  React.useEffect(() => {
    if (isLoggedIn) {
      api.get('/cash-box').then(({ data }) => dispatch(getCashBox(data))).catch(console.error);
    }
  }, [isLoggedIn, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleCloseSidebar = () => setShowSidebar(false);
  const handleShowSidebar = () => setShowSidebar(true);

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: 'var(--light-color)',
      borderColor: 'var(--medium-gray)',
      color: 'var(--dark-color)',
      minWidth: '150px',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'var(--dark-color)',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'var(--white-color)',
      color: 'var(--dark-color)',
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected ? 'var(--primary-color)' : isFocused ? 'var(--light-gray)' : 'var(--white-color)',
      color: isSelected ? 'var(--primary-text-color)' : 'var(--dark-color)',
      ':active': {
        backgroundColor: 'var(--primary-hover-color)',
      },
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--muted-color)',
    }),
  };

  const navLinkStyle = {
    color: 'var(--dark-color)',
    textDecoration: 'none'
  };

  return (
    <>
      <Navbar expand="lg" className={styles.header} variant="light" bg="white">
        <Container fluid className="pl-4 pr-4 d-flex justify-content-between align-items-center">
          <Button onClick={handleShowSidebar} className={`d-lg-none me-2 ${styles.sidebarToggleButton}`} data-tour="header-sidebar-btn">
            <ListIcon size={20} />
          </Button>
          <Button onClick={handleShowSidebar} className={`d-none d-lg-block me-3 ${styles.sidebarToggleButton}`} data-tour="header-sidebar-btn">
            <ListIcon size={20} />
          </Button>

          <Navbar.Brand as={Link} to="/" className="me-auto text-dark d-flex align-items-center">
            <img
              src={`${process.env.PUBLIC_URL}/logo.svg`}
              alt="Prizma Sinergia"
              width={28}
              height={28}
              className="me-2"
              style={{ borderRadius: 8 }}
            />
            Prizma Sinergia
          </Navbar.Brand>

          <div className="d-flex align-items-center ms-auto">
            {isLoggedIn && (
              <div className="me-3" data-tour="header-cashbox-select">
                <Select
                  options={cashBoxes.map(cb => ({ value: cb.id, label: `${cb.name}: Balance ${fmtCOP(cb.balance)}` }))}
                  value={selectedCashBox && { value: selectedCashBox.id, label: `${selectedCashBox.name}: Balance ${fmtCOP(selectedCashBox.balance)}` }}
                  placeholder="Seleccionar Caja"
                  styles={selectStyles}
                  isSearchable={false}
                  onChange={(opt: any) => {
                    const box = cashBoxes.find(cb => cb.id === opt.value);
                    if (box) dispatch(setCashBox(box));
                  }}
                />
              </div>
            )}

            {isLoggedIn && (
              <TutorialButton />
            )}

            {isLoggedIn && (
              <Dropdown align="end" data-tour="header-profile-btn">
                <Dropdown.Toggle variant="light" id="profile-dropdown">
                  <PersonCircle size={24} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile/edit">
                    Editar perfil
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    Cerrar sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>

        </Container>
      </Navbar>

      <Offcanvas show={showSidebar} onHide={handleCloseSidebar} placement="start" className={styles.sidebar}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menú</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            <Nav.Link as={Link} to="/clients" onClick={handleCloseSidebar} style={navLinkStyle}>Clientes</Nav.Link>
            <Nav.Link as={Link} to="/products" onClick={handleCloseSidebar} style={navLinkStyle}>Productos</Nav.Link>
            <Nav.Link as={Link} to="/invoice" onClick={handleCloseSidebar} style={navLinkStyle}>Facturas</Nav.Link>
            <Nav.Link as={Link} to="/settings" onClick={handleCloseSidebar} style={navLinkStyle}>Configuraciones</Nav.Link>
            <Nav.Link as={Link} to="/subscribe" onClick={handleCloseSidebar} style={navLinkStyle}>Suscripciones</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Header;
