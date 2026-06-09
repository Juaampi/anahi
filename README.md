# Anahi Nails Diamond

Ecommerce moderna creada desde cero con `React + Vite + Tailwind`, pensada para deploy en Netlify, catálogo administrable, carrito persistente, integración con Cloudinary, estructura para Neon y checkout preparado con Mercado Pago.

## Stack

- `React 19` + `TypeScript` + `Vite`
- `Tailwind CSS` para UI
- `Netlify Functions` para API serverless
- `Neon PostgreSQL` para persistencia
- `Cloudinary` para gestión de imágenes
- `Mercado Pago SDK` para generar preferencias de pago
- `Zustand` para carrito con `localStorage`
- `TanStack Query` para datos y admin

## Estructura

```text
anahi-nails-diamond/
  db/schema.sql
  netlify/functions/
    _lib/
    api.ts
  public/
  src/
    components/
    hooks/
    lib/
    pages/
    providers/
    store/
    types/
  .env.example
  netlify.toml
```

## Funcionalidades incluidas

- Home comercial inspirada en Kaixo, con hero, beneficios, categorías y destacados.
- Catálogo responsive con filtros por nombre, categoría, precio y destacados.
- Detalle de producto con galería, stock, cantidad, agregar al carrito y contacto por WhatsApp.
- Carrito funcional con persistencia en `localStorage`.
- Checkout con formulario completo de comprador.
- Creación de pedidos y estructura preparada para generar preferencia de Mercado Pago.
- Panel admin con login simple, ABM de productos, ABM de categorías y gestión de pedidos.
- Subida de imágenes a Cloudinary desde admin mediante firma server-side.
- SEO base con `title`, `meta description`, Open Graph y URLs limpias.

## Variables de entorno

Copiá `.env.example` como `.env` y completá:

### Frontend

- `VITE_SITE_URL`
- `VITE_WHATSAPP_NUMBER`
- `VITE_INSTAGRAM_URL`
- `VITE_CLOUDINARY_CLOUD_NAME`

### Neon

- `DATABASE_URL`

### Admin

- `JWT_SECRET`
- `ADMIN_SEED_NAME`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

### Cloudinary

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_UPLOAD_FOLDER`

### Mercado Pago

- `MERCADOPAGO_ACCESS_TOKEN`
- `CHECKOUT_SUCCESS_URL`
- `CHECKOUT_FAILURE_URL`
- `CHECKOUT_PENDING_URL`

## Instalación local

```bash
npm install
cp .env.example .env
```

Para correr con funciones serverless en local, usar:

```bash
npm run dev:netlify
```

Si querés ver solo el frontend sin funciones:

```bash
npm run dev
```

## Configurar Neon

1. Crear un proyecto en Neon.
2. Copiar la cadena de conexión en `DATABASE_URL`.
3. Ejecutar el proyecto con `npm run dev:netlify` o deployarlo en Netlify.
4. La función `netlify/functions/api.ts` crea tablas si no existen y carga datos iniciales.
5. El SQL base también quedó documentado en [db/schema.sql](/C:/xampp/htdocs/anahi-nails-diamond/db/schema.sql).

## Configurar Cloudinary

1. Crear una cuenta y obtener `cloud name`, `api key` y `api secret`.
2. Completar esas variables en `.env`.
3. Desde el panel admin, al crear o editar un producto, usar el input de archivo para subir imágenes.
4. La firma del upload se genera desde `/.netlify/functions/api/cloudinary/signature`.

## Configurar Mercado Pago

1. Crear credenciales de aplicación en Mercado Pago.
2. Cargar `MERCADOPAGO_ACCESS_TOKEN` en `.env` o en Netlify.
3. Ajustar `CHECKOUT_SUCCESS_URL`, `CHECKOUT_FAILURE_URL` y `CHECKOUT_PENDING_URL`.
4. El endpoint `POST /.netlify/functions/api/checkout/create-preference` genera la preferencia con el SDK.
5. Si no hay token configurado, el checkout sigue guardando pedidos pero no redirige al pago.

## Admin por defecto

- Email inicial: `admin@anahinailsdiamond.com`
- Password inicial: `admin123456`

Cambialos vía variables de entorno antes de pasar a producción.

## Deploy en Netlify

1. Subir el repo a GitHub.
2. Crear un sitio en Netlify conectado al repo.
3. Confirmar:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Cargar todas las variables de entorno de `.env.example`.
5. Deployar.

`netlify.toml` ya deja resueltos:

- Publish de `dist`
- Functions en `netlify/functions`
- Redirect de `/api/*`
- Fallback SPA para rutas de React Router

## Verificación

Comandos usados durante la entrega:

```bash
npm run lint
npm run build
```

## Notas

- Si `DATABASE_URL` no está configurado, la API usa una semilla en memoria para demo local.
- Para producción real conviene definir un flujo adicional de confirmación de pago por webhook de Mercado Pago.
- El diseño quedó listo para escalar banners, promociones, marcas, colecciones y automatizaciones futuras.
