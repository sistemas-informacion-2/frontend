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
| `public/pwa-icon.svg` | Ícono fuente (bolsa de compras sobre fondo negro de marca `#09090b`) |
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

## Compras sin conexión (RF-SYNC-01)

Una compra hecha sin conexión sigue siendo una **compra**: nunca se convierte en reserva ni se cobran importes parciales. Sin
red no se cobra nada ni se guardan datos de pago, porque Stripe exige que el cliente autorice en su página.

1. Sin conexión, `/checkout` muestra "Confirmar compra sin conexión" y deja elegir el método de pago.
2. La compra se guarda en IndexedDB (`fashionstore-offline` → `pedidos`, `COMPRA_PENDIENTE_SINCRONIZACION`) y se hace `POST /api/electronico/checkout/sync`.
3. El SW no tiene red: la encola en `cola-compras-offline` (Workbox Background Sync) y responde `202`.
4. Al volver la red el SW la reenvía sola, aunque la pestaña esté cerrada.
5. El backend bloquea las filas de `inventario` con `pessimistic_write` y mide todas las variantes:
   - con stock → el carrito pasa a ser esa compra → `201` y `COMPRA_PENDIENTE_PAGO`;
   - sin stock → rollback y `409` con `codigo_error: COMPRA_RECHAZADA_STOCK_AGOTADO` e `items_afectados` → `COMPRA_FALLIDA`.
6. El cliente paga el total en el checkout normal con el método elegido. Ese paso descuenta el stock y genera la **Nota de Venta E-Commerce**; la compra queda `COMPRA_COMPLETADA`, se confirma y se borra del dispositivo.

El stock no queda apartado entre la validación y el pago: si otra persona compra esa prenda en ese intervalo, el checkout lo rechaza sin cobrar.

**Elegir prendas sin conexión.** Con red, el catálogo precarga en segundo plano la ficha
(tallas, colores, stock) y la imagen de los productos que muestra (`usePrecargaCatalogo`), así
que sin conexión se puede abrir cualquiera de ellos. "Agregar al carrito" sin conexión guarda la
prenda en el dispositivo (`offline/carritoOffline.ts`, línea con id negativo): se ve junto al
carrito del servidor, entra en el pedido offline y, si no se hizo pedido, sube sola al carrito del
servidor al volver la red (si el servidor la rechaza, p. ej. sin stock, se avisa). El stock y el
precio son los de la última vez que hubo red; el servidor los valida al sincronizar.

Es idempotente por `id_local_offline` (columna única en `nota_venta`): una compra ya pagada que la cola reenvía no vuelve a llenar el carrito.
En navegadores sin Background Sync (Firefox, Safari) la página reenvía al recibir el evento
`online`. Si el token venció, el pedido queda en `REQUIERE_SESION` y se reenvía al iniciar sesión.

## Panel admin sin conexión

Con red, `usePrecargaAdmin` descarga lo que permite el rol, también por sucursal (hasta 10). Sin conexión se ve aunque no se haya
abierto, siempre que la cabecera haya llegado a "Listo para usar sin conexión". Cerrar sesión borra esa caché y los reportes guardados.

**Cambios en cola.** Si una escritura no obtiene respuesta, `httpClient` la guarda en IndexedDB (`fashionstore-admin-offline`) y la
pantalla sigue como si se hubiera aceptado. Al volver la red se envían en orden mientras el panel esté abierto; el indicador
"N sin enviar" de la cabecera los lista. Cada operación se declara en `core/offline/reglasOffline.ts`: una que no esté ahí necesita red.

Todo el CRUD del panel funciona sin conexión. Solo necesitan red: iniciar sesión, cobros en línea, el carrito y las reservas del cliente (tienen su propio flujo offline), exportar reportes, el asistente con IA y los filtros nunca cargados.

