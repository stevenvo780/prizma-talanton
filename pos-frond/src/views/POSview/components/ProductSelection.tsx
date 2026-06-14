import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { Product, Category, CategoryPricing } from '../../../utils/types';
import { fmtCOP } from '../../../utils/format';
import Select from 'react-select';
import { Plus } from 'react-bootstrap-icons';

interface CategoryOption {
  value: string;
  label: string;
  category?: Category;
}

interface ProductOption {
  value: string;
  label: string;
  product: Product;
}

interface ProductSelectionProps {
  products: Product[];
  categories: Category[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSelectCategory: (category: Category) => void;
  handleProductClick: (product: Product) => void;
  selectPriceType: CategoryPricing | undefined;
  getProductsApi: () => void;
  onOpenCreateProduct?: () => void;
}

const ProductSelection: React.FC<ProductSelectionProps> = ({
  products,
  categories,
  searchTerm,
  setSearchTerm,
  handleSearch,
  handleKeyDown,
  handleSelectCategory,
  handleProductClick,
  selectPriceType,
  getProductsApi,
  onOpenCreateProduct
}) => {
  const allOption: CategoryOption = { value: 'all', label: 'Todas las categorías' };
  const categoryOptions: CategoryOption[] = [
    allOption,
    ...categories.map(category => ({
      value: category.id.toString(),
      label: category.name || '',
      category: category
    }))
  ];

  const productOptions: ProductOption[] = products.map(product => ({
    value: product.id.toString(),
    label: product.name || '',
    product: product
  }));

  const handleCategoryChange = (selectedOption: CategoryOption | null) => {
    if (!selectedOption) return;
    if (selectedOption.value === 'all') {
      getProductsApi();
    } else if (selectedOption.category) {
      handleSelectCategory(selectedOption.category);
    }
  };

  const handleProductSearch = (selectedOption: ProductOption | null) => {
    if (selectedOption) {
      handleProductClick(selectedOption.product);
    }
  };

  return (
    <>
      <Row className="mb-3">
        <Col md={5}>
          <Select<CategoryOption>
            placeholder="Categorías"
            options={categoryOptions}
            onChange={handleCategoryChange}
            defaultValue={allOption}
            classNamePrefix="react-select"
            styles={{ container: base => ({ ...base, flex: 1 }) }}
          />
        </Col>
        <Col md={5}>
          <Select<ProductOption>
            placeholder="Buscar producto..."
            options={productOptions}
            onChange={handleProductSearch}
            onInputChange={setSearchTerm}
            inputValue={searchTerm}
            classNamePrefix="react-select"
            isSearchable
            isClearable
            styles={{ container: base => ({ ...base, flex: 1 }) }}
            filterOption={(option, inputValue) =>
              option.label.toLowerCase().includes(inputValue.toLowerCase())
            }
          />
        </Col>
        <Col md={2}>
          {onOpenCreateProduct && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={onOpenCreateProduct}
              className="w-100"
              title="Crear nuevo producto"
            >
              <Plus size={16} /> Crear
            </Button>
          )}
        </Col>
      </Row>
      <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
        <Row>
          {products.map((product, i) => {
            let displayPrice = 'N/A';
            let priceCategoryName = '';
            if (selectPriceType) {
              const pt = product.priceTypes.find(p => p.category?.id === selectPriceType.id);
              if (pt && pt.price !== undefined) {
                displayPrice = fmtCOP(pt.price);
                priceCategoryName = pt.category?.name || '';
              } else {
                 displayPrice = 'No Disp.';
              }
            } else if (product.priceTypes.length > 0 && product.priceTypes[0].price !== undefined) {
              displayPrice = fmtCOP(product.priceTypes[0].price);
              priceCategoryName = product.priceTypes[0].category?.name || '';
            }

            return (
              <Col xs={6} sm={4} md={4} lg={3} key={i} className="mb-3">
                <Card
                  onClick={() => handleProductClick(product)}
                  style={{ cursor: 'pointer', height: '100%', opacity: !product.state ? 0.5 : 1 }}
                  className="product-card"
                >
                  <Card.Img variant="top" src={product.image || 'https://via.placeholder.com/150'} alt={product.name} style={{ height: '130px', objectFit: 'cover' }} />
                  <Card.Body style={{ padding: '0.5rem' }}>
                    <Card.Title style={{ fontSize: '0.9rem', marginBottom: '0.2rem', height: '2.7rem', overflow: 'hidden' }}>{product.name}</Card.Title>
                    <Card.Text style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                       {selectPriceType ? `${priceCategoryName}: $${displayPrice}` : `$${displayPrice}`}
                       {!selectPriceType && product.priceTypes.length > 1 && (
                         <span style={{ fontSize: '0.7rem', display: 'block' }}> (y otros)</span>
                       )}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </>
  );
};

export default ProductSelection;
