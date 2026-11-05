# PWA (Progressive Web App)

FashionStore es instalable y funciona parcialmente offline gracias a `vite-plugin-pwa`
(que genera el service worker con Workbox por debajo). Este documento explica qué se
configuró, por qué, y qué partes **no** funcionan sin conexión a propósito.

## Dependencias instaladas

```bash
npm install -D vite-plugin-pwa @vite-pwa/assets-generator
```

- **`vite-plugin-pwa`**: integra el plugin con Vite, genera `manifest.webmanifest`,
  genera el service worker (`sw.js`) con Workbox, lo registra en el HTML e inyecta
  los `<link>`/`<meta>` necesarios en `index.html` en build time.
- **`@vite-pwa/assets-generator`**: CLI que genera todo el set de íconos (192, 512,
  maskable, `apple-touch-icon`, `favicon.ico`) a partir de un único SVG fuente, en
  vez de exportarlos a mano uno por uno.

Ambas quedan en `devDependencies`: no viajan al bundle final, solo se usan en build time.

## Archivos que se tocaron o agregaron

| Archivo | Qué hace |
|---|---|
| `vite.config.ts` | Agrega el plugin `VitePWA(...)` en modo `injectManifest` (Service Worker propio), con manifest y `devOptions` |
| `src/sw.ts` | Service Worker propio: precache, reglas de cache y la cola de Background Sync de RF-SYNC-01 |
| `src/core/offline/pedidosOfflineDb.ts` | IndexedDB de pedidos offline (compartido por la página y el SW) |
| `src/modules/electronico/offline/pedidosOffline.ts` | Lado de la página de RF-SYNC-01: guardar, enviar y reintentar pedidos |
| `src/modules/electronico/components/PedidosOffline.tsx` | Checkout sin conexión, avisos y modal de resolución del 409 |
| `pwa-assets.config.ts` | Config del generador de íconos (`npm run pwa:icons`) |
| `public/pwa-icon.svg` | Ícono fuente (bolsa de compras sobre fondo morado de marca `#863bff`) |
| `public/pwa-*.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`, `public/favicon.ico` | Íconos generados, no se editan a mano — se regeneran con `npm run pwa:icons` |
| `index.html` | Agrega `theme-color` y metatags `apple-mobile-web-app-*` (iOS no lee el manifest para estas cosas) |
| `src/main.tsx` | Registra el service worker (`registerSW` de `virtual:pwa-register`) |
| `tsconfig.app.json` | Agrega el tipo `vite-plugin-pwa/client` (para que TS conozca `virtual:pwa-register`) |
| `nginx.conf` | `Cache-Control: no-cache` explícito para `sw.js` / `manifest.webmanifest` |
| `package.json` | Script `pwa:icons` |

## Cómo regenerar los íconos

Si cambia el logo, solo hay que editar `public/pwa-icon.svg` (debe ser un SVG simple,
sin filtros de desenfoque ni texto — algunos renderizadores de PNG no soportan
`feGaussianBlur` ni fuentes externas) y correr:

```bash
npm run pwa:icons
```

Esto regenera todos los PNG/ICO en `public/`.

## Estrategia de cache (por qué cada regla existe)

Configurado en `src/sw.ts` (`registerRoute`). El orden importa: Workbox usa la primera
regla que coincida. Las reglas comparan `url.pathname`, así que también aplican cuando la
API vive en otro origen (en `npm run dev`, `localhost:3000` frente a `localhost:5173`).

```
0. POST /api/electronico/checkout/sync → red; sin red, cola Background Sync (RF-SYNC-01)
1. /api/electronico/checkout/*         → NetworkOnly  (pagos)
2. /api/acceso/auth/* , /api/reports/generativo → NetworkOnly  (sesión, IA)
3. /api/* (todo lo demás)              → NetworkFirst (catálogo, carrito, inventario, etc.)
4. imágenes (request.destination)      → StaleWhileRevalidate
5. JS/CSS/HTML/SVG/PNG/ICO/woff2       → precacheados en el build (app shell)
```

Workbox solo intercepta `GET` salvo que se indique otro método: los `POST` de login y de pago
nunca pasan por la caché. La regla 0 es la única que maneja un `POST`.

## Pedidos sin conexión (RF-SYNC-01)

