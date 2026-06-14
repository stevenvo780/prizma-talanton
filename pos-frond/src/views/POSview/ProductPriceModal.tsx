import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { Product, ProductPriceType } from '../../utils/types';
import { fmtCOP } from '../../utils/format';

interface ProductPriceModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  selectedProductModal: Product | null;
  handleSelectPrice: (price: ProductPriceType) => void;
}

const ProductPriceModal: React.FC<ProductPriceModalProps> = ({ showModal, setShowModal, selectedProductModal, handleSelectPrice }) => {
  return (
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Seleccione el tipo de precio para {selectedProductModal?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {selectedProductModal?.priceTypes.map((price, i) => (
          <Button
            variant='outline-primary'
            style={{ margin: 10 }}
            key={i}
            onClick={() => handleSelectPrice(price)}
          >
            <div>
              <div><strong>{price.category?.name}</strong></div>
              <div>{fmtCOP(price.price ?? 0)}</div>
              {price.sku && <div className="text-muted small">SKU: {price.sku}</div>}
            </div>
          </Button>
        ))}
        {selectedProductModal?.priceTypes.length === 0 && (
          <p className="text-muted">Este producto no tiene precios definidos.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductPriceModal;
