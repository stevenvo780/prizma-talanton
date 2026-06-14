# Documentación de Rutas de Usuario - Sistema POS

## Resumen de Tests y Builds

### ✅ Estado de los Componentes
- **Backend (NestJS)**: 17 test suites ✅, 107 tests ✅, Build ✅, Lint: 4 warnings menores
- **Frontend (React)**: 2 test suites ✅, 3 tests ✅, Build ✅ 
- **RobotPos**: Componente simple Express

---

## 🔒 Rutas de Autenticación

### No Autenticadas
| Ruta | Método | Descripción | Componente |
|------|--------|-------------|------------|
| `/` | GET | Página de login | Login.tsx |
| `/register` | GET | Página de registro | Register.tsx |

### API Autenticación
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/register` | POST | Registro de usuarios |

---

## 🏪 Rutas Principales de la Aplicación (Autenticadas)

### Vistas de Usuario
| Ruta Frontend | Componente | Descripción | Funcionalidad Principal |
|---------------|------------|-------------|-------------------------|
| `/pos` | POSview.tsx | Vista principal del punto de venta | Procesamiento de ventas, caja |
| `/products` | Products.tsx | Gestión de productos | CRUD de productos, búsqueda |
| `/clients` | Clients.tsx | Gestión de clientes | CRUD de clientes |
| `/invoice` | Invoice.tsx | Gestión de facturas | Ver, crear, eliminar facturas |
| `/settings` | Settings.tsx | Configuraciones del sistema | Configuración general, webhooks, etc. |
| `/profile/edit` | EditProfile.tsx | Edición de perfil | Modificar datos del usuario |
| `/subscribe` | Suscribe.tsx | Gestión de suscripciones | Plan de suscripción |

### Redirects Automáticos
| Ruta | Destino | Propósito |
|------|---------|-----------|
| `/taxes` | `/settings` | Gestión de impuestos integrada en configuraciones |
| `/discounts` | `/settings` | Gestión de descuentos integrada en configuraciones |
| `/category` | `/settings` | Gestión de categorías integrada en configuraciones |
| `/categoryPricing` | `/settings` | Precios por categoría integrados en configuraciones |
| `/config` | `/settings` | Configuración general |
| `/` | `/pos` | Redirect al POS para usuarios autenticados |
| `/invoices` | `/invoice` | Alias para facturas |

---

## 🔌 API Endpoints del Backend

### 👤 Gestión de Usuarios
| Endpoint | Método | Descripción | Controlador |
|----------|--------|-------------|-------------|
| `/api/user` | GET | Listar usuarios | UserController |
| `/api/user` | POST | Crear usuario | UserController |
| `/api/user/:id` | GET | Obtener usuario específico | UserController |
| `/api/user/:id` | DELETE | Eliminar usuario | UserController |

### 👤 Gestión de Perfiles
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/profile` | GET | Listar perfiles |
| `/api/profile` | POST | Crear perfil |
| `/api/profile/:id` | GET | Obtener perfil específico |
| `/api/profile/user/:userId` | GET | Obtener perfil por ID de usuario |
| `/api/profile/:id` | DELETE | Eliminar perfil |

### 📦 Gestión de Productos
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/product/search` | GET | Búsqueda de productos |
| `/api/product` | GET | Listar productos |
| `/api/product` | POST | Crear producto |
| `/api/product/:id` | GET | Obtener producto específico |
| `/api/product/:id` | DELETE | Eliminar producto |

### 👥 Gestión de Clientes
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/client` | GET | Listar clientes |
| `/api/client` | POST | Crear cliente |
| `/api/client/:id` | GET | Obtener cliente específico |
| `/api/client/:id` | DELETE | Eliminar cliente |

### 📂 Gestión de Categorías
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/category` | GET | Listar categorías |
| `/api/category` | POST | Crear categoría |
| `/api/category/:id` | GET | Obtener categoría específica |
| `/api/category/:id` | DELETE | Eliminar categoría |

### 💰 Precios por Categoría
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/category-pricing` | GET | Listar precios por categoría |
| `/api/category-pricing` | POST | Crear precio por categoría |
| `/api/category-pricing/:id` | GET | Obtener precio específico |
| `/api/category-pricing/:id` | DELETE | Eliminar precio |

