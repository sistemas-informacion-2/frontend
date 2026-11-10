import { isAxiosError } from 'axios'
import { useEffect } from 'react'
import { httpClient } from '@/core/http/httpClient'
import { useEstadoOffline } from '@/core/offline/estadoOffline'
import { useAuthStore } from '@/core/store/authStore'
import { listarCompras } from '@/modules/comercial/services/compras.service'
import { listarDevoluciones } from '@/modules/comercial/services/devoluciones.service'
import { listarVentas } from '@/modules/comercial/services/ventas.service'
import { listarReservas } from '@/modules/electronico/api/reservas.api'
import { listarVentasEnLinea } from '@/modules/electronico/api/ventasEnLinea.api'
import { listarAlmacenes } from '@/modules/inventario/services/almacenes.service'
import { listarStock } from '@/modules/inventario/services/inventario.service'
import { listarProductos } from '@/modules/inventario/services/productos.service'
import { listarEmpleados } from '@/modules/operaciones/services/empleados.service'
import { obtenerResumenDashboard } from '@/modules/reporte/services/dashboard.service'
import { ejecutarReportePredefinido, fechaPredefinidoGuardado, listarReportesPredefinidos } from '@/modules/reporte/services/reportes.service'

/**
 * Lo que pide cada pantalla al abrirse, sin filtros. Deben ser las mismas URLs: el Service Worker guarda por URL exacta.
 */
const PANTALLAS: { permiso?: string; urls: string[] }[] = [
  { urls: ['/analitica/dashboard/resumen?dias=7', '/acceso/perfil', '/electronico/notificaciones/mias/no-leidas'] },
  { permiso: 'acceso:bitacora:leer', urls: ['/acceso/bitacora?page=1&limit=10'] },
  { permiso: 'acceso:roles:gestionar', urls: ['/acceso/roles?activo=true', '/acceso/permisos'] },
  { permiso: 'acceso:usuarios:gestionar', urls: ['/acceso/usuarios?page=1&limit=10&activo=true', '/acceso/roles?activo=true'] },
  { permiso: 'acceso:clientes:gestionar', urls: ['/operaciones/clientes?page=1&limit=10&activo=true'] },
  { permiso: 'operaciones:empleados:gestionar', urls: ['/operaciones/empleados?page=1&limit=10&activo=true', '/operaciones/sucursales'] },
  { permiso: 'operaciones:sucursales:gestionar', urls: ['/operaciones/ciudades', '/operaciones/departamentos', '/operaciones/sucursales'] },
  { permiso: 'inventario:categorias:gestionar', urls: ['/inventario/categorias/todas', '/inventario/temporadas'] },
  { permiso: 'inventario:productos:gestionar', urls: ['/inventario/productos/todas?page=1&limit=12&activo=true', '/inventario/categorias/todas', '/operaciones/sucursales'] },
  { permiso: 'inventario:proveedores:gestionar', urls: ['/inventario/proveedores?activo=true', '/inventario/proveedores'] },
  { permiso: 'inventario:temporadas:gestionar', urls: ['/inventario/temporadas'] },
  {
    permiso: 'inventario:almacen:gestionar',
    urls: ['/inventario/almacenes', '/inventario/stock?page=1&limit=10', '/inventario/almacenes?activo=true', '/inventario/productos/todas?page=1&limit=100', '/operaciones/sucursales'],
  },
  { permiso: 'comercial:pasarelas:gestionar', urls: ['/comercial/pasarelas'] },
  { permiso: 'comercial:compras:gestionar', urls: ['/comercial/compras?page=1&limit=10', '/inventario/proveedores?activo=true', '/operaciones/sucursales'] },
  {
    permiso: 'comercial:ventas:gestionar',
    urls: ['/comercial/ventas?page=1&limit=10', '/operaciones/sucursales', '/operaciones/clientes?page=1&limit=100&activo=true', '/comercial/pasarelas/presencial'],
  },
  { permiso: 'electronico:ventas:leer', urls: ['/electronico/ventas?page=1&limit=10', '/operaciones/sucursales'] },
  { permiso: 'electronico:reservas:gestionar', urls: ['/electronico/reservas?page=1&limit=10', '/operaciones/sucursales', '/operaciones/clientes?page=1&limit=100&activo=true', '/comercial/pasarelas/presencial'] },
  { permiso: 'comercial:devoluciones:gestionar', urls: ['/comercial/devoluciones?page=1&limit=10', '/operaciones/sucursales', '/comercial/pasarelas/presencial'] },
  { permiso: 'electronico:notificaciones:gestionar', urls: ['/electronico/notificaciones?page=1&limit=10', '/electronico/notificaciones/destinatarios'] },
  { permiso: 'analitica:reportes:gestionar', urls: ['/reports/predefinidos', '/reports/catalog', '/reports/templates', '/operaciones/sucursales'] },
]

type Tarea = () => Promise<unknown>
type Permiso = (accion: string) => boolean

const DESCARGAS_SIMULTANEAS = 3
const ESPERA_INICIAL_MS = 2000
const MAX_SUCURSALES = 10
/** Cada reporte predefinido se recalcula como mucho cada 6 horas: son consultas pesadas y quedan en la bitacora. */
const VIGENCIA_REPORTE_MS = 6 * 60 * 60 * 1000

/**
 * Las listas filtradas por sucursal. Se piden con los mismos servicios y valores que usa cada pantalla, para que la URL
 * sea identica a la que pedira sin conexion.
 */
