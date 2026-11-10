import { create } from 'zustand'

export type EstadoEmpresa = 'ACTIVA' | 'SUSPENDIDA'

/** Lo que el backend expone de una tienda sin token (GET /plataforma/empresas/:slug/publico). */
export interface EmpresaPublica {
  slug: string
  nombre: string
  logoUrl: string | null
  colorPrimario: string | null
  estado: EstadoEmpresa
  /** false si el plan de DOMINATR vencio (pasada la gracia): la tienda publica no se muestra; el panel si, para renovar. */
  planVigente: boolean
}

interface EmpresaState {
  /** Tienda actual ya resuelta por TiendaGate; null mientras carga o en el panel de plataforma. */
  empresa: EmpresaPublica | null
  setEmpresa: (empresa: EmpresaPublica) => void
}

export const useEmpresaStore = create<EmpresaState>()((set) => ({
  empresa: null,
  setEmpresa: (empresa) => set({ empresa }),
}))
