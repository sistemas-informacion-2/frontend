import { useAuthStore } from '@/core/store/authStore'

export function DashboardPage() {
  const perfil = useAuthStore((state) => state.perfil)

  return (
    <div>
      <h1 className="text-2xl font-semibold dark:text-white">Bienvenido, {perfil?.nombre}</h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        Rol: {perfil?.tipoUsuario === 'A' ? 'Administrador' : perfil?.tipoUsuario === 'E' ? 'Empleado' : 'Cliente'}
        {perfil?.sucursalNombre ? ` · Sucursal: ${perfil.sucursalNombre}` : ''}
      </p>
    </div>
  )
}
