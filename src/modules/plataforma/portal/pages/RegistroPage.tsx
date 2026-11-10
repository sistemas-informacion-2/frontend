import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { getApiErrorMessage } from '@/core/http/errors'
import { guardarSesionDeTienda } from '@/core/tenant/sesionDeTienda'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { iniciarSesionEnTienda, listarPlanes, registrarEmpresa, revisarSlug } from '../api/portal.api'
import { PlanCard } from '../components/PlanCard'
import { clasesBotonPlan } from '../utils/estilos'
import { EncabezadoPaso } from '../components/registro/EncabezadoPaso'
import { PasoAdministrador } from '../components/registro/PasoAdministrador'
import { PasoEmpresa, type EstadoSlug } from '../components/registro/PasoEmpresa'
import { TiendaLista } from '../components/registro/TiendaLista'
import type { AdministradorRegistro, CodigoPlan, EmpresaRegistro, SlugDisponible, TiendaCreada } from '../types'
import { formatoBs, limitesDelPlan, limpiarMensaje, periodoDelPlan, sugerirSlug } from '../utils/formato'
import {
  ADMIN_VACIO,
  EMPRESA_VACIA,
  borrarBorrador,
  guardarBorrador,
  leerBorrador,
  validarAdministrador,
  validarEmpresa,
  type Errores,
} from '../utils/registro'

type Paso = 1 | 2 | 3

const CODIGOS: CodigoPlan[] = ['PRUEBA', 'EMPRENDEDOR', 'PROFESIONAL', 'EMPRESARIAL']

const TEXTOS: Record<Paso, { titulo: string; texto: string }> = {
  1: { titulo: 'Elige tu plan', texto: 'Empieza gratis o elige el plan que necesitas. Puedes cambiarlo cuando quieras.' },
  2: { titulo: 'Datos de tu empresa', texto: 'Configura la información legal y operativa de tu empresa, y la dirección de tu tienda.' },
  3: {
    titulo: 'Asignación del administrador',
    texto: 'Este usuario será el administrador general de tu tienda, con permisos completos para gestionar usuarios, sucursales, inventario y caja.',
  },
}

/**
 * Registro de una empresa en 3 pasos: plan, datos de la empresa y administrador. La prueba gratuita crea la tienda
 * al instante (y deja la sesion iniciada); un plan de pago lleva a Stripe y la tienda se crea al volver.
 */
