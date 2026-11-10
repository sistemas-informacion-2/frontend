import type { ComponentType, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import { NOMBRE_PLATAFORMA } from '@/modules/plataforma/marca'
import { Skeleton } from '@/shared/components/ui/Skeleton'
import { listarPlanes } from '../api/portal.api'
import { IconoCaja, IconoCompras, IconoEscudo, IconoFlecha, IconoIA, IconoInventario, IconoReportes, IconoTienda } from '../components/Iconos'
import { PlanCard } from '../components/PlanCard'
import { clasesBotonPlan } from '../utils/estilos'

interface Funcion {
  icono: ComponentType<SVGProps<SVGSVGElement>>
  titulo: string
  texto: string
}

/** Solo lo que el sistema hace hoy. */
const FUNCIONES: Funcion[] = [
  { icono: IconoTienda, titulo: 'Tienda en línea', texto: 'Catálogo con tallas, colores y temporadas. Tus clientes compran y pagan con tarjeta o QR, o reservan y pagan un anticipo.' },
  { icono: IconoCaja, titulo: 'Mostrador y caja', texto: 'Ventas presenciales con descuentos, apertura y cierre de caja con arqueo, y devoluciones ligadas a la venta.' },
  { icono: IconoInventario, titulo: 'Inventario con kardex', texto: 'Stock por almacén, transferencias entre almacenes y el historial de cada movimiento, con su costo.' },
  { icono: IconoCompras, titulo: 'Compras y proveedores', texto: 'Registra compras y el costo promedio de cada prenda se actualiza solo: así sabes tu margen real.' },
  { icono: IconoReportes, titulo: 'Reportes', texto: 'Dashboard, reportes listos para usar y un constructor de reportes a medida que exporta a PDF y Excel.' },
  { icono: IconoIA, titulo: 'Inteligencia artificial', texto: 'Pide reportes en lenguaje natural y pregunta a tu asistente de BI: pronóstico de ventas y sugerencia de compra.' },
]

const PASOS = [
  { titulo: 'Elige tu plan', texto: 'Empieza con 7 días gratis, sin tarjeta, o elige el plan que necesitas.' },
  { titulo: 'Registra tu empresa', texto: 'Datos legales, la dirección de tu tienda y tu usuario administrador.' },
  { titulo: 'Empieza a vender', texto: 'Tu tienda queda lista al instante, con roles, métodos de pago y categorías.' },
]

const PREGUNTAS = [
  { pregunta: '¿Necesito tarjeta para la prueba gratuita?', respuesta: 'No. La prueba dura 7 días, incluye todas las funciones y no te pide tarjeta. Al terminar, eliges un plan de pago desde Mi plan.' },
  { pregunta: '¿Qué pasa cuando vence mi plan?', respuesta: 'Tienes 3 días de gracia en los que la tienda sigue operando. Después, solo queda abierta la página Mi plan para que renueves. No se borra ningún dato.' },
  { pregunta: '¿Puedo cambiar de plan?', respuesta: 'Sí, cuando quieras, desde Mi plan. El nuevo plan empieza el día del pago. Si bajas de plan no se borra nada, pero no podrás crear más sucursales, almacenes o usuarios hasta estar dentro del nuevo límite.' },
  { pregunta: '¿Mis datos están separados de los de otras tiendas?', respuesta: 'Sí. Cada consulta del sistema se filtra por tu empresa: ningún otro cliente puede ver tus productos, ventas ni clientes.' },
  { pregunta: '¿En qué moneda pago?', respuesta: 'Los precios están en bolivianos. El pago se hace con tarjeta a través de Stripe, que cobra el equivalente en dólares.' },
  { pregunta: '¿Puedo administrar varias tiendas con el mismo correo?', respuesta: 'Sí. Al ingresar con tu correo y contraseña, eliges a cuál de tus tiendas entrar.' },
]

export function LandingPage() {
  const { data: planes, error, isLoading } = useSWR('portal/planes', listarPlanes, { revalidateOnFocus: false })

  return (
    <>
      {/* Portada */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(0_0_0/0.06),transparent)] dark:bg-[radial-gradient(60%_50%_at_50%_0%,rgb(255_255_255/0.08),transparent)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div className="animate-aparecer">
            <p className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Para tiendas de ropa en Bolivia
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Vende en línea y en tu tienda, con un solo sistema.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
              {NOMBRE_PLATAFORMA} une tu tienda en línea, el mostrador, la caja y el inventario. Con reportes e inteligencia
              artificial para decidir qué comprar y cuándo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/registro?plan=PRUEBA" className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                Probar 7 días gratis
                <IconoFlecha className="h-4 w-4" />
              </Link>
              <a href="#planes" className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-5 py-3 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900">
                Ver planes
              </a>
            </div>
            <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">Sin tarjeta. Tu tienda queda lista en un minuto.</p>
          </div>

          <VistaPrevia />
        </div>
      </section>

      {/* Funciones */}
      <section id="funciones" className="scroll-mt-20 border-t border-neutral-200 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Encabezado antetitulo="Funciones" titulo="Todo lo que tu tienda necesita para operar" texto="Un solo sistema para vender, cobrar, reponer y entender tu negocio." />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCIONES.map(({ icono: Icono, titulo, texto }) => (
              <article key={titulo} className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  <Icono className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Encabezado antetitulo="Planes" titulo="Elige cómo empezar" texto="Precios en bolivianos. Cambia de plan cuando lo necesites." />
          {error && <p className="mt-10 text-center text-sm text-red-600 dark:text-red-400">No se pudieron cargar los planes. Recarga la página.</p>}
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {isLoading &&
              Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-[34rem] w-full rounded-2xl" />)}
            {planes?.map((plan) => (
              <PlanCard
                key={plan.codigo}
                plan={plan}
                accion={
                  <Link to={`/registro?plan=${plan.codigo}`} className={clasesBotonPlan(plan.destacado)}>
                    {plan.esPrueba ? 'Probar 7 días gratis' : `Comenzar con ${plan.nombre}`}
                  </Link>
                }
              />
            ))}
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
            <IconoEscudo className="h-4 w-4 shrink-0" />
            Tus datos, solo tuyos: cada consulta del sistema se filtra por tu empresa.
          </p>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-20 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Encabezado antetitulo="Cómo funciona" titulo="Tu tienda, lista en tres pasos" />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {PASOS.map((paso, indice) => (
              <li key={paso.titulo} className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <span className="text-sm font-bold text-neutral-400">0{indice + 1}</span>
                <h3 className="mt-2 font-semibold">{paso.titulo}</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Preguntas */}
      <section id="preguntas" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Encabezado antetitulo="Preguntas frecuentes" titulo="Lo que suelen preguntarnos" />
          <div className="mt-10 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {PREGUNTAS.map(({ pregunta, respuesta }) => (
              <details key={pregunta} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                  {pregunta}
                  <span aria-hidden="true" className="shrink-0 text-neutral-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{respuesta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 rounded-3xl bg-neutral-900 px-6 py-14 text-center text-white dark:bg-white dark:text-neutral-900">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Abre tu tienda hoy y pruébala 7 días gratis.</h2>
          <p className="max-w-xl text-sm text-neutral-300 dark:text-neutral-600">Sin tarjeta y sin compromiso de permanencia.</p>
          <Link to="/registro?plan=PRUEBA" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-700">
            Crear mi tienda
            <IconoFlecha className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}

function Encabezado({ antetitulo, titulo, texto }: { antetitulo: string; titulo: string; texto?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">{antetitulo}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{titulo}</h2>
      {texto && <p className="mt-4 text-neutral-600 dark:text-neutral-400">{texto}</p>}
    </div>
  )
}

/** Ilustracion del panel: tarjetas y barras dibujadas con CSS (no es una captura ni datos reales). */
function VistaPrevia() {
  const barras = [38, 52, 44, 61, 57, 72, 66, 84, 78, 92]
  return (
    <div aria-hidden="true" className="animate-aparecer rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl shadow-neutral-900/10 [animation-delay:120ms] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/50">
      <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-3 dark:border-neutral-800">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="ml-3 h-2 w-40 rounded bg-neutral-100 dark:bg-neutral-800" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {['Ventas del mes', 'Margen', 'Pedidos en línea'].map((titulo, indice) => (
          <div key={titulo} className="rounded-xl border border-neutral-100 p-3 dark:border-neutral-800">
            <p className="text-[10px] font-medium text-neutral-500">{titulo}</p>
            <p className="mt-1 text-base font-bold tracking-tight">{['Bs 48.2k', '41%', '126'][indice]}</p>
            <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{['+12%', '+3 pts', '+18%'][indice]}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-neutral-100 p-3 dark:border-neutral-800">
        <p className="text-[10px] font-medium text-neutral-500">Ventas por semana</p>
        <div className="mt-3 flex h-28 items-end gap-1.5">
          {barras.map((alto, indice) => (
            <span key={indice} className="flex-1 rounded-t bg-neutral-900 dark:bg-white" style={{ height: `${alto}%`, opacity: 0.35 + (indice / barras.length) * 0.65 }} />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60">
        <IconoIA className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs text-neutral-600 dark:text-neutral-300">
          Sugerencia de compra: repón <strong className="font-semibold text-neutral-900 dark:text-white">chamarras talla M</strong> antes de junio.
        </p>
      </div>
    </div>
  )
}
