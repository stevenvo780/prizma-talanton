import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import Select, { MultiValue, ActionMeta } from 'react-select';
import api from '../../utils/axios';
import { Product, ProductPriceType, SelectInterface, Discounts, Taxes, Operators, User } from '../../utils/types';

interface SelectOptionWithExtra extends SelectInterface {
  discountValue?: number;
  taxValue?: number;
}

interface ProductModalProps {
  showModal: boolean;
  handleCloseModal: () => void;
  handleSubmit: (event: React.FormEvent) => void;
  selectedProduct: Product | null;
  name: string;
  setName: (name: string) => void;
  sortName: string;
  setSortName: (sortName: string) => void;
  selectedCategories: SelectInterface[];
  handleCategoriesChange: (newValue: MultiValue<SelectInterface>, actionMeta: ActionMeta<SelectInterface>) => void;
  selectCategories: SelectInterface[];
  state: boolean;
  setState: (updater: ((prevState: boolean) => boolean) | boolean) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  image: string | null;
  description: string;
  handleDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setPriceTypes: (updater: ((prevTypes: ProductPriceType[]) => ProductPriceType[]) | ProductPriceType[]) => void;
  priceTypes: ProductPriceType[];
}

const ProductModal: React.FC<ProductModalProps> = ({
  showModal,
  handleCloseModal,
  handleSubmit,
  selectedProduct,
  name,
  setName,
  sortName,
  setSortName,
  selectedCategories,
  handleCategoriesChange,
  selectCategories,
  state,
  setState,
  handleImageChange,
  image,
  description,
  handleDescriptionChange,
  setPriceTypes,
  priceTypes
}) => {
  const [categoryPricingsSelect, setCategoryPricingsSelect] = useState<SelectInterface[]>([]);
  const [discountsSelect, setDiscountsSelect] = useState<SelectInterface[]>([]);
  const [taxesSelect, setTaxesSelect] = useState<SelectInterface[]>([]);


  interface CategoryPricingResponse {
    id: number;
    name: string;
  }

  interface DiscountResponse {
    id: number;
    name: string;
    value: number;
  }

  interface TaxResponse {
    id: number;
    name: string;
    value: number;
  }

  const fetchCategoryPricings = async () => {
    const { data } = await api.get<CategoryPricingResponse[]>('/category-pricing');
    const options = data.map((item) => ({ value: item.id, label: item.name }));
    setCategoryPricingsSelect(options);
  };

  const fetchDiscounts = async () => {
    const response = await api.get<DiscountResponse[]>('/discounts');
    const options: SelectOptionWithExtra[] = response.data.map((item) => ({ value: item.id, label: item.name, discountValue: item.value }));
    setDiscountsSelect(options);
  };

  const fetchTaxes = async () => {
    const response = await api.get<TaxResponse[]>('/taxes');
    const options: SelectOptionWithExtra[] = response.data.map((item) => ({ value: item.id, label: item.name, taxValue: item.value }));
    setTaxesSelect(options);
  };

  interface SelectOptionObject {
    value: number | string;
    label: string;
    discountValue?: number;
    taxValue?: number;
  }

  const handlePriceTypeChange = (
    index: number,
    field: keyof ProductPriceType,
    value: SelectOptionObject[] | SelectOptionObject | number | string | null | undefined | any
  ) => {
    const newPriceTypes = [...priceTypes];
    if (!newPriceTypes[index]) return;

    if (Array.isArray(value)) {
      if (field === 'discounts') {
        newPriceTypes[index][field] = value
          .map((item) => {
            const found = discountsSelect.find((discount) => discount.value === item.value);
            return found
              ? {
                  id: Number(found.value),
                  name: found.label,
                  value: 'discountValue' in item ? item.discountValue! : 0,
                  operator: Operators.Percentage,
                  user: {} as User,
                }
              : undefined;
          })
          .filter((item): item is Discounts => item !== undefined);
      } else if (field === 'taxes') {
        newPriceTypes[index][field] = value
          .map((item) => {
            const found = taxesSelect.find((tax) => tax.value === item.value);
            return found
              ? {
                  id: Number(found.value),
                  name: found.label,
                  value: 'taxValue' in item ? item.taxValue! : 0,
                  operator: Operators.Percentage,
                  user: {} as User,
                }
              : undefined;
          })
          .filter((item): item is Taxes => item !== undefined);
      }
    } else if (value && typeof value === 'object' && 'value' in value && 'label' in value) {
      if (field === 'category') {
        const selectedCategory = categoryPricingsSelect.find((cat) => cat.value === value.value);
        if (selectedCategory) {
          newPriceTypes[index][field] = { id: Number(selectedCategory.value), name: selectedCategory.label } as any;
        }
      }
    } else if (typeof value === 'number' && field === 'price') {
      newPriceTypes[index][field] = value as any;
    } else if (typeof value === 'string' && field === 'sku') {
      newPriceTypes[index][field] = value as any;
    }

    setPriceTypes(newPriceTypes);
  };

  const removePriceType = (id: number) => {
    setPriceTypes(priceTypes.filter(priceType => priceType.category?.id === id));
  };

  const addPriceType = () => {
    const nextCategory = categoryPricingsSelect.find(
      category => !priceTypes.some(priceType => priceType.category?.id === Number(category.value))
    );
    if (nextCategory) {
      setPriceTypes([...priceTypes, {
        category: { id: Number(nextCategory.value), name: nextCategory.label },
        price: 0,
        sku: '',
        taxes: [],
        discounts: []
      } as ProductPriceType]);
    }
  }

  useEffect(() => {
    fetchCategoryPricings();
    fetchDiscounts();
    fetchTaxes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showModal && priceTypes.length === 0) {
      addPriceType();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  return (
    <Modal show={showModal} onHide={handleCloseModal} size="lg">
      <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
        <Modal.Title>{selectedProduct ? 'Actualizar' : 'Crear'} Producto</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
        <Form>
          <Row>
            <Col sm={6} style={{ marginBottom: "10px" }}>
              <Form.Group>
                <Form.Control placeholder='Nombre del producto' type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </Form.Group>
              <br />
              <Form.Group>
                <Form.Control placeholder='Nombre corto del producto' type="text" value={sortName} onChange={(e) => setSortName(e.target.value)} />
              </Form.Group>
              <br />
              <Form.Group>
                <Select
                  isMulti
                  placeholder="Categorias"
                  value={selectedCategories}
                  onChange={handleCategoriesChange}
                  options={selectCategories}
                />
              </Form.Group>
              <br />
              <Form.Group>
                <Form.Label>Descripción del producto</Form.Label>
                <Form.Control as="textarea" rows={3} value={description} onChange={handleDescriptionChange} />
              </Form.Group>
            </Col>
            <Col sm={6}>
              <Form.Group>
                <Form.Check
                  type='checkbox'
                  id='adjust-balance'
                  label='Habilitado'
                  checked={state}
                  onChange={() => setState((prevstate: boolean) => !prevstate)}
                />
              </Form.Group>
              <br />
              <Form.Group>
                <Form.Label>Imagen del producto</Form.Label>
                <div className="image-upload">
                  <label htmlFor="productImage">
                    {image ? (
                      <img src={image} alt="Upload" width="60%" style={{ height: 'auto' }} />
                    ) : (
                      <img src={"https://firebasestorage.googleapis.com/v0/b/emergent-enterprises.appspot.com/o/assets%2F_2c3d3f0e-50c4-481a-bf84-a87ee87b751e.jpeg?alt=media&token=99c8a1f5-e60c-44fc-a6ea-28675f0ed942"} alt="Upload" width="60%" style={{ height: 'auto' }} />
                    )}
                  </label>
                  <Form.Control id="productImage" type="file" hidden onChange={handleImageChange} />
                </div>
              </Form.Group>
            </Col>
            <Col sm={12}>
              <Row>
                {priceTypes.map((priceType, index) => {
                  const selectValuesPriceType = { value: priceType?.category?.id, label: priceType?.category?.name };
                  const discountsValues = priceType.discounts ? priceType.discounts.map(discount => ({
                    value: discount.id,
                    label: discount.name,
                    discountValue: discount.value
                  })) : [];
                  return (
                    <Col md={priceTypes.length <= 4 ? (12 - (priceTypes.length > 1 ? priceTypes.length * 3 : priceTypes.length - 1 * 3)) : 3} key={index}>
                      <div style={{
                        border: '1px solid rgba(128, 128, 128, 0.2)',
                        borderRadius: '25px',
                      }}>
                        <div style={{
                          margin: '10px',
                        }}>
                          <Form.Control
                            type="number"
                            placeholder="Precio"
                            value={priceType.price}
                            onChange={(e) => handlePriceTypeChange(index, 'price', parseFloat(e.target.value))}
                          />
                          <br />
                          <Form.Control
                            type="text"
                            placeholder="SKU"
                            value={priceType.sku}
                            onChange={(e) => handlePriceTypeChange(index, 'sku', e.target.value)}
                          />
                          <br />
                          <Form.Group>
                            <Select
                              placeholder="Categorías de Precios"
                              value={selectValuesPriceType}
                              onChange={(selected) => {
                                handlePriceTypeChange(index, 'category', selected);
                              }}
                              options={categoryPricingsSelect as any}
                            />
                          </Form.Group>
                          <br />
                          <Form.Group>
                            <Select
                              isMulti
                              placeholder="Descuentos"
                              value={discountsValues}
                              onChange={(selected) => handlePriceTypeChange(index, 'discounts', selected)}
                              options={discountsSelect as any}
                            />
                          </Form.Group>
                          <br />
                          <Form.Group>
                            <Select
                              isMulti
                              placeholder="Impuestos"
                              value={priceType.taxes ? priceType.taxes.map(taxes => ({
                                value: taxes.id,
                                label: taxes.name
                              })) : []}
                              onChange={(selected) => handlePriceTypeChange(index, 'taxes', selected)}
                              options={taxesSelect as any}
                            />
                          </Form.Group>
                          <Button variant="outline-danger" onClick={() => removePriceType(priceType.category?.id || 0)} style={{ margin: '5px' }}>Eliminar precio</Button>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Col>
          </Row>
          <br />
          <Button variant="outline-primary" onClick={addPriceType}>Agregar precio</Button>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSubmit} variant="outline-success" type="submit">
          {selectedProduct ? 'Actualizar' : 'Crear'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductModal;
