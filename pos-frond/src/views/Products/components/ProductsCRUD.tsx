import React, { useState, useEffect } from 'react';
import { Button, Table, Pagination, Container } from 'react-bootstrap';
import api from '../../../utils/axios';
import { Product, ProductPriceType, Category, SelectInterface } from '../../../utils/types';
import { storage } from "../../../utils/firebase";
import { loading, addNotification } from '../../../redux/ui';
import { useDispatch } from 'react-redux';
import ProductModal from '../ProductModal';

const ProductsCRUD: React.FC = () => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [state, setState] = useState(true);
  const [name, setName] = useState('');
  const [sortName, setSortName] = useState('');
  const [priceTypes, setPriceTypes] = useState<ProductPriceType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<SelectInterface[]>([]);
  const [selectCategories, setSelectCategories] = useState<SelectInterface[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(5);
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const response = await api.get('/product');
    setProducts(response.data);
  };

  const fetchCategories = async () => {
    let data: Category[] = [];
    const response = await api.get('/category');
    data = response.data;
    const categoriesSelect: SelectInterface[] = data.map(category => ({ value: category.id.toString(), label: category.name || '' }));
    setSelectCategories(categoriesSelect);
  };

  const handleShowModal = (product: Product | null = null) => {
    if (product) {
      const categoriesSelect: SelectInterface[] = product.categories.map(category => ({ value: category.id.toString(), label: category.name || '' }));
      setSelectedProduct(product);
      setName(product.name);
      setSortName(product.sortName);
      setDescription(product.description || '');
      setState(product.state);
      setImage(product.image || '');
      setPriceTypes(product.priceTypes);
      setSelectedCategories(categoriesSelect);
    } else {
      setName('');
      setSortName('');
      setDescription('');
      setImage(null);
      setState(true);
      setPriceTypes([]);
      setSelectedCategories([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProduct && (!name || !sortName || !selectedCategories.length || !priceTypes.length || !imageFile)) {
      dispatch(addNotification({ message: 'Debe completar todos los campos', color: 'danger' }));
      return;
    }
    dispatch(loading(true));
    try {
      let imageUrl = '';
      if (imageFile) {
        const uploadTask = storage.ref(`images/${imageFile.name}`).put(imageFile);
        await new Promise((resolve, reject) => {
          uploadTask.on("state_changed", snapshot => { }, error => reject(error), () => {
            storage.ref("images").child(imageFile.name).getDownloadURL().then(url => { imageUrl = url; resolve(url); });
          });
        });
      }
      const productData = {
        state,
        name,
        sortName,
        description,
        priceTypes,
        categories: selectedCategories.map(category => { return { id: Number(category.value) } }),
        image: imageUrl
      };
      if (selectedProduct) {
        await api.patch(`/product/${selectedProduct.id}`, productData);
      } else {
        await api.post('/product', productData);
      }
      dispatch(addNotification({ message: 'Se guardo correctamente', color: 'success' }));
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      dispatch(addNotification({ message: 'Error al guardar', color: 'danger' }));
      console.error(error);
    }
    dispatch(loading(false));
  };

  const deleteProduct = async (product: Product) => {
    try {
      await api.delete(`/product/${product.id}`);
      fetchProducts();
    } catch (error) {
      console.error(error);
      dispatch(addNotification({ message: 'Error al eliminar', color: 'danger' }));
    }
  };

  const handleCategoriesChange = (selectedOptions: any) => {
    setSelectedCategories(selectedOptions);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(URL.createObjectURL(e.target.files[0]));
      setImageFile(e.target.files[0]);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  let active = currentPage;
  let items = [];
  for (let number = 1; number <= Math.ceil(products.length / productsPerPage); number++) {
    items.push(
      <Pagination.Item key={number} active={number === active} onClick={() => paginate(number)}>
        {number}
      </Pagination.Item>,
    );
  }

  return (
    <Container fluid>
      <Button variant="outline-primary" onClick={() => handleShowModal()} style={{ margin: '10px' }} data-tour="products-add-btn">Crear nuevo producto</Button>
      <Table bordered>
        <thead>
          <tr>
            <th>#</th>
            <th>Estado</th>
            <th>Nombre del producto</th>
            <th>Precios</th>
            <th>Categorías</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentProducts.map((product: Product, index: number) => (
            <tr key={product.id}>
              <td>{index + 1}</td>
              <td>{product.state ? 'Habilitado' : 'Deshabilitado'}</td>
              <td>{product.name}</td>
              <td>{product.priceTypes.map(priceType => `${priceType.category?.name}: ${priceType.price}`).join(', ')}</td>
              <td>{product.categories.map(category => category.name).join(', ')}</td>
              <td>
                <Button variant="outline-info" onClick={() => handleShowModal(product)} style={{ margin: '5px' }}>Editar</Button>
                <Button variant="outline-danger" onClick={() => deleteProduct(product)} style={{ margin: '5px' }}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination style={{ margin: '10px' }}>{items}</Pagination>
      <ProductModal
        showModal={showModal}
        handleCloseModal={handleCloseModal}
        handleSubmit={handleSubmit}
        selectedProduct={selectedProduct}
        name={name}
        setName={setName}
        sortName={sortName}
        setSortName={setSortName}
        selectedCategories={selectedCategories}
        handleCategoriesChange={handleCategoriesChange}
        selectCategories={selectCategories}
        state={state}
        setState={setState}
        handleImageChange={handleImageChange}
        image={image}
        description={description}
        handleDescriptionChange={handleDescriptionChange}
        setPriceTypes={setPriceTypes}
        priceTypes={priceTypes}
      />
    </Container>
  );
};

export default ProductsCRUD;
