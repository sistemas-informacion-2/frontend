# Modo offline: instalación en el frontend

Guía para integrar el modo offline en otra rama. La contraparte del servidor está en `README-OFFLINE.md` del repositorio `backend`: **hacen falta los dos**.

El detalle de cómo funciona está en [PWA.md](PWA.md).

## 1. Traer los cambios

```bash
git fetch origin
```

```bash
git merge origin/frontRamaNico
```

Si hay conflictos en `package-lock.json`, resuelve primero los de `package.json`, borra el lock y ejecuta `npm install`.

## 2. Instalar las dependencias

El merge ya trae `package.json` y `package-lock.json`, así que basta con:

```bash
npm install
```

Usamos Node 24. Si integras los cambios a mano, sin merge, instala los paquetes así:

```bash
npm install -D vite-plugin-pwa@^2.0.0 @vite-pwa/assets-generator@^2.0.0 workbox-background-sync@^7.4.1 workbox-cacheable-response@^7.4.1 workbox-core@^7.4.1 workbox-expiration@^7.4.1 workbox-precaching@^7.4.1 workbox-routing@^7.4.1 workbox-strategies@^7.4.1
```

### Para qué sirve cada paquete

Todos van en `devDependencies`: solo se usan al compilar. El código de Workbox queda dentro de `sw.js`.

| Paquete | Para qué se usa |
|---|---|
| `vite-plugin-pwa` | Compila `src/sw.ts`, genera el manifest y registra el service worker |
| `@vite-pwa/assets-generator` | Genera los íconos de la PWA a partir de un SVG (`npm run pwa:icons`) |
| `workbox-precaching` | Guarda la aplicación (HTML, JS, CSS) para que abra sin red |
| `workbox-routing` | Decide qué regla de caché se aplica a cada petición |
| `workbox-strategies` | Estrategias de caché: red primero, solo red, caché con actualización |
| `workbox-expiration` | Limita cuánto y por cuánto tiempo se guarda (800 consultas, 24 h) |
| `workbox-cacheable-response` | Evita guardar respuestas con error |
| `workbox-background-sync` | Reenvía las compras offline al volver la red, aunque la pestaña esté cerrada |
| `workbox-core` | Base común; hace que una versión nueva del service worker se active sola |

## 3. Configuración que debe quedar en tu rama

El merge ya incluye todo esto. Compruébalo si resolviste conflictos en estos archivos:

| Archivo | Qué debe tener |
|---|---|
| `vite.config.ts` | `VitePWA({ strategies: 'injectManifest', srcDir: 'src', filename: 'sw.ts', ... })` con `devOptions.enabled: true` |
| `tsconfig.app.json` | `"vite-plugin-pwa/client"` en `types` |
| `src/main.tsx` | `registerSW` de `virtual:pwa-register` |
| `index.html` | `theme-color` y las etiquetas `apple-mobile-web-app-*` |
| `nginx.conf` | Sin caché agresiva para `sw.js`, `registerSW.js` y `manifest.webmanifest` |
| `src/core/http/httpClient.ts` | Los interceptores que encolan escrituras y aplican los cambios pendientes |
| `src/shared/components/layout/ProtectedLayout.tsx` | La precarga, el indicador "N sin enviar" y la franja "Sin conexión" |

No hay variables de entorno nuevas.

## 4. Código que se agrega

| Ubicación | Función |
|---|---|
| `src/sw.ts` | Service worker: caché y cola de compras offline |
| `src/core/offline/pedidosOfflineDb.ts` | IndexedDB de las compras de clientes |
| `src/core/offline/adminOfflineDb.ts` | IndexedDB del panel y cifrado de datos sensibles |
| `src/core/offline/colaEscrituras.ts` | Cola de cambios del panel y su envío |
| `src/core/offline/reglasOffline.ts` | Qué operaciones se pueden hacer sin red |
| `src/core/offline/estadoOffline.ts` | Progreso de la preparación y pantallas sin datos |
| `src/modules/electronico/offline/` | Compra y carrito sin conexión de la tienda |
| `src/modules/electronico/components/PedidosOffline.tsx` | Pantalla y avisos de la compra offline |
| `src/shared/components/layout/usePrecargaAdmin.ts` | Descarga los datos del panel |

**Si agregas un endpoint de escritura en el panel y quieres que funcione sin red, decláralo en `reglasOffline.ts`.** Lo que no esté ahí exige conexión.

## 5. Comprobar que funciona

1. Levanta primero el backend y luego el frontend:

   ```bash
   npm run dev
   ```

2. Inicia sesión como administrador y espera a que la cabecera diga **"Listo para usar sin conexión"**.
3. En DevTools → Network, cambia a **Offline** y navega por el menú sin recargar.
4. Crea o edita algo: debe aparecer "N sin enviar". Vuelve a **No throttling** y el contador debe llegar a cero.

Para probar la recarga sin red hace falta el build de producción:

```bash
npm run build
```

```bash
npm run preview
```

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| "El identificador local del pedido no es válido" | El backend ejecuta código antiguo | Reinícialo con los cambios integrados |
| "Estos datos no están disponibles sin conexión" | Se cortó la red antes de terminar la preparación | Vuelve a tener red y espera a "Listo" |
| Pantalla en blanco al recargar sin red con `npm run dev` | Vite no guarda sus módulos en caché | Es normal en desarrollo; prueba con `npm run preview` |
| Sigue el comportamiento anterior | El navegador conserva un service worker viejo | DevTools → Application → Service Workers → Unregister, y recarga |
| No funciona en un servidor publicado | El service worker y el cifrado exigen HTTPS | Publica con HTTPS; `localhost` es la única excepción |
