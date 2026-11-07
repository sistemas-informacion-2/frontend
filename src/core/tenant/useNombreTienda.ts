import { env } from '@/core/config/env'
import { useEmpresaStore } from './empresaStore'

/** Nombre a mostrar: el de la tienda actual o, fuera de una tienda (panel de plataforma), el de la app. */
export function useNombreTienda(): string {
  return useEmpresaStore((state) => state.empresa?.nombre) ?? env.appName
}
