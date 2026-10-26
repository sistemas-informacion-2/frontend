import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { useLocation } from 'react-router-dom'
import { getApiErrorMessage } from '@/core/http/errors'
import { useAppStore } from '@/core/store/appStore'
import { useAuthStore } from '@/core/store/authStore'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import type { FormatoExportacion, OrdenReporte, ReportRunRequest, ResultadoReporte } from '../../reportes.types'
import {
  crearPlantilla,
  descargarReporte,
  ejecutarReporte,
  eliminarPlantilla,
  actualizarPlantilla,
  listarPlantillas,
  obtenerCatalogoReportes,
} from '../../services/reportes.service'
import { ReportesConstructorPageView } from './ReportesConstructorPage.view'

const POR_DEFECTO: Record<string, Partial<ReportRunRequest>> = {
  VENTAS: {
    selectedFields: ['fecha_emision', 'sucursal', 'monto_total', 'cantidad'],
    sort: { campo: 'fecha_emision', direccion: 'desc' },
  },
  INVENTARIO: {
    selectedFields: ['sucursal', 'almacen', 'producto', 'stock_disponible'],
    sort: { campo: 'producto', direccion: 'asc' },
  },
  COMPRAS: {
    selectedFields: ['fecha_emision', 'proveedor', 'total', 'cantidad'],
    sort: { campo: 'fecha_emision', direccion: 'desc' },
  },
}

function requestPorDefecto(reportType: string): ReportRunRequest {
  const base = POR_DEFECTO[reportType] ?? {}
  return { reportType, selectedFields: [], filters: [], limit: 50, offset: 0, ...base }
}

function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

/**
 * CU18: Constructor QBE (Query By Example) — arma un reporte eligiendo fuente,
 * columnas, filtros, orden y paginación, sin escribir SQL. El catálogo de
 * campos permitidos viene siempre del backend (whitelist real).
 *
 * Si se llega desde el asistente generativo con un pedido para "ajustar a
 * mano" (`location.state.request`), arranca con esa configuración ya
 * cargada y ejecutada, en vez de la de VENTAS por defecto.
 */
