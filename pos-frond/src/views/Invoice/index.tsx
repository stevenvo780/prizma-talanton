import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Button,
  Form,
  Table,
  Pagination,
  Row,
  Col,
  Container,
  Card,
  Alert,
  Spinner,
  Badge,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './InvoiceList.css';
import { fmtCOP } from '../../utils/format';
import api from '../../utils/axios';
import { Invoice, PaymentStatus, PaymentType } from '../../utils/types';
import { emitDianInvoice, DianInvoiceRecord } from '../../services/dianService';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../redux/ui';
import {
  CaretUpFill,
  CaretDownFill,
  ArrowDownUp,
  FileEarmarkBarGraph,
  BoxSeam,
  CheckCircleFill,
  HourglassSplit,
  Receipt,
  ExclamationTriangleFill,
} from 'react-bootstrap-icons';

const InvoiceList: React.FC = () => {
  const dispatch = useDispatch();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage] = useState(10);
  const [paymentType, setPaymentType] = useState<string>(PaymentType.GatewayPayment);
  const [paymentStatus, setPaymentStatus] = useState(PaymentStatus.Unpaid);
  const [loading, setLoading] = useState(false);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingProducts, setExportingProducts] = useState(false);

  // Modal de confirmación DIAN
  const [showDianConfirm, setShowDianConfirm] = useState(false);
  const [dianConfirmInvoiceId, setDianConfirmInvoiceId] = useState<number | null>(null);

  // Modal de resultado DIAN
  const [showDianResult, setShowDianResult] = useState(false);
  const [dianResultData, setDianResultData] = useState<{ success: boolean; title: string; message: string } | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    clientSearch: '',
    consecutiveStart: '',
    consecutiveEnd: '',
    trackingNumber: '',
    paymentTypeFilter: '',
    paymentStatusFilter: '',
    minAmount: '',
    maxAmount: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Estado DIAN
  const [emittingDian, setEmittingDian] = useState<number | null>(null);
  const [dianResults, setDianResults] = useState<Record<number, DianInvoiceRecord>>({});

  const askEmitDian = (invoiceId: number) => {
    setDianConfirmInvoiceId(invoiceId);
    setShowDianConfirm(true);
  };

  const handleEmitDian = async () => {
    if (!dianConfirmInvoiceId) return;
    const invoiceId = dianConfirmInvoiceId;
    setShowDianConfirm(false);
    setEmittingDian(invoiceId);
    try {
      const result = await emitDianInvoice({ invoiceId });
      setDianResults(prev => ({ ...prev, [invoiceId]: result }));
      setDianResultData({
        success: true,
        title: 'Factura electrónica emitida',
        message: `Documento: ${result.prefix ? result.prefix + '-' : ''}${result.documentNumber}\nCUFE: ${result.cufe || 'Pendiente'}`,
      });
      setShowDianResult(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al emitir factura electrónica';
      setDianResultData({
        success: false,
        title: 'Error al emitir factura electrónica',
        message: msg,
      });
      setShowDianResult(true);
    } finally {
      setEmittingDian(null);
      setDianConfirmInvoiceId(null);
    }
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Paginación
      params.append('page', currentPage.toString());
      params.append('limit', invoicesPerPage.toString());
      
      // Ordenamiento
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      // Filtros de fecha
      if (filters.startDate) {
        params.append('startDate', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate.toISOString().split('T')[0]);
      }
      
      // Otros filtros
      if (filters.clientSearch) params.append('clientSearch', filters.clientSearch);
      if (filters.consecutiveStart) params.append('consecutiveStart', filters.consecutiveStart);
      if (filters.consecutiveEnd) params.append('consecutiveEnd', filters.consecutiveEnd);
      if (filters.trackingNumber) params.append('trackingNumber', filters.trackingNumber);
      if (filters.paymentTypeFilter) params.append('paymentType', filters.paymentTypeFilter);
      if (filters.paymentStatusFilter) params.append('paymentStatus', filters.paymentStatusFilter);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const { data } = await api.get(`/invoice?${params.toString()}`);
      
      setInvoices(data.data || []);
      setTotalInvoices(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, invoicesPerPage, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      clientSearch: '',
      consecutiveStart: '',
      consecutiveEnd: '',
      trackingNumber: '',
      paymentTypeFilter: '',
      paymentStatusFilter: '',
      minAmount: '',
      maxAmount: '',
    });
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Si ya estamos ordenando por este campo, cambiar la dirección
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Si es un campo nuevo, empezar con DESC
      setSortBy(field);
      setSortOrder('DESC');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowDownUp size={12} />;
    }
    return sortOrder === 'ASC' ? <CaretUpFill size={12} /> : <CaretDownFill size={12} />;
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      
      // Añadir todos los filtros actuales
      if (filters.startDate) {
        params.append('startDate', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate.toISOString().split('T')[0]);
      }
      if (filters.clientSearch) params.append('clientSearch', filters.clientSearch);
      if (filters.consecutiveStart) params.append('consecutiveStart', filters.consecutiveStart);
      if (filters.consecutiveEnd) params.append('consecutiveEnd', filters.consecutiveEnd);
      if (filters.trackingNumber) params.append('trackingNumber', filters.trackingNumber);
      if (filters.paymentTypeFilter) params.append('paymentType', filters.paymentTypeFilter);
      if (filters.paymentStatusFilter) params.append('paymentStatus', filters.paymentStatusFilter);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const response = await api.get(`/invoice/export/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facturas_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      dispatch(addNotification({ message: 'Error al exportar a Excel. Por favor, intente nuevamente.', color: 'danger' }));
    } finally {
      setExporting(false);
    }
  };

  const exportProductsSummary = async () => {
    setExportingProducts(true);
    try {
      const params = new URLSearchParams();
      
      // Añadir todos los filtros actuales
      if (filters.startDate) {
        params.append('startDate', filters.startDate.toISOString().split('T')[0]);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate.toISOString().split('T')[0]);
      }
      if (filters.clientSearch) params.append('clientSearch', filters.clientSearch);
      if (filters.consecutiveStart) params.append('consecutiveStart', filters.consecutiveStart);
      if (filters.consecutiveEnd) params.append('consecutiveEnd', filters.consecutiveEnd);
      if (filters.trackingNumber) params.append('trackingNumber', filters.trackingNumber);
      if (filters.paymentTypeFilter) params.append('paymentType', filters.paymentTypeFilter);
      if (filters.paymentStatusFilter) params.append('paymentStatus', filters.paymentStatusFilter);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

      const response = await api.get(`/invoice/export/products?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `productos_resumen_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting products summary:', error);
      dispatch(addNotification({ message: 'Error al exportar el resumen de productos. Por favor, intente nuevamente.', color: 'danger' }));
    } finally {
      setExportingProducts(false);
    }
  };

  const handleShowModal = (invoice: Invoice | null = null) => {
    setSelectedInvoice(invoice);
    setPaymentStatus(invoice?.paymentStatus || PaymentStatus.Unpaid);
    setPaymentType(invoice?.paymentType || PaymentType.GatewayPayment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
  };

  const handlePaymentTypeChange = (event: any) => {
    const value = event.target.value as PaymentType;
    setPaymentType(value);
  };

  const handlePaymentStatusChange = (event: any) => {
    setPaymentStatus(event.target.checked ? PaymentStatus.Paid : PaymentStatus.Unpaid);
  };

  const updateInvoice = async () => {
    if (selectedInvoice) {
      await api.patch(`/invoice/${selectedInvoice.id}`, {
        ...selectedInvoice,
        paymentType,
        paymentStatus,
      });
      fetchInvoices();
      handleCloseModal();
    }
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  const renderPagination = () => {
    let items = [];
    const totalPagesCalc = Math.ceil(totalInvoices / invoicesPerPage);
    
    for (let number = 1; number <= totalPagesCalc; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage} 
          onClick={() => paginate(number)}
        >
          {number}
        </Pagination.Item>,
      );
    }
    return items;
  };

  const renderAddress = (address: string) => {
    try {
      const addressObj = JSON.parse(address);
      return (
        <div>
          <p>País: {addressObj.country}</p>
          <p>Ciudad: {addressObj.city}</p>
          <p>Estado/Provincia: {addressObj.state}</p>
          <p>Código Postal: {addressObj.zip}</p>
          <p>Dirección: {addressObj.street_address}</p>
        </div>
      );
    } catch (e) {
      return <p>{address}</p>;
    }
  };

  return (
    <Container fluid className="p-4">
      {/* Header con estadísticas */}
      <div className="invoice-stats">
        <Row>
          <Col md={3} className="stats-item">
            <h4>{totalInvoices}</h4>
            <p>Total de Facturas</p>
          </Col>
          <Col md={3} className="stats-item">
            <h4>{fmtCOP(invoices.reduce((acc, inv) => {
              const amount = typeof inv.totalAmount === 'string' ? parseFloat(inv.totalAmount) : Number(inv.totalAmount || 0);
              return acc + amount;
            }, 0))}</h4>
            <p>Valor Total</p>
          </Col>
          <Col md={3} className="stats-item">
            <h4>{invoices.filter(inv => inv.paymentStatus === PaymentStatus.Paid).length}</h4>
            <p>Facturas Pagadas</p>
          </Col>
          <Col md={3} className="stats-item">
            <h4>{invoices.filter(inv => inv.paymentStatus === PaymentStatus.Unpaid).length}</h4>
            <p>Facturas Pendientes</p>
          </Col>
        </Row>
      </div>

      {/* Header con botones de acción */}
      <div className="invoice-header">
        <Row className="align-items-center">
          <Col md={8}>
            <h2 className="mb-0">Gestión de Facturas</h2>
          </Col>
          <Col md={4}>
            <div className="d-flex action-buttons justify-content-end" data-tour="invoice-export-btn">
              <Button 
                variant="outline-primary" 
                onClick={() => setShowFilters(!showFilters)}
                className="me-2"
                data-tour="invoice-filters"
              >
                {showFilters ? 'Filtros' : 'Filtros'}
              </Button>
              <Button 
                variant="success" 
                onClick={exportToExcel}
                disabled={exporting || invoices.length === 0}
                className="export-button me-2"
              >
                {exporting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Exportando...
                  </>
                ) : (
                  <><FileEarmarkBarGraph className="me-1" /> Facturas</>
                )}
              </Button>
              <Button 
                variant="info" 
                onClick={exportProductsSummary}
                disabled={exportingProducts || invoices.length === 0}
                className="export-button"
              >
                {exportingProducts ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Exportando...
                  </>
                ) : (
                  <><BoxSeam className="me-1" /> Productos</>
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <Card className="invoice-filters">
          <Card.Header>
            <h5 className="mb-0">Filtros de Búsqueda</h5>
          </Card.Header>
          <Card.Body>
            <div className="filter-section">
              <h6>Filtros por Fecha</h6>
              <Row className="filter-row">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fecha Desde</Form.Label>
                    <div className="date-picker-container">
                      <DatePicker
                        selected={filters.startDate}
                        onChange={(date) => handleFilterChange('startDate', date)}
                        className="form-control"
                        placeholderText="Seleccionar fecha"
                        dateFormat="yyyy-MM-dd"
                        maxDate={new Date()}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Fecha Hasta</Form.Label>
                    <div className="date-picker-container">
                      <DatePicker
                        selected={filters.endDate}
                        onChange={(date) => handleFilterChange('endDate', date)}
                        className="form-control"
                        placeholderText="Seleccionar fecha"
                        dateFormat="yyyy-MM-dd"
                        maxDate={new Date()}
                        minDate={filters.startDate || undefined}
                      />
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="filter-section">
              <h6>Filtros por Cliente y Documento</h6>
              <Row className="filter-row">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Buscar Cliente</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nombre, apellido o documento"
                      value={filters.clientSearch}
                      onChange={(e) => handleFilterChange('clientSearch', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Número de Seguimiento</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Número de seguimiento"
                      value={filters.trackingNumber}
                      onChange={(e) => handleFilterChange('trackingNumber', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="filter-section">
              <h6>Filtros por Consecutivos</h6>
              <Row className="filter-row">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Consecutivo Desde</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Número inicial"
                      value={filters.consecutiveStart}
                      onChange={(e) => handleFilterChange('consecutiveStart', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Consecutivo Hasta</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Número final"
                      value={filters.consecutiveEnd}
                      onChange={(e) => handleFilterChange('consecutiveEnd', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="filter-section">
              <h6>Filtros por Pagos y Montos</h6>
              <Row className="filter-row">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Tipo de Pago</Form.Label>
                    <Form.Control
                      as="select"
                      value={filters.paymentTypeFilter}
                      onChange={(e) => handleFilterChange('paymentTypeFilter', e.target.value)}
                    >
                      <option value="">Todos los tipos</option>
                      <option value={PaymentType.GatewayPayment}>Pago por Pasarela</option>
                      <option value={PaymentType.CashOnDelivery}>Pago Contra Entrega</option>
                      <option value={PaymentType.AccountReceivable}>Cuenta por Cobrar</option>
                      <option value={PaymentType.Pistis}>Crédito Prizma</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Estado de Pago</Form.Label>
                    <Form.Control
                      as="select"
                      value={filters.paymentStatusFilter}
                      onChange={(e) => handleFilterChange('paymentStatusFilter', e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      <option value={PaymentStatus.Paid}>Pagado</option>
                      <option value={PaymentStatus.Unpaid}>Sin Pagar</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Monto Mínimo</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="$0"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Monto Máximo</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="$999,999"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="text-center">
              <Button variant="secondary" onClick={clearFilters} className="me-2">
                Limpiar Todos los Filtros
              </Button>
              <Button variant="primary" onClick={fetchInvoices}>
                Aplicar Filtros
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Tabla de facturas */}
      <div className="invoice-table-container" data-tour="invoice-table">
        {loading ? (
          <div className="loading-overlay">
            <Spinner animation="border" />
            <p className="mt-2">Cargando facturas...</p>
          </div>
        ) : (
          <>
            <Table bordered responsive className="invoice-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('date')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Fecha {getSortIcon('date')}
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('tracking_number')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Seguimiento {getSortIcon('tracking_number')}
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('consecutive')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Consecutivo {getSortIcon('consecutive')}
                  </th>
                  <th>Cliente</th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('totalAmount')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Monto Total {getSortIcon('totalAmount')}
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('paymentType')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Tipo de Pago {getSortIcon('paymentType')}
                  </th>
                  <th 
                    className="sortable-header" 
                    onClick={() => handleSort('paymentStatus')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Estado {getSortIcon('paymentStatus')}
                  </th>
                  <th>DIAN</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: Invoice, index: number) => (
                  <tr key={invoice.id}>
                    <td>{(currentPage - 1) * invoicesPerPage + index + 1}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>{invoice.tracking_number}</td>
                    <td>{invoice.consecutive}</td>
                    <td>{invoice.client.documentNumber || invoice.client.name}</td>
                    <td>{fmtCOP(invoice.totalAmount)}</td>
                    <td>
                      <Badge 
                        bg={
                          invoice.paymentType === PaymentType.GatewayPayment ? 'primary' :
                          invoice.paymentType === PaymentType.CashOnDelivery ? 'warning' :
                          invoice.paymentType === PaymentType.AccountReceivable ? 'info' : 'secondary'
                        }
                        className="badge-payment-type"
                      >
                        {invoice.paymentType === PaymentType.GatewayPayment ? 'Pasarela' :
                         invoice.paymentType === PaymentType.CashOnDelivery ? 'Contra Entrega' :
                         invoice.paymentType === PaymentType.AccountReceivable ? 'Por Cobrar' : 'Crédito Prizma'}
                      </Badge>
                    </td>
                    <td>
                      <Badge 
                        bg={invoice.paymentStatus === PaymentStatus.Paid ? 'success' : 'danger'}
                        className="badge-payment-status"
                      >
                        {invoice.paymentStatus === PaymentStatus.Paid ? 'Pagado' : 'Sin Pagar'}
                      </Badge>
                    </td>
                    <td>
                      {dianResults[invoice.id] ? (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              CUFE: {dianResults[invoice.id].cufe?.substring(0, 20) || 'Pendiente'}...
                            </Tooltip>
                          }
                        >
                          <Badge bg={dianResults[invoice.id].dianStatus === 'STAMPED' ? 'success' : 'warning'}>
                            {dianResults[invoice.id].dianStatus === 'STAMPED' ? <CheckCircleFill className="me-1" /> : <HourglassSplit className="me-1" />}
                            {dianResults[invoice.id].prefix ? ` ${dianResults[invoice.id].prefix}-` : ' '}
                            {dianResults[invoice.id].documentNumber}
                          </Badge>
                        </OverlayTrigger>
                      ) : (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => askEmitDian(invoice.id)}
                          disabled={emittingDian === invoice.id}
                          title="Emitir factura electrónica DIAN"
                        >
                          {emittingDian === invoice.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <><Receipt className="me-1" /> Emitir FE</>
                          )}
                        </Button>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => handleShowModal(invoice)}
                      >
                        Ver Detalles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            
            {invoices.length === 0 && (
              <div className="no-results">
                <Alert variant="info">
                  <i className="bi bi-search"></i>
                  <h5>No se encontraron facturas</h5>
                  <p>No hay facturas que coincidan con los filtros aplicados.</p>
                </Alert>
              </div>
            )}
            
            <div className="pagination-container">
              <Pagination>
                {renderPagination()}
              </Pagination>
            </div>
          </>
        )}
      </div>
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title>Detalles de la Factura</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
          {selectedInvoice && (
            <>
              <Row>
                <Col md={12}>
                  <p>Orden: {selectedInvoice.id}</p>
                  <p>Consecutivo de Factura: {selectedInvoice.consecutive}</p>
                  {selectedInvoice.tracking_number && (
                    <p>Seguimiento: {selectedInvoice.tracking_number}</p>
                  )}
                </Col>
                <Col md={6}>
                  <h5><strong>Cliente</strong></h5>
                  <p>Número de Documento: {selectedInvoice.client.documentNumber}</p>
                  <p>Nombre: {selectedInvoice.client.name} {selectedInvoice.client.surname}</p>
                  <p>Email: {selectedInvoice.client.email}</p>
                  <p>Teléfono: {selectedInvoice.client.phone}</p>
                  <div>{renderAddress(selectedInvoice?.client?.address || '')}</div>
                </Col>
                <Col md={6}>
                  <h5><strong>Factura</strong></h5>
                  <p>Fecha: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                  <p>Consecutivo: {selectedInvoice.consecutive}</p>
                  <p>Monto Total: {fmtCOP(selectedInvoice.totalAmount)}</p>
                </Col>
              </Row>
              <Row>
                <Table bordered>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>C/U</th>
                      <th>Cantidad</th>
                      <th>Neto</th>
                      <th>Impuesto</th>
                      <th>Descuento</th>
                      <th>Total</th>
                      <th>Tipo de precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice && selectedInvoice.invoiceItems.map((item, index) => {
                      const priceType = item.product.priceTypes.find(priceType => {
                        return priceType?.category?.id === item.productPriceTypeId;
                      });
                      return (
                        <tr key={index}>
                          <td>{item.productName}</td>
                          <td>{item.sku || 'N/A'}</td>
                          <td>{fmtCOP(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{fmtCOP(item.quantity * item.price)}</td>
                          <td>{fmtCOP(item.price * item.quantity * (item.totalTax ?? 0 / 100))}</td>
                          <td>{fmtCOP(item.price * item.quantity * (item.totalDiscount ?? 0 / 100))}</td>
                          <td>{fmtCOP(item.price * item.quantity * (1 + ((item?.totalTax ?? 0) - (item?.totalDiscount ?? 0)) / 100))}</td>
                          <td>{priceType?.category?.name}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </Row>
            </>
          )}
          <Form>
            <Form.Group controlId="paymentType">
              <Form.Label>Método de Pago</Form.Label>
              <Form.Control as="select" value={paymentType} onChange={handlePaymentTypeChange}>
                <option value={PaymentType.GatewayPayment}>Pago por Pasarela</option>
                <option value={PaymentType.CashOnDelivery}>Pago Contra Entrega</option>
                <option value={PaymentType.AccountReceivable}>Cuenta por Cobrar</option>
              </Form.Control>
            </Form.Group>
            <br />
            <Form.Group controlId="paymentStatus" style={{ marginBottom: "20px" }}>
              <Form.Check
                type="checkbox"
                label="Pagado"
                checked={paymentStatus === PaymentStatus.Paid}
                onChange={handlePaymentStatusChange}
                style={{ fontSize: '1.6rem' }}
              />
            </Form.Group>
            <Button variant="primary" onClick={updateInvoice}>Actualizar Factura</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal de confirmación para emitir FE DIAN */}
      <Modal show={showDianConfirm} onHide={() => setShowDianConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar emisión DIAN</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex align-items-center">
            <ExclamationTriangleFill size={32} className="text-warning me-3" />
            <p className="mb-0">
              ¿Está seguro de emitir la factura electrónica ante la DIAN?
              Esta acción no se puede deshacer.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDianConfirm(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleEmitDian}>
            Sí, emitir factura electrónica
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de resultado de emisión DIAN */}
      <Modal show={showDianResult} onHide={() => setShowDianResult(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {dianResultData?.success ? (
              <><CheckCircleFill className="text-success me-2" /> {dianResultData.title}</>
            ) : (
              <><ExclamationTriangleFill className="text-danger me-2" /> {dianResultData?.title}</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={dianResultData?.success ? 'success' : 'danger'}>
            {dianResultData?.message?.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant={dianResultData?.success ? 'success' : 'secondary'}
            onClick={() => setShowDianResult(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InvoiceList;