Sin red no se puede cobrar, así que un pedido confirmado sin conexión se guarda en el
dispositivo y, al sincronizarse, se convierte en una **reserva PENDIENTE para retiro** (el
cliente paga el anticipo en línea o todo al retirar; si no, vence como cualquier reserva).

1. Sin conexión, `/checkout` muestra "Guardar pedido sin conexión" en vez de los métodos de pago.
2. La página guarda el pedido en IndexedDB (`fashionstore-offline` → `pedidos`, estado
   `PENDIENTE_ENVIO`) y hace `POST /api/electronico/checkout/sync`.
3. El SW no tiene red: encola la petición en `cola-compras-offline` (Workbox Background Sync)
   y responde `202`, así que la página muestra "Pedido guardado localmente" y no un error.
4. Al volver la red, el SW reenvía la cola solo (aunque la pestaña esté cerrada), con el
   token más reciente que la página le compartió por IndexedDB (solo si es del mismo cliente).
5. El backend bloquea las filas de `inventario` con `pessimistic_write`, mide todas las
   variantes y:
   - con stock → crea la reserva, aparta el stock, quita esas prendas del carrito → `201`;
   - sin stock → rollback y `409` con `codigo_error: STOCK_AGOTADO_COLISION` e `items_afectados`.
6. La página muestra el resultado: aviso de éxito con el código de reserva, o un modal para
   **retirar en otra sucursal** o **cancelar el pedido** (no se cobró nada).

**Elegir prendas sin conexión.** Con red, el catálogo precarga en segundo plano la ficha
(tallas, colores, stock) y la imagen de los productos que muestra (`usePrecargaCatalogo`), así
que sin conexión se puede abrir cualquiera de ellos. "Agregar al carrito" sin conexión guarda la
prenda en el dispositivo (`offline/carritoOffline.ts`, línea con id negativo): se ve junto al
carrito del servidor, entra en el pedido offline y, si no se hizo pedido, sube sola al carrito del
servidor al volver la red (si el servidor la rechaza, p. ej. sin stock, se avisa). El stock y el
precio son los de la última vez que hubo red; el servidor los valida al sincronizar.

Es idempotente por `id_local` (columna única `reserva.id_local_offline`): si la página y el SW
envían el mismo pedido, o se pierde la respuesta y la cola lo reenvía, no se duplica.
En navegadores sin Background Sync (Firefox, Safari) la página reenvía al recibir el evento
`online`. Si el token venció, el pedido queda en `REQUIERE_SESION` y se reenvía al iniciar sesión.

### Lo que **sí** funciona offline

- La aplicación carga (app shell: HTML/JS/CSS/íconos quedan precacheados).
- Navegar entre rutas ya visitadas antes (React Router sigue andando con el
  `navigateFallback: '/index.html'`).
- Ver el catálogo/productos/imágenes que ya se cargaron antes (quedan en
  `api-cache`/`images-cache` hasta 24h y 30 días respectivamente).

### Lo que **nunca** funciona offline (a propósito)

Se excluyó explícitamente con `NetworkOnly` porque cachearlo sería incorrecto o
inseguro, no porque falte implementarlo:

- **Pagos (Stripe, QR, tarjeta)** — `/api/electronico/checkout/**`. Una compra no
  puede "completarse offline" ni reintentarse sola con una Background Sync: si el
  service worker reintentara un `POST` de pago guardado, se arriesga a cobrar dos
  veces o a crear una venta con datos de inventario/precio desactualizados. El
  checkout siempre exige red real.
- **Login / refresh de sesión** — `/api/acceso/auth/**`. El JWT no se puede sacar de
  una respuesta cacheada; necesita validarse contra el backend en cada intento.
- **Reportes generativos con Gemini** — `/api/reports/generativo`. Es una
  conversación con un modelo de IA en vivo; no tiene sentido "cachear" una
  respuesta de IA y devolverla para una pregunta distinta.
- **Probador virtual (Decart AI)** — las llamadas del probador (`@decartai/sdk`,
  WebRTC/`livekit-client`) van directo del navegador a `decart.ai`, un dominio
  externo. El service worker de este origen no las intercepta (no matchean
  `/api/`), así que ni se cachean ni se bloquean: simplemente necesitan conexión,
  como cualquier video en vivo.