export function ReportesConstructorPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const puedeGestionar = useAuthStore((state) => state.hasPermission('analitica:reportes:gestionar'))
  const sucursalActivaId = useAppStore((state) => state.sucursalActivaId)
  const location = useLocation()
  const requestInicial = (location.state as { request?: ReportRunRequest } | null)?.request

  const [request, setRequest] = useState<ReportRunRequest>(() => requestInicial ?? requestPorDefecto('VENTAS'))
  const [resultado, setResultado] = useState<ResultadoReporte | null>(null)
  const [ejecutando, setEjecutando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null)
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false)
  const [plantillaActivaId, setPlantillaActivaId] = useState<number | null>(null)

  const { data: catalogo } = useSWR(puedeGestionar ? 'catalogo-reportes' : null, obtenerCatalogoReportes)
  const { data: plantillas = [], mutate: mutarPlantillas } = useSWR(
    puedeGestionar ? 'plantillas-reportes' : null,
    listarPlantillas,
  )
  const { data: sucursales = [] } = useSWR(puedeGestionar ? 'sucursales-reportes' : null, listarSucursales)

  const tipoActivo = catalogo?.find((tipos) => tipos.id === request.reportType)

  const ejecutar = useCallback(async (config: ReportRunRequest) => {
    setEjecutando(true)
    setError(null)
    try {
      const resul = await ejecutarReporte(config)
      setResultado(resul)
      setRequest(config)
    } catch (err) {
      setResultado(null)
      setError(getApiErrorMessage(err, 'No se pudo generar el reporte.'))
    } finally {
      setEjecutando(false)
    }
  }, [])

  // Si llegamos desde el asistente generativo con una config lista ("Ajustar en el Constructor"),
  // la ejecutamos una sola vez al montar (el ref evita repetirlo por el doble-render de StrictMode).
  const yaEjecutoInicial = useRef(false)
  useEffect(() => {
    if (requestInicial && !yaEjecutoInicial.current) {
      yaEjecutoInicial.current = true
      void ejecutar(requestInicial)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const combinar = useCallback(
    (parche: Partial<ReportRunRequest>) => {
      setRequest((actual) => {
        const siguiente = { ...actual, ...parche }
        if (parche.selectedFields && siguiente.sort?.campo) {
          const campos = catalogo?.find((tipos) => tipos.id === siguiente.reportType)?.campos ?? []
          const sortCampo = campos.find((c) => c.name === siguiente.sort?.campo)
          const conMedidas = siguiente.selectedFields.some((name) => campos.find((c) => c.name === name)?.categoria === 'MEASURE')
          const ordenValido =
            !sortCampo || sortCampo.categoria === 'MEASURE' || siguiente.selectedFields.includes(sortCampo.name)
          if (conMedidas && sortCampo && !ordenValido) {
            return { ...siguiente, sort: undefined }
          }
        }
        return siguiente
      })
    },
    [catalogo],
  )

  const aplicar = useCallback(() => {
    setPlantillaActivaId(null)
    void ejecutar({ ...request, offset: 0 })
  }, [ejecutar, request])

  const cambiarPagina = useCallback(
    (pagina: number) => {
      void ejecutar({ ...request, offset: (pagina - 1) * (request.limit ?? 50) })
    },
    [ejecutar, request],
  )

  const cambiarTipo = useCallback(
    (reportType: string) => {
      const nueva = requestPorDefecto(reportType)
      setResultado(null)
      setPlantillaActivaId(null)
      setRequest(nueva)
      void ejecutar(nueva)
    },
    [ejecutar],
  )

  const nuevoReporte = useCallback(() => {
    setResultado(null)
    setPlantillaActivaId(null)
    setRequest(requestPorDefecto('VENTAS'))
  }, [])

  const exportar = useCallback(
    async (formato: FormatoExportacion) => {
      if (!request.selectedFields.length || exportando) return
      setExportando(formato)
      setError(null)
      try {
        const { blob, nombreArchivo } = await descargarReporte(formato, request)
        descargarBlob(blob, nombreArchivo)
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo generar la descarga.'))
      } finally {
        setExportando(null)
      }
    },
    [exportando, request],
  )

  const guardarPlantilla = useCallback(
    async (nombre: string) => {
      if (guardandoPlantilla) return
      setGuardandoPlantilla(true)
      setError(null)
      try {
        const config = { ...request, offset: 0 }
        if (plantillaActivaId !== null) {
          const plantilla = await actualizarPlantilla(plantillaActivaId, nombre, config)
          setPlantillaActivaId(plantilla.id)
        } else {
          const plantilla = await crearPlantilla(nombre, config)
          setPlantillaActivaId(plantilla.id)
        }
        await mutarPlantillas()
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo guardar la plantilla.'))
        return
      } finally {
        setGuardandoPlantilla(false)
      }
    },
    [guardandoPlantilla, mutarPlantillas, plantillaActivaId, request],
  )

  const cargarPlantilla = useCallback(
    (id: number) => {
      const plantilla = plantillas.find((p) => p.id === id)
      if (!plantilla) return
      setPlantillaActivaId(id)
      void ejecutar(plantilla.config)
    },
    [ejecutar, plantillas],
  )

  const borrarPlantilla = useCallback(
    async (id: number) => {
      try {
        await eliminarPlantilla(id)
        if (plantillaActivaId === id) setPlantillaActivaId(null)
        await mutarPlantillas()
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo eliminar la plantilla.'))
      }
    },
    [mutarPlantillas, plantillaActivaId],
  )

  const centroNombre = sucursalActivaId === null ? null : (sucursales.find((s) => s.id === sucursalActivaId)?.nombre ?? null)

  return (
    <ReportesConstructorPageView
      nombre={perfil?.nombre ?? ''}
      subtitulo={`Rol: ${perfil?.tipoUsuario === 'A' ? 'Administrador' : perfil?.tipoUsuario === 'E' ? 'Empleado' : 'Cliente'}${
        centroNombre ? ` · ${centroNombre}` : ''
      }`}
      puedeGestionar={puedeGestionar}
      catalogo={catalogo}
      tipoActivo={tipoActivo}
      request={request}
      resultado={resultado}
      ejecutando={ejecutando}
      error={error}
      plantillas={plantillas}
      plantillaActivaId={plantillaActivaId}
      exportando={exportando}
      guardandoPlantilla={guardandoPlantilla}
      onCombinar={combinar}
      onAplicar={aplicar}
      onCambiarTipo={cambiarTipo}
      onNuevoReporte={nuevoReporte}
      onCambiarPagina={cambiarPagina}
      onFiltroPatch={(indice, parche) => {
        setRequest((actual) => {
          const filtros = [...(actual.filters ?? [])]
          filtros[indice] = { ...filtros[indice], ...parche }
          return { ...actual, filters: filtros }
        })
      }}
      onFiltroAgregar={(filtro) => setRequest((actual) => ({ ...actual, filters: [...(actual.filters ?? []), filtro] }))}
      onFiltroBorrar={(indice) =>
        setRequest((actual) => ({ ...actual, filters: (actual.filters ?? []).filter((_, i) => i !== indice) }))
      }
      onOrdenChange={(orden?: OrdenReporte) => setRequest((actual) => ({ ...actual, sort: orden }))}
      onFechasChange={(desde?: string, hasta?: string) =>
        setRequest((actual) => ({
          ...actual,
          dateFrom: desde || undefined,
          dateTo: hasta || undefined,
        }))
      }
      onLimiteChange={(limite) => setRequest((actual) => ({ ...actual, limit: limite, offset: 0 }))}
      onExportar={(formato) => void exportar(formato)}
      onGuardarPlantilla={(nombre) => void guardarPlantilla(nombre)}
      onCargarPlantilla={cargarPlantilla}
      onEliminarPlantilla={(id) => void borrarPlantilla(id)}
      onLimpiarError={() => setError(null)}
    />
  )
}