### 💸 Gestión de Caja
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/cash-box` | GET | Listar cajas |
| `/api/cash-box` | POST | Crear caja |
| `/api/cash-box/:id` | GET | Obtener caja específica |
| `/api/cash-box/:id` | DELETE | Eliminar caja |
| `/api/cash-box/:id/cash-in/:amount` | PUT | Ingresar dinero a caja |
| `/api/cash-box/:id/cash-out/:amount` | PUT | Retirar dinero de caja |
| `/api/cash-box/:id/adjust-balance/:newBalance` | PUT | Ajustar balance de caja |

### 🧾 Gestión de Facturas
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/invoice` | GET | Listar facturas |
| `/api/invoice/:id` | POST | Crear factura |
| `/api/invoice/:id` | GET | Obtener factura específica |
| `/api/invoice/:id` | DELETE | Eliminar factura |

### 💼 Gestión de Impuestos
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/taxes` | GET | Listar impuestos |
| `/api/taxes` | POST | Crear impuesto |
| `/api/taxes/:id` | GET | Obtener impuesto específico |
| `/api/taxes/:id` | DELETE | Eliminar impuesto |

### 🎯 Gestión de Descuentos
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/discounts` | GET | Listar descuentos |
| `/api/discounts` | POST | Crear descuento |
| `/api/discounts/:id` | GET | Obtener descuento específico |
| `/api/discounts/:id` | DELETE | Eliminar descuento |

### 🔗 Webhooks
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/webhook` | GET | Listar webhooks |
| `/api/webhook` | POST | Crear webhook |
| `/api/webhook/:id` | GET | Obtener webhook específico |
| `/api/webhook/:id` | DELETE | Eliminar webhook |

### ⚙️ Configuración
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/config` | GET | Obtener configuración |
| `/api/config` | POST | Actualizar configuración |

### 🔌 Integraciones
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/integrations/plugins` | GET | Listar plugins |
| `/api/integrations/plugins` | PUT | Actualizar plugins |

### 🛣️ Utilidades
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/routes` | GET | Listar todas las rutas disponibles |
| `/api/` | GET | Endpoint raíz (health check) |

---

## 🌊 Flujos de Usuario Principales

### 1. Flujo de Autenticación
1. **Login**: `/` → Autenticación → Redirect a `/pos`
2. **Registro**: `/register` → Creación de cuenta → Redirect a `/`

### 2. Flujo de Ventas (POS)
1. **Vista POS**: `/pos` → Interfaz principal de ventas
2. **Búsqueda de productos**: API `/product/search`
3. **Gestión de caja**: APIs `/cash-box/*`
4. **Generación de factura**: API `/invoice/:id` POST

### 3. Flujo de Gestión de Productos
1. **Lista de productos**: `/products` → API `/product` GET
2. **Crear producto**: Form → API `/product` POST
3. **Editar producto**: API `/product/:id` GET/PUT
4. **Eliminar producto**: API `/product/:id` DELETE

### 4. Flujo de Gestión de Clientes
1. **Lista de clientes**: `/clients` → API `/client` GET
2. **Crear cliente**: Form → API `/client` POST
3. **Ver cliente**: API `/client/:id` GET
4. **Eliminar cliente**: API `/client/:id` DELETE

### 5. Flujo de Configuración
1. **Acceso a configuración**: `/settings`
2. **Gestión de categorías**: APIs `/category/*`
3. **Gestión de impuestos**: APIs `/taxes/*`
4. **Gestión de descuentos**: APIs `/discounts/*`
5. **Configuración de webhooks**: APIs `/webhook/*`
6. **Configuración general**: APIs `/config/*`

### 6. Flujo de Facturas
1. **Lista de facturas**: `/invoice` → API `/invoice` GET
2. **Ver factura**: API `/invoice/:id` GET
3. **Eliminar factura**: API `/invoice/:id` DELETE

---

## 🚀 Estado de la Aplicación

### ✅ Componentes Funcionales
- Autenticación y autorización
- Sistema de rutas frontend
- API REST completa
- Gestión de usuarios y perfiles
- CRUD completo para todas las entidades
- Sistema de caja
- Webhooks y configuración

### ⚠️ Advertencias Detectadas
- 4 warnings de lint en backend (variables no usadas)
- Warnings de source maps en frontend (react-datepicker)
- Warning de Redux sobre valores no serializables

### 🔧 Próximos Pasos de Testing
1. Probar cada flujo de usuario con MCP
2. Verificar integración frontend-backend
3. Validar autenticación en todas las rutas
4. Probar funcionalidades de caja y facturación
5. Verificar configuraciones y webhooks