- **Lo creado sin conexión** recibe un id negativo y aparece en las listas, se puede editar, eliminar y elegir en otros formularios. Al crearse en el servidor, lo que dependía de ese id pasa al real; si se rechaza, lo que depende de él queda esperando, y descartarlo descarta también lo demás.
- **Contraseñas y llaves de pago** se guardan cifradas (AES-GCM, clave no extraíble) y se borran al enviarse. Protege lo guardado en disco, no contra código malicioso ejecutándose en la página.
- **Imágenes:** se guarda el archivo y se sube al volver la red; lo que usaba la vista previa pasa a la URL real.
- **Duplicados:** cada envío lleva `Idempotency-Key` y el backend guarda la respuesta en `solicitud_idempotente`.
- **Rechazos:** si el servidor rechaza un cambio (sin stock, sin caja abierta), queda con su motivo para reintentar o descartar. Un error 5xx o sin red se reintenta solo.
- **Conflictos:** antes de enviar una edición se compara el registro actual con el que se editó. Si otra persona cambió esos campos, se pregunta qué hacer. Solo se detecta en campos simples y si el registro se había visto antes.
- **Ventas:** conservan su fecha real (`fechaOffline`, hasta 7 días). El dinero entra a la caja abierta cuando llegan, y sin caja abierta se rechazan hasta abrirla. Lo vendido se descuenta del stock que ofrece ese dispositivo.
- **Totales locales:** caja y stock solo reflejan sin conexión lo hecho directamente sobre ellos. Una venta pendiente no suma al total de la caja hasta enviarse.

**Reportes.** El servidor los calcula, así que sin red se muestra el último resultado con su fecha. Los predefinidos se precargan
(como máximo cada 6 horas) y cada ejecución del constructor se guarda por su configuración exacta. Exportar y el asistente generativo necesitan red.

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

## Notificaciones push en segundo plano (Web Push)

Llegan aunque la tienda esté cerrada. Usan claves VAPID y el servicio push de cada navegador, sin costo; el canal de Expo sigue atendiendo a la app móvil.

1. Al entrar se invita a activar los avisos (también están en **Mi perfil → Avisos en este dispositivo**). Con ese clic el navegador pide permiso y se suscribe con la clave pública.
2. La suscripción se guarda en `suscripcion_web_push` (una fila por navegador).
3. `NotificacionesService.notificarPorPush` firma y cifra cada aviso con `web-push`, en segundo plano. Un fallo nunca afecta a la compra o devolución que lo originó.
4. `sw.ts` recibe el evento `push` y muestra la notificación; al tocarla abre la tienda con la campana desplegada.

Las suscripciones vencidas (404 o 410) se borran solas. Solo se aceptan direcciones de los servicios push de los navegadores. Al cerrar sesión se desvincula el dispositivo, y al entrar se vincula a la cuenta que inicia sesión.

**Puesta en marcha.** Genera las claves una sola vez con `npx web-push generate-vapid-keys` y define `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT` en el backend; usa las mismas en producción, porque si cambian cada navegador debe reactivar los avisos. Exige HTTPS (`localhost` es la excepción). En iPhone funciona solo con la tienda agregada a la pantalla de inicio (iOS 16.4 o posterior). En producción `synchronize` está apagado, así que crea la tabla:

```sql
CREATE TABLE IF NOT EXISTS suscripcion_web_push (
  id serial PRIMARY KEY,
  id_usuario int NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh varchar(255) NOT NULL,
  auth varchar(100) NOT NULL,
  fecha_actualizacion timestamp NOT NULL DEFAULT now()
);
```

Si una prueba dice "enviado" y no aparece nada, revisa que el sistema operativo permita las notificaciones de ese navegador (en Windows: Configuración → Sistema → Notificaciones).

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
- **Compra sin conexión (RF-SYNC-01)**: con sesión de cliente y productos en el
  carrito, abre `/checkout`, marca **Offline** y pulsa "Confirmar compra sin
  conexión". En **Application → IndexedDB** aparecen `fashionstore-offline/pedidos`
  (`PENDIENTE_ENVIO`) y `workbox-background-sync` (la cola). Desmarca **Offline**:
  la compra se envía sola y aparece el aviso para pagar el total. Para
  forzar el reenvío sin esperar: **Application → Service Workers → Sync** con el
  tag `workbox-background-sync:cola-compras-offline`.
- **Colisión de stock (409)**: guarda un pedido offline, vende ese stock desde
  otra pestaña o desde caja, y vuelve a conectarte: aparece el aviso de que la
  compra se canceló por falta de stock.
- **Lighthouse → categoría "PWA"**: valida instalabilidad, manifest e íconos.

En `npm run dev` el service worker también está activo (`devOptions.enabled: true`
en `vite.config.ts`), así que no hace falta un build completo para probar cambios
chicos del cacheo durante el desarrollo.
