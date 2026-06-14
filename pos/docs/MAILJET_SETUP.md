# Configuración de Mailjet para Envío de Facturas

## Descripción

Este sistema está configurado para enviar automáticamente correos electrónicos con las facturas a los clientes cuando se crea una nueva factura. El servicio utiliza Mailjet como proveedor de correo electrónico.

## Configuración

### 1. Crear cuenta en Mailjet

1. Ve a [Mailjet](https://www.mailjet.com/) y crea una cuenta
2. Una vez registrado, ve a **Account Settings** > **API Key Management**
3. Genera o copia tu **API Key** y **Secret Key**

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto basado en `.env.example` y configura las siguientes variables:

```env
# Mailjet Configuration
MAILJET_API_KEY=tu_api_key_de_mailjet
MAILJET_API_SECRET=tu_secret_key_de_mailjet
MAILJET_FROM_EMAIL=noreply@tuempresa.com
MAILJET_FROM_NAME=Sistema POS
```

### 3. Variables requeridas

- **MAILJET_API_KEY**: Tu clave API de Mailjet
- **MAILJET_API_SECRET**: Tu clave secreta de Mailjet
- **MAILJET_FROM_EMAIL**: El email desde el cual se enviarán las facturas
- **MAILJET_FROM_NAME**: El nombre que aparecerá como remitente

## Funcionalidad

### Envío automático de facturas

Cuando se crea una nueva factura en el sistema:

1. Se verifica que el cliente tenga un email configurado
2. Se genera un email HTML con los detalles de la factura
3. Se envía automáticamente el correo al cliente
4. El sistema registra logs del proceso de envío

### Contenido del email

El correo electrónico incluye:

- **Información de la factura**: Número, fecha, tracking number
- **Datos del cliente**: Nombre, documento, email, teléfono, dirección  
- **Detalles de productos**: Lista de productos con cantidades, precios y totales
- **Resumen**: Total de la factura, estado de pago, método de pago
- **Formato**: HTML profesional con estilos CSS y versión texto plano

### Template del email

El email se genera con un diseño profesional que incluye:

- Header con logo y datos de la factura
- Sección de información del cliente
- Tabla detallada de productos
- Resumen de totales
- Footer con mensaje de agradecimiento

## Logs y debugging

El servicio registra logs para:

- ✅ Envíos exitosos
- ⚠️ Advertencias (cliente sin email)
- ❌ Errores en el envío

Los logs se pueden revisar en la consola de la aplicación.

## Manejo de errores

- Si el cliente no tiene email, se registra una advertencia y continúa el proceso
- Si falla el envío del email, se registra el error pero NO se detiene la creación de la factura
- Los errores de Mailjet se capturan y registran apropiadamente

## Consideraciones de seguridad

- Las credenciales de Mailjet deben mantenerse seguras en variables de entorno
- No incluir el archivo `.env` en el control de versiones
- Usar emails válidos y verificados para el remitente

## Testing

Para probar el envío de emails:

1. Configura las variables de entorno correctamente
2. Asegúrate de que el cliente tenga un email válido
3. Crea una nueva factura
4. Verifica los logs para confirmar el envío
5. Revisa la bandeja de entrada del cliente

## Soporte

Si tienes problemas con la configuración:

1. Verifica que las credenciales de Mailjet sean correctas
2. Revisa los logs de la aplicación
3. Confirma que el email del remitente esté verificado en Mailjet
4. Asegúrate de que no haya límites en tu cuenta de Mailjet