function tareasDeSucursal(id: number, puede: Permiso): Tarea[] {
  const tareas: Tarea[] = []
  const agregar = (permiso: string, ...nuevas: Tarea[]) => {
    if (puede(permiso)) tareas.push(...nuevas)
  }
  const pagina = { page: 1, limit: 10, idSucursal: id }
  const stockDeVenta = () => listarStock({ page: 1, limit: 100, idSucursal: id })
  const almacenesActivos = () => listarAlmacenes({ idSucursal: id, activo: true })

  agregar('analitica:reportes:gestionar', () => obtenerResumenDashboard({ idSucursal: id, dias: 7 }))
  agregar('comercial:ventas:gestionar', () => listarVentas(pagina), stockDeVenta)
  agregar('comercial:compras:gestionar', () => listarCompras(pagina), almacenesActivos, () => listarProductos({ page: 1, limit: 100, idSucursal: id, activo: true }))
  agregar('comercial:devoluciones:gestionar', () => listarDevoluciones(pagina), almacenesActivos, () => listarEmpleados({ page: 1, limit: 100, idSucursal: id, activo: true }))
  agregar('electronico:reservas:gestionar', () => listarReservas(pagina), stockDeVenta)
  agregar('electronico:ventas:leer', () => listarVentasEnLinea(pagina))
  agregar('inventario:almacen:gestionar', () => listarStock(pagina), () => listarAlmacenes({ idSucursal: id }))
  agregar('inventario:productos:gestionar', () => listarProductos({ page: 1, limit: 12, idSucursal: id, activo: true }))
  agregar('operaciones:empleados:gestionar', () => listarEmpleados({ ...pagina, activo: true }))
  agregar('comercial:caja:gestionar', () => httpClient.get(`/comercial/cajas/abierta?idSucursal=${id}`), () => httpClient.get(`/comercial/cajas?idSucursal=${id}`))
  return tareas
}

async function sucursalesPermitidas(idPropia: number | undefined, puede: Permiso): Promise<number[]> {
  if (!puede('operaciones:sucursales:gestionar')) return idPropia ? [idPropia] : []
  const respuesta = await httpClient.get<{ data: { id: number }[] }>('/operaciones/sucursales').catch(() => null)
  return respuesta?.data.data.map((sucursal) => sucursal.id).slice(0, MAX_SUCURSALES) ?? (idPropia ? [idPropia] : [])
}

async function tareasDeReportes(): Promise<Tarea[]> {
  const predefinidos = await listarReportesPredefinidos().catch(() => [])
  return predefinidos.map(({ codigo }) => async () => {
    const guardado = await fechaPredefinidoGuardado(codigo)
    if (!guardado || Date.now() - new Date(guardado).getTime() >= VIGENCIA_REPORTE_MS) await ejecutarReportePredefinido(codigo)
  })
}

/** Un 403 o 404 es una respuesta valida: solo cuenta como fallo si no hubo respuesta o fallo el servidor. */
function fueCorrecta(error: unknown): boolean {
  return isAxiosError(error) && !!error.response && error.response.status < 500
}

/**
 * Con red, descarga en segundo plano lo que este usuario puede abrir, para que sin conexion se vea aunque no lo haya
 * visitado: cerrar sesion borra la cache de la API, asi que tras cada inicio de sesion empieza vacia.
 */
export function usePrecargaAdmin(enLinea: boolean) {
  const idUsuario = useAuthStore((state) => state.perfil?.id ?? null)
  const idSucursalPropia = useAuthStore((state) => state.perfil?.sucursalId)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  useEffect(() => {
    if (!enLinea || idUsuario === null) return

    const estado = useEstadoOffline.getState()
    const urls = [...new Set(PANTALLAS.filter((pantalla) => !pantalla.permiso || hasPermission(pantalla.permiso)).flatMap((pantalla) => pantalla.urls))]
    const pendientes: Tarea[] = urls.map((url) => () => httpClient.get(url))
    let cancelado = false
    let enCurso = false

    const trabajar = async () => {
      while (!cancelado) {
        const tarea = pendientes.shift()
        if (!tarea) return
        try {
          await tarea()
          estado.completarTarea(true)
        } catch (error) {
          estado.completarTarea(fueCorrecta(error))
        }
      }
    }

    const precargar = async () => {
      enCurso = true
      estado.iniciarPreparacion()
      const sucursales = await sucursalesPermitidas(idSucursalPropia, hasPermission)
      pendientes.push(...sucursales.flatMap((id) => tareasDeSucursal(id, hasPermission)))
      if (hasPermission('analitica:reportes:gestionar')) pendientes.push(...(await tareasDeReportes()))
      if (cancelado) return
      estado.sumarTareas(pendientes.length)
      await Promise.all(Array.from({ length: DESCARGAS_SIMULTANEAS }, trabajar))
      if (cancelado) return
      enCurso = false
      estado.terminarPreparacion(false)
    }

    // Se espera a que la pantalla abierta termine de cargar lo suyo.
    const temporizador = window.setTimeout(() => void precargar(), ESPERA_INICIAL_MS)
    return () => {
      cancelado = true
      window.clearTimeout(temporizador)
      if (enCurso) estado.terminarPreparacion(true)
    }
  }, [enLinea, idUsuario, idSucursalPropia, hasPermission])
}
