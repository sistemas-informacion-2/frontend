import type * as DecartSdk from '@decartai/sdk'
import { env } from '@/core/config/env'

const MODELO_PROBADOR = 'lucy-vton-3.5'

/** La key existe en el entorno; no garantiza que Decart la acepte. */
export const decartConfigurado = env.decartApiKey.length > 0

export interface ProbadorDecart {
  cliente: ReturnType<typeof DecartSdk.createDecartClient>
  modelo: DecartSdk.ModelDefinition<typeof MODELO_PROBADOR>
  fpsCaptura: number
}

let cache: Promise<ProbadorDecart> | null = null

/**
 * Crea el cliente bajo demanda. El SDK (y livekit-client) se importa dinámicamente para que
 * solo lo descargue quien abre el probador con IA, no toda la tienda.
 * Para migrar a tokens emitidos por el backend solo hay que cambiar este archivo.
 */
export function obtenerProbadorDecart(): Promise<ProbadorDecart> {
  cache ??= import('@decartai/sdk')
    .then((sdk) => {
      const modelo = sdk.models.realtime(MODELO_PROBADOR)
      return { cliente: sdk.createDecartClient({ apiKey: env.decartApiKey }), modelo, fpsCaptura: sdk.resolveFpsNumber(modelo.fps) }
    })
    .catch((error: unknown) => {
      // Un fallo de red al bajar el chunk no debe quedar cacheado para siempre.
      cache = null
      throw error
    })
  return cache
}
