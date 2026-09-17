// Barrel: cada recurso del backend (controller) tiene su propio archivo
// `<recurso>.api.ts` con funciones puras (sin React) que llaman al httpClient
// compartido. Cuando el módulo crezca (usuarios, roles, permisos...), se
// agrega un archivo más aquí en vez de mezclar todo en uno solo.
export * from './auth.api'
