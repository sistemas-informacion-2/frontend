import { useState } from 'react'
import useSWR from 'swr'
import { getApiErrorMessage } from '@/core/http/errors'
import { listarSucursales } from '@/modules/operaciones/services/sucursales.service'
import type { Frecuencia } from '../../bi.types'
import { obtenerPronostico, obtenerResumenModelos, obtenerSeccionModelo, type SeccionModelo } from '../../services/bi.service'
import { ModelosPageView, type PestanaModelo } from './ModelosPage.view'

const SECCIONES: Record<Exclude<PestanaModelo, 'pronostico'>, SeccionModelo> = {
  abandono: 'clientes-en-riesgo',
  segmentacion: 'segmentos',
  canasta: 'canasta',
  anomalias: 'anomalias',
  reposicion: 'sugerencia-compra',
}

/** Resultados de los modelos de machine learning, una pestania por modelo. No llama a Gemini. */
export function ModelosPage() {
  const [pestana, setPestana] = useState<PestanaModelo>('pronostico')
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('MENSUAL')
  const [sucursal, setSucursal] = useState('')
  const [nivel, setNivel] = useState('')

  const { data: resumen } = useSWR('bi-modelos', obtenerResumenModelos, { revalidateOnFocus: false })
  const { data: sucursales = [] } = useSWR('sucursales', listarSucursales, { revalidateOnFocus: false, shouldRetryOnError: false })

  const pronostico = useSWR(pestana === 'pronostico' ? ['bi-pronostico', frecuencia, sucursal] : null, () => obtenerPronostico(frecuencia, sucursal), { revalidateOnFocus: false, keepPreviousData: true })
  const seccion = pestana === 'pronostico' ? null : SECCIONES[pestana]
  const filtroSucursal = pestana === 'anomalias' || pestana === 'reposicion' ? sucursal : ''
  const filtroNivel = pestana === 'abandono' ? nivel : ''
  const resultado = useSWR(seccion ? ['bi-modelo', seccion, filtroSucursal, filtroNivel] : null, () => obtenerSeccionModelo(seccion as SeccionModelo, { sucursal: filtroSucursal, nivel: filtroNivel }), { revalidateOnFocus: false })

  const fallo = pronostico.error ?? resultado.error
  return (
    <ModelosPageView
      pestana={pestana}
      resumen={resumen}
      sucursales={sucursales}
      frecuencia={frecuencia}
      sucursal={sucursal}
      nivel={nivel}
      pronostico={pronostico.data}
      resultado={resultado.data}
      cargando={pronostico.isLoading || resultado.isLoading}
      error={fallo ? getApiErrorMessage(fallo, 'No se pudieron cargar los resultados.') : null}
      onPestana={setPestana}
      onFrecuencia={setFrecuencia}
      onSucursal={setSucursal}
      onNivel={setNivel}
    />
  )
}
