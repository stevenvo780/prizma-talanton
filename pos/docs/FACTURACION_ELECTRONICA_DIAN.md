# 🧾 Facturación Electrónica DIAN — Módulo `dian-invoice`

## Resumen

El módulo `dian-invoice` integra el POS Sinergia con la **DIAN** (Dirección de Impuestos y Aduanas Nacionales de Colombia) para emitir facturas electrónicas, notas crédito y consultar estados de documentos electrónicos.

**Proveedor actual:** [Alegra](https://www.alegra.com)  
**Arquitectura:** Provider-agnostic (se pueden añadir Siigo, FacturAPI, etc.)  
**Modelo:** Multi-tenant — cada comercio configura sus propias credenciales.

---

## 📁 Estructura del Módulo

```
src/dian-invoice/
├── dian-invoice.module.ts          # Módulo NestJS
├── dian-invoice.service.ts         # Lógica de negocio principal
├── dian-invoice.controller.ts      # Endpoints REST (8 endpoints)
├── dian-invoice.service.spec.ts    # Tests unitarios
├── dto/
│   └── dian-invoice.dto.ts         # DTOs de entrada/salida
├── entities/
│   └── dian-invoice.entity.ts      # Entidad TypeORM para tracking
└── providers/
    ├── dian-provider.interface.ts   # Interfaz abstracta del provider
    └── alegra/
        ├── alegra.provider.ts       # Implementación Alegra
        └── alegra.types.ts          # Tipos específicos de Alegra
```

---

## 🚀 Configuración Inicial

### Paso 1: Crear cuenta en Alegra

1. Ir a [alegra.com](https://app.alegra.com/register) y registrarse.
2. Completar el onboarding (datos de empresa, sector, etc.).

### Paso 2: Habilitar Facturación Electrónica en Alegra

1. En el panel de Alegra, ir a **Configuración** → sidebar → **"habilitar factura electrónica"**.
2. O visitar directamente: `https://mi.alegra.com/fe-wizard`
3. Completar los 7 pasos del wizard:
   - **Datos de la empresa** (NIT, razón social, responsabilidad tributaria, municipio, dirección)
   - **Habilitación DIAN** (autorización ante DIAN)
   - **Modos de operación** (producción o pruebas)
   - **Set de pruebas** (enviar facturas de prueba a la DIAN)
   - **Asociar prefijos** (prefijos de resolución DIAN)
   - **Numeraciones** (rango autorizado por la DIAN)
   - **Términos y condiciones**

### Paso 3: Obtener Token API de Alegra

1. En Alegra, ir a **Configuración** → **Integraciones** → pestaña **"Integración Manual (API)"**.
2. O visitar: `https://mi.alegra.com/integrations` → pestaña "Integración Manual (API)".
3. Copiar los campos:
   - **Usuario** (email de la cuenta)
   - **Token** (token alfanumérico)

### Paso 4: Configurar credenciales en el POS

Cada comercio debe configurar sus credenciales a través del endpoint:

```bash
curl -X POST http://localhost:3000/dian-invoice/configure \
  -H "Authorization: Bearer <firebase_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providerName": "alegra",
    "email": "correo@empresa.com",
    "token": "fb5d887fb7400e0f0a13"
  }'
```

**Respuesta exitosa:**
```json
{
  "message": "Proveedor alegra configurado correctamente. Credenciales validadas.",
  "provider": "alegra"
}
```

---

## 📡 Endpoints Disponibles

Todos los endpoints requieren autenticación Firebase (`Bearer token`).

### 1. `POST /dian-invoice/configure`
Configura las credenciales del proveedor de facturación electrónica.

| Campo          | Tipo     | Requerido | Descripción                        |
|----------------|----------|-----------|-------------------------------------|
| `providerName` | `string` | ✅         | `"alegra"` (por ahora)             |
| `email`        | `string` | ✅         | Email de la cuenta Alegra           |
| `token`        | `string` | ✅         | Token API de Alegra                 |
| `baseUrl`      | `string` | ❌         | URL base (default: api.alegra.com)  |

---

### 2. `POST /dian-invoice/emit`
Emite factura electrónica DIAN desde una factura existente del POS.

| Campo           | Tipo     | Requerido | Descripción                         |
|-----------------|----------|-----------|--------------------------------------|
| `invoiceId`     | `number` | ✅         | ID de la factura en el POS          |
| `paymentMethod` | `string` | ❌         | Método de pago DIAN                 |
| `notes`         | `string` | ❌         | Observaciones de la factura          |
| `numberTemplate`| `object` | ❌         | Numeración DIAN a utilizar          |

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/dian-invoice/emit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 42,
    "paymentMethod": "CASH",
    "notes": "Venta en local principal"
  }'
```

---

### 3. `POST /dian-invoice/emit-free`
Emite factura electrónica sin necesidad de tener una factura previa en el POS.

| Campo           | Tipo       | Requerido | Descripción                     |
|-----------------|------------|-----------|----------------------------------|
| `client`        | `object`   | ✅         | Datos del cliente (ver abajo)   |
| `items`         | `array`    | ✅         | Lista de ítems a facturar       |
| `paymentMethod` | `string`   | ❌         | Método de pago                  |
| `notes`         | `string`   | ❌         | Observaciones                   |
| `dueDate`       | `string`   | ❌         | Fecha de vencimiento            |
| `numberTemplate`| `object`   | ❌         | Numeración DIAN                 |

**Datos del cliente (`DianClientDto`):**
| Campo                | Tipo     | Requerido | Descripción                              |
|----------------------|----------|-----------|-------------------------------------------|
| `name`               | `string` | ✅         | Nombre o razón social                    |
| `identification`     | `string` | ✅         | Número de identificación (NIT/CC/CE)     |
| `identificationType` | `string` | ❌         | `NIT`, `CC`, `CE`, `PP`, `TI` (def: CC) |
| `email`              | `string` | ❌         | Correo del cliente                       |
| `phone`              | `string` | ❌         | Teléfono                                 |
| `address`            | `string` | ❌         | Dirección                                |
| `city`               | `string` | ❌         | Ciudad                                   |
| `regime`             | `string` | ❌         | `SIMPLIFIED`, `COMMON`                   |

**Datos de cada ítem (`DianItemDto`):**
| Campo       | Tipo     | Requerido | Descripción             |
|-------------|----------|-----------|--------------------------|
| `name`      | `string` | ✅         | Nombre del producto     |
| `quantity`   | `number` | ✅         | Cantidad                |
| `price`     | `number` | ✅         | Precio unitario         |
| `discount`  | `number` | ❌         | Descuento               |
| `taxes`     | `array`  | ❌         | Impuestos aplicados     |
| `reference` | `string` | ❌         | Referencia/SKU          |

---

### 4. `POST /dian-invoice/credit-note`
Emite una nota crédito electrónica sobre una factura previamente timbrada.

| Campo                | Tipo     | Requerido | Descripción                          |
|----------------------|----------|-----------|---------------------------------------|
| `dianInvoiceId`      | `number` | ✅         | ID del documento DIAN en el POS      |
| `reason`             | `number` | ✅         | Código de razón (1-5, ver abajo)     |
| `description`        | `string` | ❌         | Descripción detallada                |

**Códigos de razón de nota crédito:**
| Código | Descripción              |
|--------|--------------------------|
| 1      | Devolución parcial/total |
| 2      | Anulación de factura     |
| 3      | Descuento total          |
| 4      | Ajuste de precio         |
| 5      | Otros                    |

---

### 5. `GET /dian-invoice/status/:id`
Consulta y actualiza el estado del documento electrónico ante la DIAN.

**Respuesta:**
```json
{
  "id": 1,
  "dianStatus": "STAMPED",
  "cufe": "abc123def456...",
  "stampDate": "2025-02-18T03:45:00.000Z",
  "documentNumber": "FE-001",
  "pdfUrl": "https://...",
  "qrUrl": "https://..."
}
```

---

### 6. `GET /dian-invoice/pdf/:id`
Obtiene la URL del PDF del documento electrónico.

---

### 7. `GET /dian-invoice`
Lista todos los documentos electrónicos DIAN del usuario autenticado.

---

### 8. `GET /dian-invoice/number-templates/list`
Consulta las numeraciones/resoluciones de facturación configuradas en el proveedor.

---

## 🔐 Autenticación con Alegra API

La API de Alegra usa **Basic Auth** con las credenciales codificadas en Base64:

```
Authorization: Basic base64(email:token)
```

Ejemplo:
```
email: correo@empresa.com
token: fb5d887fb7400e0f0a13
Base64: Y29ycmVvQGVtcHJlc2EuY29tOmZiNWQ4ODdmYjc0MDBlMGYwYTEz
Header: Authorization: Basic Y29ycmVvQGVtcHJlc2EuY29tOmZiNWQ4ODdmYjc0MDBlMGYwYTEz
```

---

## 🏗️ Arquitectura Multi-Tenant

```
┌──────────────────────┐
│   Comercio A         │ ──→ Profile.dianConfig = { provider: 'alegra', email: 'a@a.com', token: 'xxx' }
│   Comercio B         │ ──→ Profile.dianConfig = { provider: 'alegra', email: 'b@b.com', token: 'yyy' }
│   Comercio C         │ ──→ Profile.dianConfig = null (aún no configurado)
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│   DianInvoiceService │  ← Obtiene credenciales del Profile del usuario
│   └─ AlegraProvider  │  ← Inicializa con las credenciales de ese perfil
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│   Alegra API         │ ──→ DIAN (CUFE, XML-UBL 2.1, firma digital)
└──────────────────────┘
```

---

## 📋 Estados de Documento

| Estado       | Descripción                                       |
|-------------|---------------------------------------------------|
| `PENDING`   | Documento creado, pendiente de envío a la DIAN    |
| `STAMPED`   | Timbrado exitosamente por la DIAN (tiene CUFE)    |
| `REJECTED`  | Rechazado por la DIAN (ver `errorMessage`)        |
| `ERROR`     | Error en el envío (ver `errorMessage`)            |

---

## 🧪 Swagger / API Docs

Los endpoints están documentados con Swagger. Accede a:

```
http://localhost:3000/api
```

Busca la sección **"dian-invoice"** para ver todos los endpoints con ejemplos.

---

## ⚠️ Notas Importantes

1. **Cuenta Demo:** La cuenta de Alegra actual está en plan DEMO (15 días). Para producción, se necesita un plan pagado.
2. **Habilitación DIAN:** Antes de emitir facturas reales, se debe completar el wizard de habilitación en Alegra (`https://mi.alegra.com/fe-wizard`).
3. **Set de Pruebas:** La DIAN requiere un set de pruebas exitoso antes de autorizar facturación en producción.
4. **Resolución de Numeración:** Se necesita una resolución DIAN vigente con el rango de numeración autorizado.
5. **Cada comercio es independiente:** Cada negocio que use el POS debe tener su propia cuenta en Alegra y configurar sus credenciales.
