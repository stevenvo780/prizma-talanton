/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { MultiValue, ActionMeta } from 'react-select';
import Stepper from './components/Stepper';
import api from '../../utils/axios';
import { storage } from '../../utils/firebase';
import { Product, Category, Client, Discounts, Taxes, CategoryPricing, ProductPriceType, PaymentType, PaymentStatus, SelectInterface } from '../../utils/types';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { getProducts } from '../../redux/products';
import { emitDianInvoice } from '../../services/dianService';
import { getCategories } from '../../redux/category';
import { setConfig, addNotification, setCashBox, getCashBox, loading } from '../../redux/ui';
import ClientModal from './ClientModal';
import CashBoxModal from './CashBoxModal';
import ProductPriceModal from './ProductPriceModal';
import ProductModal from '../Products/ProductModal';
import ClientStep from './components/ClientStep';
import ProductSelection from './components/ProductSelection';
import CartSummary from './components/CartSummary';
import PaymentStep from './components/PaymentStep';
import Receipt from './components/Receipt';
import { useLocation } from 'react-router-dom';

const POS_VIEW_MODE_KEY = 'posViewMode';
const POS_STEP_SNAPSHOTS_KEY = 'posStepSnapshots';

const POSView: React.FC = () => {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.auth.userData?.profile);

  const raw = localStorage.getItem(POS_VIEW_MODE_KEY);
  const preferredViewMode = raw === 'direct' ? 'direct' : 'step-by-step';

  const [selectedProducts, setSelectedProducts] = useState<{ product: Product; selectPriceType: ProductPriceType }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCashBoxModal, setShowCashBoxModal] = useState(false);
  const [cashBoxAction, setCashBoxAction] = useState('');
  const [cashBoxAmount, setCashBoxAmount] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [taxes, setTaxes] = useState<Taxes[]>([]);
  const categories = useSelector((state: RootState) => state.category.categories);
  const cashBoxes = useSelector((state: RootState) => state.ui.cashBoxes);
  const selectedCashBox = useSelector((state: RootState) => state.ui.cashBox);
  const productsFromState: Product[] = useSelector((state: RootState) => state.products.products);
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});
  const [discounts, setDiscounts] = useState<Discounts[]>([]);
  const [selectPriceType, setSelectPriceType] = useState<CategoryPricing>();
  const [priceTypes, setPriceTypes] = useState<CategoryPricing[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.CashOnDelivery);
  const [paymentStatus, setPaymentStatus] = useState(PaymentStatus.Unpaid);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Efectivo');
  const [invoiceType, setInvoiceType] = useState<string>('');
  const [showProductPriceModal, setShowProductPriceModal] = useState(false);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  
  // Estados para el modal de creación de productos
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productSortName, setProductSortName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productState, setProductState] = useState(true);
  const [productPriceTypes, setProductPriceTypes] = useState<ProductPriceType[]>([]);
  const [selectedProductCategories, setSelectedProductCategories] = useState<SelectInterface[]>([]);
  const [selectProductCategories, setSelectProductCategories] = useState<SelectInterface[]>([]);
  
  const location = useLocation();

  const [stepSnapshots, setStepSnapshots] = useState<{
    1: { client: Client | undefined };
    2: {
      selectedProducts: { product: Product; selectPriceType: ProductPriceType }[];
      quantities: { [productId: string]: number };
      selectPriceType: CategoryPricing | undefined;
    };
    3: {
      paymentType: PaymentType;
      paymentStatus: PaymentStatus;
      selectedPaymentMethod: string;
      invoiceType: string;
    };
  }>(() => {
    const defaultSnapshots = {
      1: { client: undefined },
      2: { selectedProducts: [], quantities: {}, selectPriceType: undefined },
      3: { paymentType: PaymentType.CashOnDelivery, paymentStatus: PaymentStatus.Unpaid, selectedPaymentMethod: 'Efectivo', invoiceType: '' },
    };
    const saved = localStorage.getItem(POS_STEP_SNAPSHOTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed[1] && parsed[2] && parsed[3]) {
          return parsed;
        }
        return defaultSnapshots;
      } catch {
        return defaultSnapshots;
      }
    }
    return defaultSnapshots;
  });

  useEffect(() => {
    if (preferredViewMode !== 'step-by-step') return;
    let newSnapshots = stepSnapshots;
    if (currentStep === 1) {
      newSnapshots = { ...stepSnapshots, 1: { client } };
    } else if (currentStep === 2) {
      newSnapshots = { ...stepSnapshots, 2: { selectedProducts, quantities, selectPriceType } };
    } else if (currentStep === 3) {
      newSnapshots = { ...stepSnapshots, 3: { paymentType, paymentStatus, selectedPaymentMethod, invoiceType } };
    }
    setStepSnapshots(newSnapshots);
    localStorage.setItem(POS_STEP_SNAPSHOTS_KEY, JSON.stringify(newSnapshots));
  }, [currentStep, client, selectedProducts, quantities, selectPriceType, paymentType, paymentStatus, selectedPaymentMethod, invoiceType]);

  useEffect(() => {
    if (preferredViewMode !== 'step-by-step') return;
    if (currentStep === 1) {
      setClient(stepSnapshots[1].client);
    } else if (currentStep === 2) {
      setSelectedProducts(stepSnapshots[2].selectedProducts);
      setQuantities(stepSnapshots[2].quantities);
      setSelectPriceType(stepSnapshots[2].selectPriceType);
    } else if (currentStep === 3) {
      setPaymentType(stepSnapshots[3].paymentType);
      setPaymentStatus(stepSnapshots[3].paymentStatus);
      setSelectedPaymentMethod(stepSnapshots[3].selectedPaymentMethod);
      setInvoiceType(stepSnapshots[3].invoiceType);
    }
  }, [currentStep]);


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const clientId = params.get('clientId');
    if (clientId) {
      api.get(`/client/${clientId}`)
        .then(({ data }) => {
          setClient(data);
          setCurrentStep(2);
        })
        .catch(() =>
          dispatch(addNotification({ message: 'No se pudo cargar el cliente POS', color: 'danger' }))
        );
    }
  }, [location.search]);

  const summaryPerProduct = selectedProducts.map((selectedProduct) => {
    const product = selectedProduct.product;
    const productPriceType = selectedProduct.selectPriceType!;
    const productKey = `${product.id}-${productPriceType.id}`;
    const productQuantity = quantities[productKey] || 1;
    const productDiscounts = productPriceType?.discounts || [];
    const productTaxes = productPriceType?.taxes || [];

    const totalDiscountPercent = productDiscounts.reduce((acc, disc) => acc + (discounts.find(d => d.id === disc.id)?.value || 0), 0);
    const totalTaxPercent = productTaxes.reduce((acc, tax) => acc + (taxes.find(t => t.id === tax.id)?.value || 0), 0);

    const productBasePrice = (productPriceType.price ?? 0) * productQuantity;
    const productPriceTax = productBasePrice * (totalTaxPercent / 100);
    const productPriceDiscount = productBasePrice * (totalDiscountPercent / 100);
    const productSubtotal = productBasePrice + productPriceTax - productPriceDiscount;

    return {
      product,
      productQuantity,
      productBasePrice,
      productPriceTax,
      productPriceDiscount,
      productSubtotal,
      totalTax: totalTaxPercent,
      totalDiscount: totalDiscountPercent
    };
  });

  let totalAmountBeforeTax = 0;
  let ivaAmount = 0;
  let withholdingTaxAmount = 0;
  let totalAmount = 0;

  summaryPerProduct.forEach((item) => {
    totalAmountBeforeTax += item.productBasePrice;
    ivaAmount += item.productPriceTax;
    withholdingTaxAmount += item.productPriceDiscount;
    totalAmount += item.productSubtotal;
  });

  const fetchCategoryPricings = async () => {
    try {
      const { data } = await api.get('/category-pricing');
      if (data.length > 0) setPriceTypes(data);
    } catch (error) { console.error("Error fetching category pricings:", error); }
  };

  const getProductsApi = async () => {
    try {
      const { data } = await api.get('/product');
      dispatch(getProducts(data));
    } catch (error) { console.error("Error fetching products:", error); }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/category');
      dispatch(getCategories(data));
    } catch (error) { console.error("Error fetching categories:", error); }
  };

  const fetchDiscounts = async () => {
    try {
      const { data } = await api.get('/Discounts');
      setDiscounts(data);
    } catch (error) { console.error("Error fetching discounts:", error); }
  };

  const fetchTaxes = async () => {
    try {
      const { data } = await api.get('/taxes');
      setTaxes(data);
    } catch (error) { console.error("Error fetching taxes:", error); }
  };

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/config');
      dispatch(setConfig(data));
    } catch (error) { console.error("Error fetching config:", error); }
  };

  const fetchCashBoxes = async () => {
    try {
      const { data } = await api.get('/cash-box');
      dispatch(getCashBox(data));
      if ((!selectedCashBox || !selectedCashBox.id) && data.length > 0) dispatch(setCashBox(data[0]));
    } catch (error) { console.error("Error fetching cash boxes:", error); }
  };

  const handleSelectCategory = async (category: Category) => {
    try {
      let response;
      if (category && category.id) {
        response = await api.get(`/product/search?categoryId=${category.id}`);
      } else {
        response = await api.get('/product');
      }
      dispatch(getProducts(response.data));
    } catch (error) { console.error("Error searching products by category:", error); }
  };

  const handleSelectPriceType = async (priceType: CategoryPricing | undefined) => {
    setSelectPriceType(priceType);
    setSelectedProducts([]);
    setQuantities({});
    try {
      let response;
      if (priceType && priceType.id) {
        response = await api.get(`/product/search?priceTypeId=${priceType.id}`);
      } else {
        response = await api.get('/product');
      }
      dispatch(getProducts(response.data));
    } catch (error) { console.error("Error searching products by price type:", error); }
  };

  const handleSearch = async () => {
    try {
      let response;
      if (searchTerm && searchTerm.trim() !== '') {
        response = await api.get(`/product/search?name=${searchTerm}`);
      } else {
        response = await api.get('/product');
      }
      dispatch(getProducts(response.data));
    } catch (error) { console.error("Error searching products by name:", error); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleCashBoxAction = async () => {
    if (!selectedCashBox || !selectedCashBox.id) {
      dispatch(addNotification({ message: 'Seleccione una caja válida', color: 'warning' }));
      return;
    }
    let endpoint = '';
    switch (cashBoxAction) {
      case 'cash-in': endpoint = `/cash-box/${selectedCashBox.id}/cash-in/${cashBoxAmount}`; break;
      case 'cash-out': endpoint = `/cash-box/${selectedCashBox.id}/cash-out/${cashBoxAmount}`; break;
      case 'adjust-balance': endpoint = `/cash-box/${selectedCashBox.id}/adjust-balance/${cashBoxAmount}`; break;
      default: dispatch(addNotification({ message: 'Seleccione una acción para la caja', color: 'warning' })); return;
    }
    try {
      await api.put(endpoint);
      setShowCashBoxModal(false);
      setCashBoxAmount('');
      setCashBoxAction('');
      dispatch(addNotification({ message: 'Acción de caja realizada correctamente', color: 'success' }));
      fetchCashBoxes();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      dispatch(addNotification({ message: err?.response?.data?.message || 'Error al realizar acción de caja', color: 'danger' }));
    }
  };

  const handlePrintReceipt = (data: { client: Client | undefined; items: Array<any>; totals: any; company: any; date: string }) => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;
    // Receipt expects client to be Client (not undefined), so provide default fallback
    const receiptDataForPrint = {
      ...data,
      client: data.client || { name: 'Cliente Mostrador' } as Client,
    };
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Recibo POS</title>
      <style>
        body{font-family:Arial;font-size:12px;margin:10px;}
        h2,h3{text-align:center;}
        table{width:100%;border-collapse:collapse;margin-top:10px;}
        th,td{border:1px solid#000;padding:4px;text-align:left;}
        .totales td{border:none;text-align:right;padding-right:0;}
      </style></head>
      <body>${Receipt(printWindow, receiptDataForPrint as any)}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleGenerateInvoice = async (clientData: Client | undefined) => {
    if (!selectedCashBox || !selectedCashBox.id) {
      dispatch(addNotification({ message: 'Debe seleccionar una caja válida antes de facturar.', color: 'warning' }));
      return;
    }
    if (selectedProducts.length === 0) {
      dispatch(addNotification({ message: 'Debe seleccionar al menos un producto.', color: 'warning' }));
      return;
    }
    if (!clientData) {
      dispatch(addNotification({ message: 'No se ha proporcionado información del cliente.', color: 'danger' }));
      return;
    }
    if (preferredViewMode === 'step-by-step' && (!clientData.documentNumber?.trim() && !clientData.email?.trim())) {
      dispatch(addNotification({ message: 'Debe completar documento o email del cliente.', color: 'warning' }));
      setCurrentStep(1); 
      return;
    }
    const invoiceItems = selectedProducts.map((selectedProduct, i) => {
      const product = selectedProduct.product;
      const productPriceType = selectedProduct.selectPriceType;
      const price = productPriceType?.price || 0;
      const productKey = `${product.id}-${productPriceType.id}`;
      const quantity = quantities[productKey] || 0;
      const summaryItem = summaryPerProduct[i];
      if (quantity <= 0 || price <= 0 || !summaryItem) {
        return null;
      }
      return {
        product: product.id,
        sku: productPriceType?.sku || '',
        quantity: summaryItem.productQuantity,
        price: price,
        productPriceTypeId: productPriceType?.id,
        productName: product.name,
        totalTax: summaryItem.totalTax,
        totalDiscount: summaryItem.totalDiscount
      };
    }).filter(item => item !== null);
    if (invoiceItems.length === 0) {
      dispatch(addNotification({ message: 'No hay productos válidos para facturar.', color: 'warning' }));
      return;
    }
    const invoice = {
      totalAmount,
      client: clientData.id,
      invoiceItems,
      iva: ivaAmount,
      withholdingTax: withholdingTaxAmount,
      paymentStatus,
      paymentType,
      invoiceType: invoiceType || undefined,
    };
    try {
      const response = await api.post('/invoice/' + selectedCashBox.id, invoice);
      dispatch(addNotification({ message: 'Factura creada exitosamente', color: 'success' }));
      fetchCashBoxes();

      // Emitir factura electrónica DIAN automáticamente
      if (invoiceType === 'factura_electronica' && response.data?.id) {
        try {
          const dianResult = await emitDianInvoice({ invoiceId: response.data.id });
          const docNum = dianResult.prefix ? `${dianResult.prefix}-${dianResult.documentNumber}` : dianResult.documentNumber;
          dispatch(addNotification({
            message: `✅ Factura electrónica DIAN emitida: ${docNum}`,
            color: 'success'
          }));
        } catch (dianError: any) {
          const dianMsg = dianError.response?.data?.message || 'Error al emitir FE';
          dispatch(addNotification({
            message: `⚠️ Factura POS creada pero FE DIAN falló: ${dianMsg}. Puede emitirla manualmente desde Facturas.`,
            color: 'warning'
          }));
        }
      }

      if (invoiceType === 'recibo_pos') {
        const receiptData = {
          client: clientData,
          items: summaryPerProduct,
          totals: { totalAmountBeforeTax, ivaAmount, withholdingTaxAmount, totalAmount },
          company: {
            name: userProfile?.companyName,
            nit: userProfile?.nit,
            dv: userProfile?.dv,
            legalAddress: userProfile?.legalAddress,
            taxRegime: userProfile?.taxRegime
          },
          date: new Date().toLocaleString()
        };
        handlePrintReceipt(receiptData);
      }
      setClient(undefined);
      setSelectedProducts([]);
      setQuantities({});
      setPaymentStatus(PaymentStatus.Unpaid);
      setPaymentType(PaymentType.CashOnDelivery);
      setInvoiceType('');
      setSelectedPaymentMethod('Efectivo');
      setSearchTerm('');
      setSelectPriceType(undefined);
      setCurrentStep(1);
      setStepSnapshots({
        1: { client: undefined },
        2: { selectedProducts: [], quantities: {}, selectPriceType: undefined },
        3: { paymentType: PaymentType.CashOnDelivery, paymentStatus: PaymentStatus.Unpaid, selectedPaymentMethod: 'Efectivo', invoiceType: '' },
      });
      getProductsApi();
      localStorage.removeItem(POS_STEP_SNAPSHOTS_KEY);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data || 
                          error?.message || 
                          'Error al crear la factura';
      
      if (paymentType === PaymentType.Pistis && errorMessage && 
          (typeof errorMessage === 'string' && errorMessage.includes('Créditos insuficientes'))) {
        dispatch(addNotification({ 
          message: `${errorMessage}`, 
          color: 'danger' 
        }));
      } else {
        dispatch(addNotification({ 
          message: typeof errorMessage === 'string' ? errorMessage : 'Error al crear la factura', 
          color: 'danger' 
        }));
      }
    }
  };

  const handleSaveClient = async (clientToSave: Client | undefined) => {
    if (!clientToSave) return;
    if (preferredViewMode === 'step-by-step' && (!clientToSave.documentNumber && !clientToSave.phone && !clientToSave.email)) {
      dispatch(addNotification({ message: 'Debe completar documento, teléfono o email.', color: 'warning' }));
      return;
    }
    try {
      let savedClient: Client;
      if (clientToSave.id) {
        const { data: updateResult } = await api.patch(`/client/${clientToSave.id}`, clientToSave);
        if (updateResult && (updateResult as any).affected !== undefined) {
          const { data: fetchedClient } = await api.get(`/client/${clientToSave.id}`);
          savedClient = fetchedClient;
        } else {
          savedClient = updateResult as Client;
        }
        dispatch(addNotification({ message: 'Cliente actualizado correctamente', color: 'success' }));
      } else {
        const { data: createResult } = await api.post('/client', clientToSave);
        savedClient = createResult;
        dispatch(addNotification({ message: 'Cliente creado correctamente', color: 'success' }));
      }
      setClient(savedClient);
      setShowClientModal(false);
      if (preferredViewMode === 'step-by-step') setCurrentStep(2);
    } catch (error: any) {
      const status = error?.response?.status;
      const msg = error?.response?.data?.message || 'Error al guardar el cliente';
      // 409 = cliente ya existe → advertencia, no error
      dispatch(addNotification({ message: msg, color: status === 409 ? 'warning' : 'danger' }));
    }
  };

  const handleProductClick = (productClicked: Product) => {
    if (!productClicked.state) {
      dispatch(addNotification({ message: 'Este producto no está habilitado', color: 'warning' }));
      return;
    }
    if (selectPriceType) {
      const priceTypeForProduct = productClicked.priceTypes.find(pt => pt.category?.id === selectPriceType.id);
      if (priceTypeForProduct) {
        addProductToCart(productClicked, priceTypeForProduct);
      } else {
        dispatch(addNotification({ message: `Producto ${productClicked.name} no tiene precio para ${selectPriceType.name}`, color: 'warning' }));
      }
    } else {
      if (productClicked.priceTypes.length > 1) {
        setSelectedProductModal(productClicked);
        setShowProductPriceModal(true);
      } else if (productClicked.priceTypes.length === 1) {
        addProductToCart(productClicked, productClicked.priceTypes[0]);
      } else {
        dispatch(addNotification({ message: `Producto ${productClicked.name} no tiene precios definidos`, color: 'warning' }));
      }
    }
  };

  const handleBarcodeScan = (code: string) => {
    const prod = productsFromState.find(p =>
      p.priceTypes.some(pt => pt.sku === code)
    );
    if (prod) {
      const pt = prod.priceTypes.find(pt => pt.sku === code)!;
      addProductToCart(prod, pt);
      dispatch(addNotification({ message: `Agregado por código: ${prod.name}`, color: 'success' }));
    } else {
      dispatch(addNotification({ message: `Código no encontrado: ${code}`, color: 'warning' }));
    }
  };

  const addProductToCart = (productToAdd: Product, priceTypeSelected: ProductPriceType) => {
    const productKey = `${productToAdd.id}-${priceTypeSelected.id}`;
    const currentQty = quantities[productKey] || 0;
    const availableStock = priceTypeSelected.availableStock || productToAdd.stock || 0;

    // Validación de stock: no permitir agregar más cantidad que el stock disponible
    if (currentQty >= availableStock) {
      dispatch(addNotification({
        message: `Stock insuficiente para ${productToAdd.name}. Disponible: ${availableStock}`,
        color: 'warning'
      }));
      return;
    }

    const exists = selectedProducts.some(p =>
      p.product.id === productToAdd.id &&
      p.selectPriceType.id === priceTypeSelected.id
    );

    setQuantities(prev => ({ ...prev, [productKey]: (prev[productKey] || 0) + 1 }));

    if (!exists) {
      setSelectedProducts(prev => [...prev, { product: productToAdd, selectPriceType: priceTypeSelected }]);
    }
    setShowProductPriceModal(false);
    setSelectedProductModal(null);
  };

  const handleRemoveProduct = (productToRemove: Product, priceTypeIdToRemove: number | undefined) => {
    const productKey = `${productToRemove.id}-${priceTypeIdToRemove}`;
    setSelectedProducts(prevSelected => prevSelected.filter(p =>
      !(p.product.id === productToRemove.id && p.selectPriceType.id === priceTypeIdToRemove)
    ));
    setQuantities(prevQuantities => {
      const newQuantities = { ...prevQuantities };
      delete newQuantities[productKey];
      return newQuantities;
    });
  };

  const handleQuantityChange = (productKey: string, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let quantityValue = parseInt(event.target.value, 10);
    if (isNaN(quantityValue) || quantityValue < 1) quantityValue = 1;

    // Buscar el producto para validar stock disponible
    const [productId, priceTypeId] = productKey.split('-').map(Number);
    const selectedProduct = selectedProducts.find(
      p => p.product.id === productId && p.selectPriceType.id === priceTypeId
    );

    if (selectedProduct) {
      const availableStock = selectedProduct.selectPriceType.availableStock || selectedProduct.product.stock || 0;
      if (quantityValue > availableStock) {
        dispatch(addNotification({
          message: `Stock insuficiente. Máximo disponible: ${availableStock}`,
          color: 'warning'
        }));
        quantityValue = availableStock;
      }
    }

    setQuantities((prevQuantities) => ({ ...prevQuantities, [productKey]: quantityValue }));
  };

  const handlePaymentStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentStatus(event.target.checked ? PaymentStatus.Paid : PaymentStatus.Unpaid);
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const getDefaultClient = async (): Promise<Client | undefined> => {
    try {
      const response = await api.get('/client?search=999999999');
      if (response.data && response.data.length > 0) {
        return response.data[0];
      } else {
        const defaultClientData = { name: 'Cliente', surname: 'Mostrador', documentNumber: '999999999', email: 'cliente@mostrador.com' };
        const createResponse = await api.post('/client', defaultClientData);
        return createResponse.data;
      }
    } catch (error: any) {
      // Si el cliente por defecto ya existe (409), buscarlo directamente
      if (error?.response?.status === 409) {
        try {
          const retry = await api.get('/client?search=999999999');
          if (retry.data && retry.data.length > 0) return retry.data[0];
        } catch (_) {}
      }
      console.error('Error fetching or creating default client:', error);
      dispatch(addNotification({ message: 'Error al obtener cliente por defecto.', color: 'danger' }));
      return undefined;
    }
  };

  const handleFinalizePurchase = async () => {
    let clientToInvoice: Client | undefined = client;
    if (preferredViewMode === 'direct' && !clientToInvoice) {
      // Solo buscar cliente por defecto si no hay ninguno seleccionado
      clientToInvoice = await getDefaultClient();
      if (!clientToInvoice) {
        dispatch(addNotification({ message: 'No se pudo obtener el cliente por defecto. Verifique la configuración.', color: 'danger' }));
        return;
      }
    }
    if (!clientToInvoice) {
      dispatch(addNotification({ message: 'No hay cliente seleccionado.', color: 'warning' }));
      if (preferredViewMode === 'step-by-step') setCurrentStep(1);
      return;
    }
    await handleGenerateInvoice(clientToInvoice);
  };

  // Funciones para el modal de creación de productos
  const fetchProductCategories = async () => {
    try {
      const { data } = await api.get('/category');
      const categoriesSelect: SelectInterface[] = data.map((category: Category) => ({ 
        value: category.id.toString(), 
        label: category.name || '' 
      }));
      setSelectProductCategories(categoriesSelect);
    } catch (error) {
      console.error("Error fetching categories for product modal:", error);
    }
  };

  const handleOpenCreateProduct = () => {
    // Limpiar el formulario
    setProductName('');
    setProductSortName('');
    setProductDescription('');
    setProductImage(null);
    setProductImageFile(null);
    setProductState(true);
    setProductPriceTypes([]);
    setSelectedProductCategories([]);
    
    // Cargar categorías si no están cargadas
    if (selectProductCategories.length === 0) {
      fetchProductCategories();
    }
    
    setShowCreateProductModal(true);
  };

  const handleCloseCreateProduct = () => {
    setShowCreateProductModal(false);
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setProductImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductCategoriesChange = (newValue: MultiValue<SelectInterface>, actionMeta: ActionMeta<SelectInterface>) => {
    setSelectedProductCategories((newValue as SelectInterface[]) || []);
  };

  const handleProductDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductDescription(e.target.value);
  };

  const handleCreateProductSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!productName || !productSortName || !selectedProductCategories.length || !productPriceTypes.length) {
      dispatch(addNotification({ message: 'Debe completar todos los campos obligatorios', color: 'danger' }));
      return;
    }

    dispatch(loading(true));
    
    try {
      let imageUrl = '';
      if (productImageFile) {
        const uploadTask = storage.ref(`images/${productImageFile.name}`).put(productImageFile);
        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed", 
            snapshot => { }, 
            error => reject(error), 
            () => {
              storage.ref("images").child(productImageFile.name).getDownloadURL()
                .then(url => { 
                  imageUrl = url; 
                  resolve(url); 
                });
            }
          );
        });
      }

      const productData = {
        state: productState,
        name: productName,
        sortName: productSortName,
        description: productDescription,
        priceTypes: productPriceTypes,
        categories: selectedProductCategories.map(category => ({ id: Number(category.value) })),
        image: imageUrl
      };

      await api.post('/product', productData);
      
      dispatch(addNotification({ message: 'Producto creado exitosamente', color: 'success' }));
      handleCloseCreateProduct();
      
      // Refrescar la lista de productos
      getProductsApi();
      
    } catch (error: any) {
      dispatch(addNotification({ 
        message: error?.response?.data?.message || 'Error al crear el producto', 
        color: 'danger' 
      }));
    } finally {
      dispatch(loading(false));
    }
  };

  useEffect(() => {
    fetchCategories();
    getProductsApi();
    fetchConfig();
    fetchCashBoxes();
    fetchDiscounts();
    fetchTaxes();
    fetchCategoryPricings();
  }, []);

  useEffect(() => {
    let buffer = '';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (buffer) {
          handleBarcodeScan(buffer);
          buffer = '';
        }
      } else if (/^[\w-]$/.test(e.key)) {
        buffer += e.key;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [productsFromState]);

  const clearCart = () => {
    setSelectedProducts([]);
    setQuantities({});
    localStorage.setItem(POS_STEP_SNAPSHOTS_KEY, JSON.stringify({
      ...stepSnapshots,
      2: { selectedProducts: [], quantities: {}, selectPriceType: stepSnapshots[2].selectPriceType }
    }));
  };

  const handleClearAll = () => {
    setClient(undefined);
    setSelectedProducts([]);
    setQuantities({});
    setPaymentType(PaymentType.CashOnDelivery);
    setPaymentStatus(PaymentStatus.Unpaid);
    setInvoiceType('');
    setCurrentStep(1);
    setSelectedPaymentMethod('Efectivo');
    setSearchTerm('');
    setSelectPriceType(undefined);
    setStepSnapshots({
      1: { client: undefined },
      2: { selectedProducts: [], quantities: {}, selectPriceType: undefined },
      3: { paymentType: PaymentType.CashOnDelivery, paymentStatus: PaymentStatus.Unpaid, selectedPaymentMethod: 'Efectivo', invoiceType: '' },
    });
    localStorage.removeItem(POS_STEP_SNAPSHOTS_KEY);
  };

  const clientStepComponent = (
    <ClientStep
      client={client}
      setClient={setClient}
      onSaveClient={handleSaveClient}
    />
  );

  const productStepComponent = (
    <Row>
      <Col md={8} lg={7}>
        <ProductSelection
          products={productsFromState}
          categories={categories}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSearch={handleSearch}
          handleKeyDown={handleKeyDown}
          handleSelectCategory={handleSelectCategory}
          handleProductClick={handleProductClick}
          selectPriceType={selectPriceType}
          getProductsApi={getProductsApi}
          onOpenCreateProduct={handleOpenCreateProduct}
          isSearchActive={searchTerm.trim().length > 0}
          isFilterActive={Boolean(selectPriceType)}
        />
      </Col>
      <Col md={4} lg={5}>
        <CartSummary
          client={client}
          selectedProducts={selectedProducts}
          quantities={quantities}
          summaryPerProduct={summaryPerProduct}
          totals={{ totalAmountBeforeTax, withholdingTaxAmount, ivaAmount, totalAmount }}
          priceTypes={priceTypes}
          selectPriceType={selectPriceType}
          handleSelectPriceType={handleSelectPriceType}
          handleQuantityChange={handleQuantityChange}
          handleRemoveProduct={handleRemoveProduct}
          clearCart={clearCart}
          onEditClient={prevStep}
          onNext={nextStep}
          isStepByStep={true}
        />
      </Col>
    </Row>
  );

  const paymentStepComponent = (
    <PaymentStep
      selectedProducts={selectedProducts}
      summaryPerProduct={summaryPerProduct}
      totalAmount={totalAmount}
      selectedPaymentMethod={selectedPaymentMethod}
      setSelectedPaymentMethod={setSelectedPaymentMethod}
      setPaymentType={setPaymentType}
      invoiceType={invoiceType}
      setInvoiceType={setInvoiceType}
      paymentStatus={paymentStatus}
      handlePaymentStatusChange={handlePaymentStatusChange}
      onBack={prevStep}
      onFinalize={handleFinalizePurchase}
    />
  );

  const directModeComponent = (
     <Row>
       <Col md={8} lg={7}>
         <ProductSelection
           products={productsFromState}
           categories={categories}
           searchTerm={searchTerm}
           setSearchTerm={setSearchTerm}
           handleSearch={handleSearch}
           handleKeyDown={handleKeyDown}
           handleSelectCategory={handleSelectCategory}
           handleProductClick={handleProductClick}
           selectPriceType={selectPriceType}
           getProductsApi={getProductsApi}
           onOpenCreateProduct={handleOpenCreateProduct}
           isSearchActive={searchTerm.trim().length > 0}
           isFilterActive={Boolean(selectPriceType)}
         />
       </Col>
       <Col md={4} lg={5}>
         <CartSummary
           client={client}
           selectedProducts={selectedProducts}
           quantities={quantities}
           summaryPerProduct={summaryPerProduct}
           totals={{ totalAmountBeforeTax, withholdingTaxAmount, ivaAmount, totalAmount }}
           priceTypes={priceTypes}
           selectPriceType={selectPriceType}
           handleSelectPriceType={handleSelectPriceType}
           handleQuantityChange={handleQuantityChange}
           handleRemoveProduct={handleRemoveProduct}
           clearCart={clearCart}
           onNext={handleFinalizePurchase}
           isStepByStep={false}
         />
       </Col>
     </Row>
   );


  return (
    <Container fluid style={{ marginTop: '5px', position: 'relative' }}>
      <Button variant="outline-danger" size="sm" style={{ position: 'absolute', top: 10, right: 10 }} onClick={handleClearAll} data-tour="pos-cashbox-btn">
        Limpiar Todo
      </Button>
      {preferredViewMode === 'step-by-step' ? (
        <>
          <div data-tour="pos-stepper">
          <Stepper
            currentStep={currentStep}
            labels={['Cliente', 'Productos', 'Pago']}
            onStepClick={(step) => setCurrentStep(step)}
            enabledSteps={[
              true,
              client !== undefined,
              client !== undefined && selectedProducts.length > 0,
            ]}
          />
          </div>
          <div data-tour="pos-client-step">{currentStep === 1 && clientStepComponent}</div>
          <div data-tour="pos-product-selection">{currentStep === 2 && productStepComponent}</div>
          <div data-tour="pos-payment-step">{currentStep === 3 && paymentStepComponent}</div>
        </>
      ) : (
        directModeComponent
      )}

      <CashBoxModal
        showCashBoxModal={showCashBoxModal}
        setShowCashBoxModal={setShowCashBoxModal}
        cashBoxes={cashBoxes}
        selectedCashBox={selectedCashBox}
        setSelectedCashBox={(cashBox) => { if (cashBox) dispatch(setCashBox(cashBox)) }}
        cashBoxAction={cashBoxAction}
        setCashBoxAction={setCashBoxAction}
        cashBoxAmount={cashBoxAmount}
        setCashBoxAmount={setCashBoxAmount}
        handleCashBoxAction={handleCashBoxAction}
      />
      <ClientModal
        showClientModal={showClientModal}
        setShowClientModal={setShowClientModal}
        onClientSelect={(selected) => {
          setClient(selected);
          setShowClientModal(false);
        }}
      />
      <ProductPriceModal
        showModal={showProductPriceModal}
        setShowModal={setShowProductPriceModal}
        selectedProductModal={selectedProductModal}
        handleSelectPrice={(price) => {
          if (selectedProductModal) {
            addProductToCart(selectedProductModal, price);
          }
        }}
      />
      <ProductModal
        showModal={showCreateProductModal}
        handleCloseModal={handleCloseCreateProduct}
        handleSubmit={handleCreateProductSubmit}
        selectedProduct={null}
        name={productName}
        setName={setProductName}
        sortName={productSortName}
        setSortName={setProductSortName}
        selectedCategories={selectedProductCategories}
        handleCategoriesChange={handleProductCategoriesChange}
        selectCategories={selectProductCategories}
        state={productState}
        setState={setProductState}
        handleImageChange={handleProductImageChange}
        image={productImage}
        description={productDescription}
        handleDescriptionChange={handleProductDescriptionChange}
        setPriceTypes={setProductPriceTypes}
        priceTypes={productPriceTypes}
      />
    </Container>
  );
};

export default POSView;
