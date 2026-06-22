import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  ProgressBar,
  Badge,
} from 'react-bootstrap';
import api from '../utils/axios';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { addNotification, getCashBox, setCashBox } from '../redux/ui';
import { configureDianProvider } from '../services/dianService';
import {
  Building,
  CashCoin,
  BoxSeam,
  Receipt,
  TrophyFill,
  RocketTakeoffFill,
  CheckLg,
  CheckCircleFill,
  ArrowLeft,
  ArrowRight,
} from 'react-bootstrap-icons';

/* ──────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────── */

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface StepMeta {
  key: string;
  label: string;
}

/* ──────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────── */

const STEPS: StepMeta[] = [
  { key: 'company', label: 'Empresa' },
  { key: 'cashbox', label: 'Caja' },
  { key: 'product', label: 'Producto' },
  { key: 'dian', label: 'DIAN' },
  { key: 'done', label: 'Listo' },
];

const TAX_REGIMES = [
  'Responsable de IVA',
  'No responsable de IVA',
  'Régimen Simple',
  'Gran Contribuyente',
] as const;

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.userData);
  const userId = user?.id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fadeClass, setFadeClass] = useState('onb-fade-in');
  const [validated, setValidated] = useState(false);

  // Step 1: Company data
  const [profileId, setProfileId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [nit, setNit] = useState('');
  const [dv, setDv] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [taxRegime, setTaxRegime] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Cash box
  const [cashBoxName, setCashBoxName] = useState('Caja Principal');
  const [cashBoxBalance, setCashBoxBalance] = useState('0');
  const [cashBoxCreated, setCashBoxCreated] = useState(false);

  // Step 3: Product
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCreated, setProductCreated] = useState(false);

  // Step 4: DIAN
  const [alegraEmail, setAlegraEmail] = useState('');
  const [alegraToken, setAlegraToken] = useState('');
  const [dianConfigured, setDianConfigured] = useState(false);

  /* ── Completion tracking ─────────────────────────────── */
  const completedSteps = useMemo(() => {
    const set = new Set<number>();
    if (companyName && nit) set.add(1);
    if (cashBoxCreated) set.add(2);
    if (productCreated) set.add(3);
    if (dianConfigured) set.add(4);
    return set;
  }, [companyName, nit, cashBoxCreated, productCreated, dianConfigured]);

  const progress = useMemo(() => {
    const completed = [1, 2, 3].filter((s) => completedSteps.has(s)).length;
    return Math.round((completed / 3) * 100);
  }, [completedSteps]);

  /* ── Animated step transitions ───────────────────────── */
  const goToStep = useCallback((step: number) => {
    setFadeClass('onb-fade-out');
    setValidated(false);
    setTimeout(() => {
      setCurrentStep(step);
      setFadeClass('onb-fade-in');
    }, 150);
  }, []);

  /* ── Load existing data on mount ─────────────────────── */
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    Promise.all([
      api.get(`/profile/user/${userId}`).catch(() => ({ data: null })),
      api.get('/cash-box').catch(() => ({ data: [] })),
      api.get('/product').catch(() => ({ data: [] })),
    ])
      .then(([resProfile, resCashBoxes, resProducts]) => {
        const p = resProfile.data;
        if (p) {
          setProfileId(p.id);
          setCompanyName(p.companyName || '');
          setNit(p.nit || '');
          setDv(p.dv || '');
          setLegalAddress(p.legalAddress || '');
          setTaxRegime(p.taxRegime || '');
          setPhone(p.phone || '');
          if (p.dianConfig) setDianConfigured(true);
        }

        const boxes = Array.isArray(resCashBoxes.data) ? resCashBoxes.data : [];
        if (boxes.length > 0) setCashBoxCreated(true);

        const products = Array.isArray(resProducts.data)
          ? resProducts.data
          : resProducts.data?.data || [];
        if (products.length > 0) setProductCreated(true);

        // Jump to first incomplete step
        if (!p?.companyName || !p?.nit) setCurrentStep(1);
        else if (boxes.length === 0) setCurrentStep(2);
        else if (products.length === 0) setCurrentStep(3);
        else setCurrentStep(5);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  /* ──────────────────────────────────────────────────────
     Step Handlers
     ────────────────────────────────────────────────────── */

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);

    if (!companyName.trim() || !nit.trim()) {
      dispatch(addNotification({ message: 'Completa los campos obligatorios', color: 'warning' }));
      return;
    }

    setSaving(true);
    try {
      const payload = { companyName, nit, dv, legalAddress, taxRegime, phone };

      if (profileId) {
        await api.patch(`/profile/${profileId}`, payload);
      } else {
        const { data } = await api.post('/profile', { ...payload, userId });
        if (data?.id) setProfileId(data.id);
      }

      dispatch(addNotification({ message: 'Datos de empresa guardados', color: 'success' }));
      goToStep(2);
    } catch (error: any) {
      dispatch(addNotification({
        message: error.response?.data?.message || 'Error al guardar datos de empresa',
        color: 'danger',
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCashBox = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);

    if (!cashBoxName.trim()) {
      dispatch(addNotification({ message: 'El nombre de la caja es obligatorio', color: 'warning' }));
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/cash-box', {
        name: cashBoxName,
        balance: parseFloat(cashBoxBalance) || 0,
        cashIn: 0,
        cashOut: 0,
      });

      const { data: allBoxes } = await api.get('/cash-box');
      dispatch(getCashBox(allBoxes));
      if (data) dispatch(setCashBox(data));

      setCashBoxCreated(true);
      dispatch(addNotification({ message: 'Caja creada exitosamente', color: 'success' }));
      goToStep(3);
    } catch (error: any) {
      dispatch(addNotification({
        message: error.response?.data?.message || 'Error al crear la caja',
        color: 'danger',
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);

    const price = parseFloat(productPrice);
    if (!productName.trim()) {
      dispatch(addNotification({ message: 'El nombre del producto es obligatorio', color: 'warning' }));
      return;
    }
    if (!price || price <= 0) {
      dispatch(addNotification({ message: 'El precio debe ser mayor a $0', color: 'warning' }));
      return;
    }

    setSaving(true);
    try {
      await api.post('/product', {
        name: productName,
        sortName: productName.toLowerCase(),
        description: productDescription || '',
        state: true,
        categories: [],
        priceTypes: [{
          sku: productName.substring(0, 3).toUpperCase().padEnd(3, 'X') + '001',
          price,
        }],
      });

      setProductCreated(true);
      dispatch(addNotification({ message: 'Producto creado exitosamente', color: 'success' }));
      goToStep(4);
    } catch (error: any) {
      dispatch(addNotification({
        message: error.response?.data?.message || 'Error al crear el producto',
        color: 'danger',
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleConfigureDian = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);

    if (!alegraEmail.trim() || !alegraToken.trim()) {
      dispatch(addNotification({ message: 'Ingresa email y token de Alegra', color: 'warning' }));
      return;
    }

    setSaving(true);
    try {
      await configureDianProvider({
        providerName: 'alegra',
        email: alegraEmail,
        token: alegraToken,
      });
      setDianConfigured(true);
      dispatch(addNotification({ message: 'Facturación electrónica configurada', color: 'success' }));
      goToStep(5);
    } catch (error: any) {
      dispatch(addNotification({
        message: error.response?.data?.message || 'Error al validar credenciales de Alegra',
        color: 'danger',
      }));
    } finally {
      setSaving(false);
    }
  };

  /* ──────────────────────────────────────────────────────
     Navigation helpers
     ────────────────────────────────────────────────────── */

  const canGoToStep = useCallback((step: number): boolean => {
    if (step <= currentStep) return true;
    // Steps 1-3 must be completed in order; step 4 (DIAN) is optional
    for (let s = 1; s < step; s++) {
      if (s <= 3 && !completedSteps.has(s)) return false;
    }
    return true;
  }, [currentStep, completedSteps]);

  const handleStepClick = useCallback((step: number) => {
    if (step === currentStep) return;
    if (completedSteps.has(step) || canGoToStep(step)) {
      goToStep(step);
    }
  }, [currentStep, completedSteps, canGoToStep, goToStep]);

  /* ──────────────────────────────────────────────────────
     Loading state
     ────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={S.fullPage}>
        <div className="text-center">
          <Spinner animation="border" style={{ color: '#f5a623', width: 48, height: 48 }} />
          <p className="mt-3" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
            Preparando tu espacio de trabajo…
          </p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────
     Main render
     ────────────────────────────────────────────────────── */

  return (
    <div style={S.fullPage}>
      <style>{ANIMATIONS_CSS}</style>

      <Container>
        <Row className="justify-content-center">
          <Col xs={12} md={9} lg={7} xl={6}>

            {/* ── Header ──────────────────────────────── */}
            <div className="text-center mb-4">
              <h2 style={S.title}>Configura tu comercio</h2>
              <p style={S.subtitle}>
                Completa estos pasos para empezar a vender
              </p>
              <ProgressBar
                now={progress}
                variant="warning"
                label={progress >= 20 ? `${progress}%` : ''}
                style={S.progressBar}
              />
            </div>

            {/* ── Step dots ───────────────────────────── */}
            <div className="d-flex justify-content-center mb-4" style={{ gap: 12 }}>
              {STEPS.map((step, i) => {
                const stepNum = i + 1;
                const isCompleted = completedSteps.has(stepNum);
                const isCurrent = currentStep === stepNum;
                const isClickable = isCompleted || canGoToStep(stepNum);

                return (
                  <div
                    key={step.key}
                    className={`onb-step-dot ${isClickable ? 'clickable' : ''}`}
                    onClick={() => isClickable && handleStepClick(stepNum)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => e.key === 'Enter' && isClickable && handleStepClick(stepNum)}
                    aria-label={`${step.label}: ${isCompleted ? 'completado' : isCurrent ? 'actual' : 'pendiente'}`}
                  >
                    <div
                      style={{
                        ...S.stepDot,
                        background: isCompleted
                          ? '#28a745'
                          : isCurrent
                            ? '#f5a623'
                            : 'rgba(255,255,255,0.15)',
                        border: isCurrent ? '2px solid #fff' : '2px solid transparent',
                      }}
                    >
                      {isCompleted ? <CheckLg size={14} /> : stepNum}
                    </div>
                    <small style={{
                      ...S.stepLabel,
                      color: isCurrent ? '#f5a623' : 'rgba(255,255,255,0.6)',
                      fontWeight: isCurrent ? 700 : 400,
                    }}>
                      {step.label}
                    </small>
                  </div>
                );
              })}
            </div>

            {/* ── Card content ────────────────────────── */}
            <Card className="onb-card" style={S.card}>
              <Card.Body style={S.cardBody}>
                <div className={fadeClass}>

                  {/* ═══ STEP 1: Company ═══ */}
                  {currentStep === 1 && (
                    <Form noValidate validated={validated} onSubmit={handleSaveCompany}>
                      <StepHeader
                        icon={<Building />}
                        title="Datos de tu comercio"
                        desc="Esta información aparecerá en tus facturas y documentos legales."
                      />

                      <Row>
                        <Col xs={12} md={8}>
                          <Form.Group className="mb-3" controlId="companyName">
                            <Form.Label style={S.label}>
                              Nombre de la empresa <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              required
                              className="onb-input"
                              type="text"
                              placeholder="Ej: Mi Tienda S.A.S"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              style={S.input}
                              autoFocus
                            />
                            <Form.Control.Feedback type="invalid">
                              El nombre es obligatorio.
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Group className="mb-3" controlId="phone">
                            <Form.Label style={S.label}>Teléfono</Form.Label>
                            <Form.Control
                              className="onb-input"
                              type="tel"
                              placeholder="300 123 4567"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s+()-]/g, ''))}
                              style={S.input}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col xs={7} md={5}>
                          <Form.Group className="mb-3" controlId="nit">
                            <Form.Label style={S.label}>
                              NIT <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              required
                              className="onb-input"
                              type="text"
                              placeholder="900123456"
                              value={nit}
                              onChange={(e) => setNit(e.target.value.replace(/[^0-9.-]/g, ''))}
                              style={S.input}
                            />
                            <Form.Control.Feedback type="invalid">
                              El NIT es obligatorio.
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col xs={5} md={3}>
                          <Form.Group className="mb-3" controlId="dv">
                            <Form.Label style={S.label}>DV</Form.Label>
                            <Form.Control
                              className="onb-input"
                              type="text"
                              placeholder="0"
                              value={dv}
                              onChange={(e) => setDv(e.target.value.replace(/\D/g, '').slice(0, 1))}
                              maxLength={1}
                              style={S.input}
                            />
                          </Form.Group>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Group className="mb-3" controlId="taxRegime">
                            <Form.Label style={S.label}>Régimen tributario</Form.Label>
                            <Form.Select
                              className="onb-input"
                              value={taxRegime}
                              onChange={(e) => setTaxRegime(e.target.value)}
                              style={S.input}
                            >
                              <option value="">Seleccionar…</option>
                              {TAX_REGIMES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3" controlId="legalAddress">
                        <Form.Label style={S.label}>Dirección legal</Form.Label>
                        <Form.Control
                          className="onb-input"
                          type="text"
                          placeholder="Cra 10 #15-30, Bogotá"
                          value={legalAddress}
                          onChange={(e) => setLegalAddress(e.target.value)}
                          style={S.input}
                        />
                      </Form.Group>

                      <StepActions saving={saving} submitLabel="Continuar →" />
                    </Form>
                  )}

                  {/* ═══ STEP 2: Cash Box ═══ */}
                  {currentStep === 2 && (
                    <Form noValidate validated={validated} onSubmit={handleCreateCashBox}>
                      <StepHeader
                        icon={<CashCoin />}
                        title="Tu primera caja registradora"
                        desc="Necesitas al menos una caja para registrar ventas. Puedes crear más después."
                      />

                      {cashBoxCreated ? (
                        <CompletedAlert text="Ya tienes una caja creada." />
                      ) : (
                        <>
                          <Form.Group className="mb-3" controlId="cashBoxName">
                            <Form.Label style={S.label}>
                              Nombre de la caja <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              required
                              className="onb-input"
                              type="text"
                              placeholder="Ej: Caja Principal"
                              value={cashBoxName}
                              onChange={(e) => setCashBoxName(e.target.value)}
                              style={S.input}
                              autoFocus
                            />
                            <Form.Control.Feedback type="invalid">
                              El nombre de la caja es obligatorio.
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-3" controlId="cashBoxBalance">
                            <Form.Label style={S.label}>Saldo inicial</Form.Label>
                            <div style={{ position: 'relative' }}>
                              <span style={S.currencyPrefix}>$</span>
                              <Form.Control
                                className="onb-input"
                                type="number"
                                min="0"
                                step="100"
                                placeholder="0"
                                value={cashBoxBalance}
                                onChange={(e) => setCashBoxBalance(e.target.value)}
                                style={{ ...S.input, paddingLeft: 28 }}
                              />
                            </div>
                            <Form.Text className="text-muted">
                              El dinero con el que empiezas el día. Puedes dejarlo en 0.
                            </Form.Text>
                          </Form.Group>
                        </>
                      )}

                      <StepActions
                        saving={saving}
                        onBack={() => goToStep(1)}
                        submitLabel={cashBoxCreated ? undefined : 'Crear caja →'}
                        onContinue={cashBoxCreated ? () => goToStep(3) : undefined}
                      />
                    </Form>
                  )}

                  {/* ═══ STEP 3: Product ═══ */}
                  {currentStep === 3 && (
                    <Form noValidate validated={validated} onSubmit={handleCreateProduct}>
                      <StepHeader
                        icon={<BoxSeam />}
                        title="Tu primer producto"
                        desc="Agrega al menos un producto o servicio. Podrás agregar más desde el menú."
                      />

                      {productCreated ? (
                        <CompletedAlert text="Ya tienes productos creados." />
                      ) : (
                        <>
                          <Form.Group className="mb-3" controlId="productName">
                            <Form.Label style={S.label}>
                              Nombre <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              required
                              className="onb-input"
                              type="text"
                              placeholder="Ej: Café americano, Corte de cabello…"
                              value={productName}
                              onChange={(e) => setProductName(e.target.value)}
                              style={S.input}
                              autoFocus
                            />
                            <Form.Control.Feedback type="invalid">
                              El nombre es obligatorio.
                            </Form.Control.Feedback>
                          </Form.Group>

                          <Form.Group className="mb-3" controlId="productDesc">
                            <Form.Label style={S.label}>Descripción</Form.Label>
                            <Form.Control
                              className="onb-input"
                              type="text"
                              placeholder="Descripción breve (opcional)"
                              value={productDescription}
                              onChange={(e) => setProductDescription(e.target.value)}
                              style={S.input}
                            />
                          </Form.Group>

                          <Form.Group className="mb-3" controlId="productPrice">
                            <Form.Label style={S.label}>
                              Precio <span className="text-danger">*</span>
                            </Form.Label>
                            <div style={{ position: 'relative' }}>
                              <span style={S.currencyPrefix}>$</span>
                              <Form.Control
                                required
                                className="onb-input"
                                type="number"
                                min="1"
                                step="100"
                                placeholder="5000"
                                value={productPrice}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === '' || parseFloat(v) >= 0) setProductPrice(v);
                                }}
                                style={{ ...S.input, paddingLeft: 28 }}
                              />
                              <Form.Control.Feedback type="invalid">
                                El precio es obligatorio y debe ser mayor a $0.
                              </Form.Control.Feedback>
                            </div>
                          </Form.Group>
                        </>
                      )}

                      <StepActions
                        saving={saving}
                        onBack={() => goToStep(2)}
                        submitLabel={productCreated ? undefined : 'Crear producto →'}
                        onContinue={productCreated ? () => goToStep(4) : undefined}
                      />
                    </Form>
                  )}

                  {/* ═══ STEP 4: DIAN ═══ */}
                  {currentStep === 4 && (
                    <Form noValidate validated={validated} onSubmit={handleConfigureDian}>
                      <StepHeader
                        icon={<Receipt />}
                        title="Facturación Electrónica DIAN"
                        desc="Conecta tu cuenta de Alegra para emitir facturas electrónicas válidas ante la DIAN."
                      />
                      <Badge bg="secondary" text="light" className="mb-3">
                        Opcional · puedes configurarlo después
                      </Badge>

                      {dianConfigured ? (
                        <CompletedAlert text="Facturación electrónica configurada." />
                      ) : (
                        <>
                          <Alert variant="light" style={S.helpAlert}>
                            <small>
                              <strong>¿Cómo obtener las credenciales?</strong>
                              <ol className="mb-0 mt-2" style={{ paddingLeft: 18 }}>
                                <li>Crea una cuenta en{' '}
                                  <a href="https://app.alegra.com/register" target="_blank" rel="noreferrer">
                                    alegra.com
                                  </a>
                                </li>
                                <li>Habilita la facturación electrónica</li>
                                <li>Ve a <strong>Configuración → Integraciones → API</strong></li>
                                <li>Copia tu email y token aquí</li>
                              </ol>
                            </small>
                          </Alert>

                          <Form.Group className="mb-3" controlId="alegraEmail">
                            <Form.Label style={S.label}>Email de Alegra</Form.Label>
                            <Form.Control
                              className="onb-input"
                              type="email"
                              placeholder="tu@empresa.com"
                              value={alegraEmail}
                              onChange={(e) => setAlegraEmail(e.target.value)}
                              style={S.input}
                              autoFocus
                            />
                          </Form.Group>

                          <Form.Group className="mb-3" controlId="alegraToken">
                            <Form.Label style={S.label}>Token API</Form.Label>
                            <Form.Control
                              className="onb-input"
                              type="password"
                              placeholder="Token de la API de Alegra"
                              value={alegraToken}
                              onChange={(e) => setAlegraToken(e.target.value)}
                              style={S.input}
                            />
                          </Form.Group>
                        </>
                      )}

                      <StepActions
                        saving={saving}
                        onBack={() => goToStep(3)}
                        submitLabel={dianConfigured ? undefined : 'Conectar →'}
                        onContinue={dianConfigured ? () => goToStep(5) : undefined}
                        onSkip={!dianConfigured ? () => goToStep(5) : undefined}
                      />
                    </Form>
                  )}

                  {/* ═══ STEP 5: Done ═══ */}
                  {currentStep === 5 && (
                    <div className="text-center">
                      <div className="onb-celebrate" style={{ fontSize: 72, marginBottom: 12 }}>
                        <TrophyFill size={72} color="#f5a623" />
                      </div>
                      <h3 style={{ ...S.stepTitle, fontSize: '1.5rem' }}>
                        ¡Tu comercio está listo!
                      </h3>
                      <p style={{ ...S.stepDesc, marginBottom: 24 }}>
                        Ya puedes empezar a facturar con Prizma POS.
                      </p>

                      <div style={S.summaryBox}>
                        {[
                          { icon: <Building />, label: 'Empresa', done: !!companyName, text: companyName || 'Pendiente' },
                          { icon: <CashCoin />, label: 'Caja', done: cashBoxCreated, text: cashBoxCreated ? 'Creada' : 'Pendiente' },
                          { icon: <BoxSeam />, label: 'Producto', done: productCreated, text: productCreated ? 'Creado' : 'Pendiente' },
                          { icon: <Receipt />, label: 'DIAN', done: dianConfigured, text: dianConfigured ? 'Conectado' : 'No configurado' },
                        ].map((item) => (
                          <div key={item.label} style={S.summaryRow}>
                            <span>{item.icon} {item.label}</span>
                            <Badge bg={item.done ? 'success' : item.label === 'DIAN' ? 'secondary' : 'warning'}>
                              {item.text}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={onComplete}
                        className="onb-btn-primary mt-4"
                        style={{ ...S.btnPrimary, fontSize: '1.05rem', padding: '12px 40px' }}
                      >
                        <RocketTakeoffFill className="me-2" /> Empezar a vender
                      </Button>
                      <p className="mt-3" style={{ color: '#999', fontSize: 13 }}>
                        Puedes cambiar todo esto desde <strong>Configuraciones</strong>.
                      </p>
                    </div>
                  )}

                </div>
              </Card.Body>
            </Card>

            <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              Prizma POS · Configuración inicial
            </p>

          </Col>
        </Row>
      </Container>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
   Sub-components (keep file self-contained)
   ────────────────────────────────────────────────────────── */

const StepHeader: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="mb-4">
    <h4 style={S.stepTitle}>{icon} {title}</h4>
    <p style={S.stepDesc}>{desc}</p>
  </div>
);

const CompletedAlert: React.FC<{ text: string }> = ({ text }) => (
  <Alert variant="success" className="d-flex align-items-center gap-2">
    <CheckCircleFill size={20} className="text-success" />
    <div>
      <strong>{text}</strong>
      <br />
      <small className="text-muted">Puedes continuar al siguiente paso.</small>
    </div>
  </Alert>
);

interface StepActionsProps {
  saving?: boolean;
  onBack?: () => void;
  submitLabel?: string;
  onContinue?: () => void;
  onSkip?: () => void;
}

const StepActions: React.FC<StepActionsProps> = ({ saving, onBack, submitLabel, onContinue, onSkip }) => (
  <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={S.actions}>
    {onBack ? (
      <Button variant="link" onClick={onBack} style={S.btnBack}>
        <ArrowLeft className="me-1" /> Atrás
      </Button>
    ) : <span />}
    <div className="d-flex gap-2">
      {onSkip && (
        <Button variant="outline-secondary" onClick={onSkip} style={S.btnSkip}>
          Omitir
        </Button>
      )}
      {onContinue ? (
        <Button onClick={onContinue} className="onb-btn-primary" style={S.btnPrimary}>
          Continuar <ArrowRight className="ms-1" />
        </Button>
      ) : submitLabel ? (
        <Button type="submit" disabled={saving} className="onb-btn-primary" style={S.btnPrimary}>
          {saving ? <Spinner size="sm" className="me-2" /> : null}
          {submitLabel}
        </Button>
      ) : null}
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────
   CSS Animations (injected via <style>)
   ────────────────────────────────────────────────────────── */

const ANIMATIONS_CSS = `
  .onb-fade-in { opacity: 1; transform: translateY(0); transition: all .25s ease; }
  .onb-fade-out { opacity: 0; transform: translateY(8px); transition: all .15s ease; }
  .onb-step-dot { transition: all .3s ease; cursor: default; }
  .onb-step-dot.clickable { cursor: pointer; }
  .onb-step-dot.clickable:hover { transform: scale(1.12); }
  .onb-card { transition: box-shadow .3s ease; }
  .onb-input:focus { border-color: #f5a623 !important; box-shadow: 0 0 0 .2rem rgba(245,166,35,.2) !important; }
  .onb-btn-primary { transition: all .15s ease; }
  .onb-btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .onb-btn-primary:active { transform: translateY(0); }
  @keyframes onb-celebrate { 0%{transform:scale(.5);opacity:0} 50%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
  .onb-celebrate { animation: onb-celebrate .5s ease forwards; }
`;

/* ──────────────────────────────────────────────────────────
   Styles
   ────────────────────────────────────────────────────────── */

const S: Record<string, React.CSSProperties> = {
  fullPage: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1f36 0%, #0f2044 50%, #1e3a5f 100%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px 32px',
    overflowY: 'auto',
  },
  title: {
    color: '#fff',
    fontWeight: 800,
    fontSize: '1.6rem',
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: '50%',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
  },
  stepLabel: {
    fontSize: 11,
    marginTop: 4,
    whiteSpace: 'nowrap' as const,
  },
  card: {
    borderRadius: 16,
    border: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    background: '#fff',
    overflow: 'hidden',
  },
  cardBody: {
    padding: '28px 32px',
  },
  stepTitle: {
    fontWeight: 700,
    color: '#1a1f36',
    fontSize: '1.15rem',
    marginBottom: 6,
  },
  stepDesc: {
    color: '#666',
    fontSize: 14,
    marginBottom: 0,
    lineHeight: 1.5,
  },
  label: {
    fontWeight: 600,
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    border: '1.5px solid #e0e0e0',
    padding: '9px 14px',
    fontSize: 14,
    transition: 'border-color .2s, box-shadow .2s',
  },
  currencyPrefix: {
    position: 'absolute' as const,
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#888',
    fontSize: 14,
    fontWeight: 600,
    zIndex: 2,
    pointerEvents: 'none' as const,
  },
  actions: {
    borderTop: '1px solid #f0f0f0',
  },
  btnPrimary: {
    backgroundColor: '#f5a623',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    color: '#1a1f36',
    padding: '10px 24px',
    fontSize: 14,
  },
  btnBack: {
    color: '#888',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
    padding: '10px 16px',
  },
  btnSkip: {
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    padding: '10px 20px',
  },
  helpAlert: {
    borderLeft: '4px solid #f5a623',
    borderRadius: 8,
    background: '#fffcf5',
  },
  summaryBox: {
    maxWidth: 320,
    margin: '0 auto',
    textAlign: 'left' as const,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
  },
};

export default OnboardingWizard;
