import { useEmpresaStore } from '@/core/tenant/empresaStore'
import { useNombreTienda } from '@/core/tenant/useNombreTienda'

/** Logo de la tienda; sin logo cargado, un circulo con su inicial (con su color, si lo tiene). */
export function StoreLogoMarca({ className = '' }: { className?: string }) {
  const nombre = useNombreTienda()
  const logoUrl = useEmpresaStore((state) => state.empresa?.logoUrl)
  const color = useEmpresaStore((state) => state.empresa?.colorPrimario)

  if (logoUrl) {
    return <img src={logoUrl} alt="" aria-hidden="true" className={`h-8 w-8 shrink-0 rounded-lg object-cover ${className}`} />
  }
  return (
    <span
      aria-hidden="true"
      style={color ? { backgroundColor: color, color: '#fff' } : undefined}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-solid text-sm font-bold text-brand-on ${className}`}
    >
      {nombre.charAt(0)}
    </span>
  )
}

export function StoreLogo({ className = '' }: { className?: string }) {
  const nombre = useNombreTienda()
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <StoreLogoMarca />
      <span>{nombre}</span>
    </span>
  )
}