Estas tres cosas (pagos, login, IA) y el probador con webcam **requieren red real
por diseño**, no es una limitación del service worker — están explícitamente
afuera de cualquier estrategia de cache para que nunca se sirva una respuesta
vieja o falsa en algo que mueve dinero o sesión.

## Consideraciones para el despliegue en AWS

Un service worker necesita un **contexto seguro** (HTTPS) para registrarse —
`localhost` es la única excepción, así que en dev (`npm run dev`) funciona sin TLS,
pero en AWS la app **debe** servirse por HTTPS (ya sea con un Load Balancer/ALB con
certificado ACM delante del contenedor de nginx, o con CloudFront si se sirve como
sitio estático desde S3).

Puntos a verificar al desplegar:

1. **HTTPS de punta a punta** — si hay un ALB o CloudFront delante de nginx, el
   certificado TLS termina ahí; nginx sigue escuchando en `:80` puertas adentro,
   igual que ahora. No hace falta cambiar nada del contenedor por esto.
2. **`sw.js` y `manifest.webmanifest` no deben cachearse agresivamente** en ningún
   proxy/CDN intermedio. Ya se agregó la regla en `nginx.conf`
   (`Cache-Control: no-cache`), pero si el despliegue final usa **CloudFront en
   vez de (o además de) nginx**, hay que replicar esa misma regla ahí: una
   **cache behavior** para `/sw.js` y `/manifest.webmanifest` con TTL en 0 o
   "use origin cache headers", para que un deploy nuevo no tarde horas en
   notarse (el usuario seguiría offline con la versión vieja del SW hasta que
   esa caché expire).
3. **El dominio debe ser estable** — el scope del manifest es `/` sobre el
   origen donde se sirve la app. Si cambia el dominio entre ambientes (por
   ejemplo de una URL de preview a `fashionstore.com`), los usuarios que
   instalaron la PWA en el dominio viejo no "migran" solos: es una instalación
   nueva en cada origen. Para producción, fijar el dominio final antes de pedirle
   a los usuarios que instalen la app.
4. **`/api/` debe seguir siendo mismo-origen** (como ya hace `nginx.conf` con el
   `proxy_pass` al backend). Si en AWS el backend queda en un dominio/subdominio
   distinto del frontend, se recomienda mantener el proxy inverso (evita CORS).
   Las reglas de `src/sw.ts` comparan solo el `pathname` (`/api/...`), así que
   siguen funcionando aunque la API esté en otro dominio.
5. **Variables de entorno de build** (`VITE_API_URL`, `VITE_DECART_API_KEY`) se
   siguen inyectando como `ARG`/`ENV` del `Dockerfile` en build time, igual que
   antes — la PWA no cambia nada de esto, solo agrega el service worker al mismo
   `dist/` que ya se sirve.

## Cómo probarla

```bash
npm run build && npm run preview
```

Luego, en Chrome DevTools:

- **Application → Manifest**: confirma nombre, íconos y `theme_color`.
- **Application → Service Workers**: confirma que `sw.js` está activo (`activated and is running`).
- **Network → Offline** (tildar el checkbox) + recargar: la app debe seguir
  cargando y navegando entre páginas ya visitadas; el login falla con el error
  de red normal (es lo esperado, ver sección anterior).
- **Pedido sin conexión (RF-SYNC-01)**: con sesión de cliente y productos en el
  carrito, abre `/checkout`, marca **Offline** y pulsa "Guardar pedido sin
  conexión". En **Application → IndexedDB** aparecen `fashionstore-offline/pedidos`
  (`PENDIENTE_ENVIO`) y `workbox-background-sync` (la cola). Desmarca **Offline**:
  el pedido se envía solo y aparece el aviso con el código de la reserva. Para
  forzar el reenvío sin esperar: **Application → Service Workers → Sync** con el
  tag `workbox-background-sync:cola-compras-offline`.
- **Colisión de stock (409)**: guarda un pedido offline, vende ese stock desde
  otra pestaña o desde caja, y vuelve a conectarte: aparece el modal para cambiar
  de sucursal o cancelar.
- **Lighthouse → categoría "PWA"**: valida instalabilidad, manifest e íconos.

En `npm run dev` el service worker también está activo (`devOptions.enabled: true`
en `vite.config.ts`), así que no hace falta un build completo para probar cambios
chicos del cacheo durante el desarrollo.
