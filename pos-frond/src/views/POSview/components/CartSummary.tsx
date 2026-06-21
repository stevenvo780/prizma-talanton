import React, { useState } from 'react';
import { Row, Col, Button, Form, Modal } from 'react-bootstrap';
import { Client, Product, ProductPriceType, CategoryPricing } from '../../../utils/types';
import { CartX, Trash, InfoCircle, ArrowRight, ArrowLeft, PencilFill } from 'react-bootstrap-icons';
import { fmtCOP as fmt } from '../../../utils/format';

interface SummaryItem {
  product: Product;
  productQuantity: number;
  productBasePrice: number;
  productPriceTax: number;
  productPriceDiscount: number;
  productSubtotal: number;
  totalTax: number;
  totalDiscount: number;
}

interface CartSummaryProps {
  client: Client | undefined;
  selectedProducts: { product: Product; selectPriceType: ProductPriceType }[];
  quantities: { [key: string]: number };
  summaryPerProduct: SummaryItem[];
  totals: { totalAmountBeforeTax: number; withholdingTaxAmount: number; ivaAmount: number; totalAmount: number };
  priceTypes: CategoryPricing[];
  selectPriceType: CategoryPricing | undefined;
  handleSelectPriceType: (priceType: CategoryPricing | undefined) => void;
  handleQuantityChange: (productKey: string, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleRemoveProduct: (productToRemove: Product, priceTypeIdToRemove: number | undefined) => void;
  clearCart: () => void;
  onEditClient?: () => void;
  onNext: () => void;
  isStepByStep: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  client,
  selectedProducts,
  quantities,
  summaryPerProduct,
  totals,
  priceTypes,
  selectPriceType,
  handleSelectPriceType,
  handleQuantityChange,
  handleRemoveProduct,
  clearCart,
  onEditClient,
  onNext,
  isStepByStep,
}) => {
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [currentSummaryItem, setCurrentSummaryItem] = useState<SummaryItem | null>(null);

  const handleShowDiscount = (item: SummaryItem) => {
    setCurrentSummaryItem(item);
    setShowDiscountModal(true);
  };

  return (
    <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
      {/* ── Header ── */}
      <div className="p-3" style={{ borderBottom: '1px solid #e9ecef', background: '#fff', flexShrink: 0 }}>
        {/* Client row */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div style={{ minWidth: 0 }}>
            {client ? (
              <>
                <p className="fw-bold mb-0 text-truncate" style={{ fontSize: '0.9rem' }}>
                  {client.name} {client.surname || ''}
                </p>
                <small className="text-muted">{client.documentNumber}</small>
              </>
            ) : (
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>Cliente General</p>
            )}
          </div>
          {isStepByStep && onEditClient && (
            <button
              className="btn btn-light btn-sm rounded-2 p-1 ms-2 d-flex align-items-center gap-1"
              onClick={onEditClient}
              style={{ fontSize: '0.75rem', flexShrink: 0 }}
            >
              <PencilFill size={12} className="text-primary" />
              <span className="d-none d-sm-inline">Editar</span>
            </button>
          )}
        </div>
        {/* Price type + Clear */}
        <div className="d-flex gap-2 align-items-center">
          <Form.Select
            size="sm"
            value={selectPriceType?.id || ''}
            onChange={(e) => handleSelectPriceType(priceTypes.find(pt => pt.id === parseInt(e.target.value)))}
            style={{ flex: 1, fontSize: '0.82rem' }}
          >
            <option value="">Todos los precios</option>
            {priceTypes.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
          </Form.Select>
          <button
            className="btn btn-sm rounded-2 d-flex align-items-center gap-1"
            onClick={clearCart}
            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', flexShrink: 0, fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
          >
            <CartX size={14} />
            <span className="d-none d-sm-inline">Vaciar</span>
          </button>
        </div>
      </div>

      {/* ── Items list ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {selectedProducts.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <CartX size={40} className="mb-2 opacity-25" />
            <p className="mb-0" style={{ fontSize: '0.85rem' }}>Carrito vacío</p>
          </div>
        ) : (
          selectedProducts.map((selectedProduct, i) => {
            const product = selectedProduct.product;
            const priceType = selectedProduct.selectPriceType;
            const productKey = `${product.id}-${priceType.id}`;
            const quantity = quantities[productKey] || 0;
            const summaryItem = summaryPerProduct[i];
            if (!summaryItem) return null;
            return (
              <div key={productKey} className="p-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div className="d-flex align-items-start justify-content-between mb-1">
                  <div style={{ minWidth: 0 }}>
                    <p className="fw-semibold mb-0 text-truncate" style={{ fontSize: '0.875rem' }}>{product.name}</p>
                    <small className="text-muted">{priceType.category?.name} · {fmt(priceType.price || 0)}</small>
                  </div>
                  <p className="fw-bold mb-0 ms-2" style={{ fontSize: '0.9rem', color: '#6366f1', whiteSpace: 'nowrap' }}>
                    {fmt(summaryItem.productSubtotal)}
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <Form.Control
                    type="number"
                    size="sm"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(productKey, e)}
                    style={{ width: 60, fontSize: '0.82rem' }}
                  />
                  {summaryItem.totalDiscount > 0 && (
                    <small className="text-success">-{fmt(summaryItem.totalDiscount)}</small>
                  )}
                  <div className="ms-auto d-flex gap-1">
                    <button
                      className="btn btn-light btn-sm rounded-2 p-1"
                      onClick={() => handleShowDiscount(summaryItem)}
                      title="Ver descuentos"
                      style={{ lineHeight: 1 }}
                    >
                      <InfoCircle size={13} className="text-primary" />
                    </button>
                    <button
                      className="btn btn-light btn-sm rounded-2 p-1"
                      onClick={() => handleRemoveProduct(product, priceType.id)}
                      title="Eliminar"
                      style={{ lineHeight: 1 }}
                    >
                      <Trash size={13} className="text-danger" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Totals + CTA ── */}
      <div className="p-3" style={{ borderTop: '1px solid #e9ecef', background: '#fafafa', flexShrink: 0 }}>
        <div className="mb-2">
          {[
            { label: 'Subtotal', value: totals.totalAmountBeforeTax },
            { label: 'Descuento', value: -totals.withholdingTaxAmount, color: '#10b981' },
            { label: 'Impuestos', value: totals.ivaAmount },
          ].map(({ label, value, color }) => (
            <div key={label} className="d-flex justify-content-between" style={{ fontSize: '0.82rem', marginBottom: 3 }}>
              <span className="text-muted">{label}</span>
              <span style={{ color: color || '#374151' }}>{fmt(value)}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between fw-bold mt-2 pt-2" style={{ borderTop: '2px solid #e9ecef', fontSize: '1.05rem' }}>
            <span>Total</span>
            <span style={{ color: '#6366f1' }}>{fmt(totals.totalAmount)}</span>
          </div>
        </div>

        {isStepByStep ? (
          <div className="d-flex gap-2">
            <Button
              variant="light"
              size="sm"
              onClick={onEditClient}
              className="d-flex align-items-center gap-1 flex-fill justify-content-center"
              style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
            >
              <ArrowLeft size={14} /> Atrás
            </Button>
            <Button
              size="sm"
              onClick={onNext}
              disabled={selectedProducts.length === 0}
              className="d-flex align-items-center gap-1 flex-fill justify-content-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px', fontWeight: 600 }}
            >
              Continuar <ArrowRight size={14} />
            </Button>
          </div>
        ) : (
          <Button
            onClick={onNext}
            disabled={selectedProducts.length === 0}
            className="w-100 d-flex align-items-center justify-content-center gap-2"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '10px', fontWeight: 600, padding: '0.6rem' }}
          >
            <ArrowRight size={16} /> Generar Factura
          </Button>
        )}
      </div>

      {/* Discount Modal */}
      <Modal show={showDiscountModal} onHide={() => setShowDiscountModal(false)} centered size="sm">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #e9ecef' }}>
          <Modal.Title style={{ fontSize: '1rem' }}>Detalle de descuentos</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {currentSummaryItem && (
            <div className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between">
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Producto</span>
                <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{currentSummaryItem.product.name}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Cantidad</span>
                <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{currentSummaryItem.productQuantity}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Desc. por unidad</span>
                <span className="fw-semibold text-success" style={{ fontSize: '0.85rem' }}>-{fmt(currentSummaryItem.productPriceDiscount)}</span>
              </div>
              <div className="d-flex justify-content-between pt-2" style={{ borderTop: '1px solid #e9ecef' }}>
                <span className="fw-bold">Total descuento</span>
                <span className="fw-bold text-success">-{fmt(currentSummaryItem.totalDiscount)}</span>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default CartSummary;