export function RegistroPage() {
  const [params] = useSearchParams()
  const pagoCancelado = params.get('pago') === 'cancelado'
  const planDeLaUrl = CODIGOS.find((codigo) => codigo === params.get('plan')) ?? null
  // Si volvio de Stripe sin pagar, se recupera lo que habia llenado (menos la contrasena).
  const [borrador] = useState(() => (pagoCancelado ? leerBorrador() : null))

  const { data: planes, isLoading: cargandoPlanes } = useSWR('portal/planes', listarPlanes, { revalidateOnFocus: false })
  const [codigoPlan, setCodigoPlan] = useState<CodigoPlan | null>(borrador?.codigoPlan ?? planDeLaUrl)
  const [paso, setPaso] = useState<Paso>(borrador ? 3 : planDeLaUrl ? 2 : 1)
  const [empresa, setEmpresa] = useState<EmpresaRegistro>(borrador?.empresa ?? EMPRESA_VACIA)
  const [slugEditado, setSlugEditado] = useState(borrador?.slugEditado ?? false)
  const [admin, setAdmin] = useState<AdministradorRegistro>(borrador ? { ...borrador.admin, password: '' } : ADMIN_VACIO)
  const [mostrarErrores, setMostrarErrores] = useState(false)
  const [revisado, setRevisado] = useState<SlugDisponible | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creada, setCreada] = useState<{ tienda: TiendaCreada; sesionIniciada: boolean } | null>(null)

  const plan = planes?.find((candidato) => candidato.codigo === codigoPlan) ?? null
  const pasoActual: Paso = plan ? paso : 1

  // La direccion de la tienda se revisa en vivo, 400 ms despues de que deja de escribir.
  useEffect(() => {
    if (empresa.slug.length < 3) return
    const slug = empresa.slug
    const espera = window.setTimeout(() => {
      revisarSlug(slug)
        .then(setRevisado)
        .catch(() => setRevisado({ slug, disponible: true, motivo: null }))
    }, 400)
    return () => window.clearTimeout(espera)
  }, [empresa.slug])

  const estadoSlug: EstadoSlug =
    empresa.slug.length < 3
      ? { estado: 'vacio' }
      : revisado?.slug !== empresa.slug
        ? { estado: 'revisando' }
        : { estado: revisado.disponible ? 'libre' : 'ocupado', motivo: revisado.motivo }

  const erroresEmpresa: Errores<EmpresaRegistro> = mostrarErrores ? validarEmpresa(empresa) : {}
  const erroresAdmin: Errores<AdministradorRegistro> = mostrarErrores ? validarAdministrador(admin) : {}

  const cambiarEmpresa = (campo: keyof EmpresaRegistro, valor: string) => {
    setEmpresa((actual) => {
      const siguiente = { ...actual, [campo]: valor }
      // Mientras no la edite a mano, la direccion de la tienda sigue al nombre comercial (o a la razon social).
      if (campo !== 'slug' && !slugEditado && (campo === 'nombreComercial' || campo === 'razonSocial')) {
        siguiente.slug = sugerirSlug(siguiente.nombreComercial || siguiente.razonSocial)
      }
      return siguiente
    })
    if (campo === 'slug') setSlugEditado(true)
  }

  const irA = (destino: Paso) => {
    setPaso(destino)
    setMostrarErrores(false)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const elegirPlan = (codigo: CodigoPlan) => {
    setCodigoPlan(codigo)
    irA(2)
  }

  const continuarConEmpresa = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (Object.keys(validarEmpresa(empresa)).length > 0 || estadoSlug.estado === 'ocupado') {
      setMostrarErrores(true)
      return
    }
    irA(3)
  }

  const crearTienda = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!plan) return
    if (Object.keys(validarAdministrador(admin)).length > 0) {
      setMostrarErrores(true)
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const respuesta = await registrarEmpresa({
        codigoPlan: plan.codigo,
        empresa: {
          razonSocial: empresa.razonSocial.trim(),
          nombreComercial: empresa.nombreComercial.trim() || undefined,
          nit: empresa.nit.trim(),
          pais: empresa.pais,
          ciudad: empresa.ciudad.trim(),
          direccion: empresa.direccion.trim() || undefined,
          telefono: empresa.telefono.trim() || undefined,
          slug: empresa.slug,
        },
        admin: {
          nombre: admin.nombre.trim(),
          apellido: admin.apellido.trim(),
          email: admin.email.trim(),
          telefono: admin.telefono.trim() || undefined,
          password: admin.password,
        },
      })

      if (respuesta.urlPago) {
        const adminSinClave = { nombre: admin.nombre, apellido: admin.apellido, email: admin.email, telefono: admin.telefono }
        guardarBorrador({ codigoPlan: plan.codigo, empresa, admin: adminSinClave, slugEditado })
        window.location.assign(respuesta.urlPago)
        return
      }
      if (respuesta.tienda) {
        borrarBorrador()
        let sesionIniciada = false
        try {
          guardarSesionDeTienda(respuesta.tienda.slug, await iniciarSesionEnTienda(respuesta.tienda.slug, admin.email.trim(), admin.password))
          sesionIniciada = true
        } catch {
          // La tienda ya existe: si el login automatico falla, el boton lleva a Ingresar.
        }
        setCreada({ tienda: respuesta.tienda, sesionIniciada })
        window.scrollTo({ top: 0 })
      }
    } catch (err) {
      const mensaje = limpiarMensaje(getApiErrorMessage(err, 'No se pudo crear la tienda. Intenta nuevamente.'))
      // Un problema con la direccion de la tienda o el NIT se corrige en el paso 2.
      if (/dirección|NIT|raz[oó]n social|ciudad/i.test(mensaje)) setPaso(2)
      setError(mensaje)
      setEnviando(false)
    }
  }

  if (creada) return <TiendaLista tienda={creada.tienda} sesionIniciada={creada.sesionIniciada} />

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {pagoCancelado && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200" role="status">
          Cancelaste el pago, así que no se creó la tienda ni se cobró nada. Tus datos siguen aquí: vuelve a escribir la contraseña para continuar.
        </p>
      )}

      {pasoActual === 1 ? (
        <>
          <EncabezadoPaso paso={1} {...TEXTOS[1]} />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {cargandoPlanes && Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-[32rem] w-full rounded-2xl" />)}
            {planes?.map((candidato) => (
              <PlanCard
                key={candidato.codigo}
                plan={candidato}
                seleccionado={candidato.codigo === codigoPlan}
                accion={
                  <button type="button" onClick={() => elegirPlan(candidato.codigo)} className={clasesBotonPlan(candidato.destacado || candidato.codigo === codigoPlan)}>
                    {candidato.esPrueba ? 'Probar 7 días gratis' : `Elegir ${candidato.nombre}`}
                  </button>
                }
              />
            ))}
          </div>
        </>
      ) : (
        plan && (
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <form
              onSubmit={pasoActual === 2 ? continuarConEmpresa : crearTienda}
              noValidate
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <EncabezadoPaso paso={pasoActual} {...TEXTOS[pasoActual]} />
              <div className="mt-8">
                {pasoActual === 2 ? (
                  <PasoEmpresa empresa={empresa} errores={erroresEmpresa} estadoSlug={estadoSlug} onCampo={cambiarEmpresa} />
                ) : (
                  <PasoAdministrador admin={admin} errores={erroresAdmin} plan={plan} onCampo={(campo, valor) => setAdmin((actual) => ({ ...actual, [campo]: valor }))} />
                )}
              </div>

              {error && (
                <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
                  {error}
                </p>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => irA(pasoActual === 2 ? 1 : 2)}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  ← {pasoActual === 2 ? 'Cambiar de plan' : 'Volver a los datos de la empresa'}
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {pasoActual === 2
                    ? 'Continuar'
                    : enviando
                      ? plan.esPrueba
                        ? 'Creando tu tienda…'
                        : 'Abriendo el pago…'
                      : plan.esPrueba
                        ? 'Crear mi tienda'
                        : `Ir a pagar ${formatoBs(plan.precio)}`}
                </button>
              </div>
            </form>

            <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-5 lg:sticky lg:top-24 dark:border-neutral-800 dark:bg-neutral-900/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Tu plan</p>
              <p className="mt-2 text-lg font-semibold">{plan.nombre}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {formatoBs(plan.precio)} <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">/ {periodoDelPlan(plan)}</span>
              </p>
              <ul className="mt-4 flex flex-col gap-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                {limitesDelPlan(plan).map((limite) => (
                  <li key={limite}>· {limite}</li>
                ))}
                <li>· {plan.reportesAvanzados ? 'Con' : 'Sin'} reportes avanzados</li>
                <li>· {plan.bi ? 'Con' : 'Sin'} BI con inteligencia artificial</li>
              </ul>
              <button type="button" onClick={() => irA(1)} className="mt-5 text-sm font-medium underline">
                Cambiar de plan
              </button>
            </aside>
          </div>
        )
      )}
    </section>
  )
}
