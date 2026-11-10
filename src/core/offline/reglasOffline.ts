export type Metodo = 'post' | 'put' | 'patch' | 'delete'
export type Fila = Record<string, unknown>

export interface ContextoRegla {
  cuerpo: Fila
  idTemporal: number
  /** Cuando se hizo el cambio, en ISO. */
  ahora: string
  /** Ultima version conocida de un registro del servidor. */
  buscar: (coleccion: string, id: unknown) => Fila | undefined
  /** Datos de una variante, sacados del stock ya descargado. */
  buscarVariante: (idVariante: unknown) => Fila | undefined
}

export interface Regla {
  metodo: Metodo
  /** `:id` es el registro al que afecta; otros `:x` son subrecursos. */
  patron: string
  texto: string
  accion: 'crear' | 'editar' | 'eliminar'
  coleccion: string
  /** Listas donde aparece un registro creado; por defecto, la coleccion. */
  listas?: string[]
  /** Fila completa de un registro creado: las tablas leen campos que solo calcula el servidor. */
  fila?: (c: ContextoRegla) => Fila
  /** Efecto sobre un registro existente; por defecto, se le copian los campos enviados. */
  aplicar?: (item: Fila, c: ContextoRegla) => Fila
  /** De donde leer el dato actual para detectar conflictos: el registro o la lista donde buscarlo. */
  lectura?: (id: number) => string
  /** Id real tras enviarlo, si la respuesta no es el registro creado. */
  idRespuesta?: (datos: Fila, cuerpo: Fila) => unknown
  /** Lo que recibe la pantalla al guardar, si no es la fila o el registro. */
  respuesta?: (c: ContextoRegla) => unknown
}

const numero = (valor: unknown) => Number(valor ?? 0) || 0
const lista = <T = Fila>(valor: unknown) => (Array.isArray(valor) ? (valor as T[]) : [])
const fecha = (iso: string) => iso.slice(0, 10)
const hora = (iso: string) => new Date(iso).toTimeString().slice(0, 8)
const nulo = (valor: unknown) => valor ?? null

function nombreDe(c: ContextoRegla, coleccion: string, id: unknown, campo = 'nombre'): string {
  return String(c.buscar(coleccion, id)?.[campo] ?? '—')
}

const editar = (patron: string, texto: string, coleccion: string, extra: Partial<Regla> = {}): Regla => ({ metodo: 'put', patron, texto, accion: 'editar', coleccion, ...extra })
const conLectura = (coleccion: string) => ({ lectura: (id: number) => `${coleccion}/${id}` })
const enLista = (ruta: string) => ({ lectura: () => ruta })

function estadoTemporada(inicio: unknown, fin: unknown, ahora: string): string {
  const hoy = fecha(ahora)
  if (hoy < String(inicio)) return 'PROXIMA'
  return hoy > String(fin) ? 'FINALIZADA' : 'VIGENTE'
}

function sucursalesDe(c: ContextoRegla): Fila[] {
  return lista<number>(c.cuerpo.sucursalIds).map((id) => ({ id, nombre: nombreDe(c, '/operaciones/sucursales', id), activo: true }))
}

function conCategoria(item: Fila, c: ContextoRegla): Fila {
  const idCategoria = c.cuerpo.idCategoria ?? item.categoriaId
  return { ...item, ...c.cuerpo, categoriaId: idCategoria, categoriaNombre: nombreDe(c, '/inventario/categorias', idCategoria), sucursales: c.cuerpo.sucursalIds ? sucursalesDe(c) : (item.sucursales ?? []) }
}

function conRoles(item: Fila, c: ContextoRegla): Fila {
  return { ...item, roles: lista<number>(c.cuerpo.roles).map((id) => ({ id, nombre: nombreDe(c, '/acceso/roles', id) })) }
}

function conCiudad(item: Fila, c: ContextoRegla): Fila {
  const ciudad = c.buscar('/operaciones/ciudades', c.cuerpo.idCiudad)
  return { ...item, ...c.cuerpo, ciudadId: c.cuerpo.idCiudad, ciudadNombre: ciudad?.nombre ?? '—', departamentoNombre: ciudad?.departamentoNombre ?? '—' }
}

/** Lineas de una venta o reserva, con el precio y el nombre conocidos por el stock descargado. */
function lineasDe(c: ContextoRegla) {
  return lista(c.cuerpo.items).map((item, indice) => {
    const variante = c.buscarVariante(item.idVarianteProducto)
    const precioUnitario = numero(variante?.precio)
    return {
      id: c.idTemporal - indice - 1,
      idVarianteProducto: item.idVarianteProducto,
      sku: variante?.sku ?? null,
      productoNombre: variante?.productoNombre ?? 'Prenda',
      descripcion: variante ? `${String(variante.productoNombre)} (${String(variante.talla)}/${String(variante.color)})` : 'Prenda',
      talla: variante?.talla ?? '',
      color: variante?.color ?? '',
      precioUnitario,
      cantidad: numero(item.cantidad),
      subtotal: precioUnitario * numero(item.cantidad),
    }
  })
}

const sumar = (lineas: { subtotal: number }[]) => lineas.reduce((total, linea) => total + linea.subtotal, 0)

function movimientoDe(c: ContextoRegla, idCaja: unknown) {
  return { id: c.idTemporal, idCaja, tipo: c.cuerpo.tipo, concepto: c.cuerpo.concepto, monto: numero(c.cuerpo.monto), observaciones: nulo(c.cuerpo.observaciones), fechaHora: c.ahora }
}

/** Orden importa: lo mas especifico va antes. */
export const REGLAS: Regla[] = [
  // Acceso
  editar('/acceso/perfil', 'Editar mi perfil', '/acceso/perfil', { aplicar: (item, c) => ({ ...item, ...c.cuerpo }) }),
  { metodo: 'patch', patron: '/acceso/perfil/cambiar-password', texto: 'Cambiar mi contraseña', accion: 'editar', coleccion: '/acceso/perfil/cambiar-password' },
  {
    metodo: 'post', patron: '/acceso/usuarios', texto: 'Crear usuario', accion: 'crear', coleccion: '/acceso/usuarios',
    fila: (c) => conRoles({ id: c.idTemporal, nombre: c.cuerpo.nombre, apellido: c.cuerpo.apellido, email: c.cuerpo.email, telefono: nulo(c.cuerpo.telefono), sexo: nulo(c.cuerpo.sexo), tipoUsuario: c.cuerpo.tipoUsuario, estadoAcceso: c.cuerpo.estadoAcceso, fechaCreacion: c.ahora, activo: true }, c),
  },
  editar('/acceso/usuarios/:id', 'Editar usuario', '/acceso/usuarios', conLectura('/acceso/usuarios')),
  { metodo: 'post', patron: '/acceso/usuarios/:id/roles', texto: 'Asignar roles', accion: 'editar', coleccion: '/acceso/usuarios', aplicar: conRoles },
  { metodo: 'delete', patron: '/acceso/usuarios/:id', texto: 'Desactivar usuario', accion: 'eliminar', coleccion: '/acceso/usuarios' },
  {
    metodo: 'post', patron: '/acceso/roles', texto: 'Crear rol', accion: 'crear', coleccion: '/acceso/roles',
    fila: (c) => ({ id: c.idTemporal, nombre: c.cuerpo.nombre, descripcion: nulo(c.cuerpo.descripcion), activo: true, fechaCreacion: c.ahora, cantidadUsuarios: 0, permisos: [] }),
  },
  editar('/acceso/roles/:id', 'Editar rol', '/acceso/roles', conLectura('/acceso/roles')),
  {
    metodo: 'post', patron: '/acceso/roles/:id/permisos', texto: 'Cambiar permisos del rol', accion: 'editar', coleccion: '/acceso/roles',
    aplicar: (item, c) => ({ ...item, permisos: lista<number>(c.cuerpo.permisos).map((id) => ({ id, accion: '', descripcion: null, modulo: '', activo: true })) }),
  },
  { metodo: 'delete', patron: '/acceso/roles/:id', texto: 'Desactivar rol', accion: 'eliminar', coleccion: '/acceso/roles' },

  // Comercial
  {
    metodo: 'post', patron: '/comercial/ventas', texto: 'Venta presencial', accion: 'crear', coleccion: '/comercial/ventas',
    fila: (c) => {
      const detalles = lineasDe(c)
      const subtotal = sumar(detalles)
      const descuento = numero(c.cuerpo.descuento)
      const impuesto = numero(c.cuerpo.impuesto)
      return {
        id: c.idTemporal, codigoNota: 'Sin enviar', idCliente: c.cuerpo.idCliente ?? 0, clienteNombre: c.cuerpo.idCliente ? `${String(c.buscar('/operaciones/clientes', c.cuerpo.idCliente)?.nombre ?? 'Cliente')}` : 'Consumidor final',
        idCajero: null, cajeroNombre: null, idSucursal: c.cuerpo.idSucursal, sucursalNombre: nombreDe(c, '/operaciones/sucursales', c.cuerpo.idSucursal),
        idPasarela: c.cuerpo.idPasarela, pasarelaMetodo: nombreDe(c, '/comercial/pasarelas', c.cuerpo.idPasarela, 'metodo'), idMovimientoCaja: null, tipoVenta: 'DIRECTA_PRESENCIAL',
        nroFactura: nulo(c.cuerpo.nroFactura), nitRazonSocial: nulo(c.cuerpo.nitRazonSocial), fechaEmision: fecha(c.ahora), horaEmision: hora(c.ahora),
        subtotal, descuento, impuesto, montoTotal: subtotal - descuento + impuesto, estadoPago: 'Pagado', detalles, pagos: [],
      }
    },
  },
  {
    metodo: 'post', patron: '/comercial/compras', texto: 'Registrar compra', accion: 'crear', coleccion: '/comercial/compras',
    fila: (c) => {
      const detalles = lista(c.cuerpo.detalles).map((d, indice) => {
        const variante = c.buscarVariante(d.idVarianteProducto)
        return { id: c.idTemporal - indice - 1, idVarianteProducto: d.idVarianteProducto, sku: variante?.sku ?? '', productoNombre: variante?.productoNombre ?? 'Prenda', talla: variante?.talla ?? '', color: variante?.color ?? '', idAlmacen: d.idAlmacen, almacenNombre: nombreDe(c, '/inventario/almacenes', d.idAlmacen), precioUnitario: numero(d.precioUnitario), cantidad: numero(d.cantidad), subtotal: numero(d.precioUnitario) * numero(d.cantidad), nroLote: nulo(d.nroLote) }
      })
      const total = sumar(detalles)
      return { id: c.idTemporal, idProveedor: c.cuerpo.idProveedor, proveedorNombre: nombreDe(c, '/inventario/proveedores', c.cuerpo.idProveedor, 'empresa'), idSucursal: c.cuerpo.idSucursal, sucursalNombre: nombreDe(c, '/operaciones/sucursales', c.cuerpo.idSucursal), idMovimientoCaja: null, nroFactura: nulo(c.cuerpo.nroFactura), fechaEmision: fecha(c.ahora), fechaEntregaProgramada: nulo(c.cuerpo.fechaEntregaProgramada), fechaPago: c.cuerpo.pagarEnCaja ? fecha(c.ahora) : null, subtotal: total, total, estado: 'Sin enviar', cantidadLineas: detalles.length, detalles }
    },
  },
  {
    metodo: 'post', patron: '/comercial/devoluciones', texto: 'Registrar devolución', accion: 'crear', coleccion: '/comercial/devoluciones',
    fila: (c) => ({ id: c.idTemporal, codigoDevolucion: 'Sin enviar', tipoDevolucion: c.cuerpo.codigoReserva ? 'CANCELACION_RESERVA' : 'DEVOLUCION_VENTA', motivoDevolucion: c.cuerpo.motivoDevolucion, idCliente: 0, clienteNombre: '—', idSucursal: c.cuerpo.idSucursal, sucursalNombre: nombreDe(c, '/operaciones/sucursales', c.cuerpo.idSucursal), idCajero: c.cuerpo.idCajero ?? 0, cajeroNombre: '—', idNotaVenta: null, codigoNota: nulo(c.cuerpo.codigoNota), idReserva: null, codigoReserva: nulo(c.cuerpo.codigoReserva), idMovimientoCaja: null, montoTotalReembolsado: 0, observaciones: nulo(c.cuerpo.observaciones), fechaEmision: fecha(c.ahora), detalles: [] }),
  },
  {
    metodo: 'post', patron: '/comercial/cajas', texto: 'Abrir caja', accion: 'crear', coleccion: '/comercial/cajas',
    fila: (c) => ({ id: c.idTemporal, idSucursal: c.cuerpo.idSucursal, sucursalNombre: nombreDe(c, '/operaciones/sucursales', c.cuerpo.idSucursal), idCajero: null, cajeroNombre: null, fechaApertura: fecha(c.ahora), fechaCierre: null, horaApertura: hora(c.ahora), horaCierre: null, montoInicial: numero(c.cuerpo.montoInicial), montoFinal: null, estado: 'Abierta', totalIngresos: 0, totalEgresos: 0, montoEsperado: numero(c.cuerpo.montoInicial), movimientos: [], totalCobrosEnLinea: 0, cobrosEnLinea: [] }),
  },
  {
    metodo: 'patch', patron: '/comercial/cajas/:id/cerrar', texto: 'Cerrar caja', accion: 'editar', coleccion: '/comercial/cajas',
    aplicar: (item, c) => ({ ...item, estado: 'Cerrada', fechaCierre: fecha(c.ahora), horaCierre: hora(c.ahora), montoFinal: c.cuerpo.montoFinal ?? item.montoEsperado }),
  },
  {
    metodo: 'post', patron: '/comercial/cajas/:id/movimientos', texto: 'Movimiento de caja', accion: 'editar', coleccion: '/comercial/cajas',
    aplicar: (item, c) => {
      const monto = numero(c.cuerpo.monto)
      const esIngreso = c.cuerpo.tipo === 'INGRESO'
      return { ...item, movimientos: [...lista(item.movimientos), movimientoDe(c, item.id)], totalIngresos: numero(item.totalIngresos) + (esIngreso ? monto : 0), totalEgresos: numero(item.totalEgresos) + (esIngreso ? 0 : monto), montoEsperado: numero(item.montoEsperado) + (esIngreso ? monto : -monto) }
    },
    respuesta: (c) => movimientoDe(c, 0),
  },
  {
    metodo: 'post', patron: '/comercial/pasarelas', texto: 'Crear método de pago', accion: 'crear', coleccion: '/comercial/pasarelas',
    fila: (c) => ({ id: c.idTemporal, codigo: c.cuerpo.codigo, metodo: c.cuerpo.metodo, descripcion: nulo(c.cuerpo.descripcion), integracion: c.cuerpo.integracion, comisionPorcentaje: numero(c.cuerpo.comisionPorcentaje), disponiblePresencial: c.cuerpo.disponiblePresencial, disponibleLinea: c.cuerpo.disponibleLinea, tieneApiKey: false, origenCredenciales: 'NINGUNA' }),
  },
  editar('/comercial/pasarelas/:id', 'Editar método de pago', '/comercial/pasarelas', conLectura('/comercial/pasarelas')),
  {
    metodo: 'patch', patron: '/comercial/pasarelas/:id/disponibilidad', texto: 'Cambiar disponibilidad de pago', accion: 'editar', coleccion: '/comercial/pasarelas',
    aplicar: (item, c) => ({ ...item, disponiblePresencial: c.cuerpo.presencial ?? item.disponiblePresencial, disponibleLinea: c.cuerpo.linea ?? item.disponibleLinea }),
  },

  // Reservas y notificaciones
  {
    metodo: 'post', patron: '/electronico/reservas', texto: 'Crear reserva', accion: 'crear', coleccion: '/electronico/reservas',
    fila: (c) => {
      const detalles = lineasDe(c)
      const montoTotal = sumar(detalles)
      return { id: c.idTemporal, codigoReserva: 'Sin enviar', idCliente: c.cuerpo.idCliente, clienteNombre: String(c.buscar('/operaciones/clientes', c.cuerpo.idCliente)?.nombre ?? 'Cliente'), idSucursal: c.cuerpo.idSucursal, sucursalNombre: nombreDe(c, '/operaciones/sucursales', c.cuerpo.idSucursal), fechaReserva: c.ahora, fechaLimite: new Date(new Date(c.ahora).getTime() + numero(c.cuerpo.horasLimite || 48) * 3600_000).toISOString(), estado: 'PENDIENTE', montoAnticipo: numero(c.cuerpo.montoAnticipo), montoTotal, anticipoPagado: 0, saldoPendiente: montoTotal, observaciones: nulo(c.cuerpo.observaciones), idNotaVenta: null, codigoNotaVenta: null, detalles, pagos: [] }
    },
  },
  {
    metodo: 'post', patron: '/electronico/reservas/:id/anticipo', texto: 'Cobrar anticipo', accion: 'editar', coleccion: '/electronico/reservas',
    aplicar: (item) => ({ ...item, anticipoPagado: numero(item.montoAnticipo), saldoPendiente: numero(item.montoTotal) - numero(item.montoAnticipo), estado: 'PAGADA' }),
  },
  { metodo: 'post', patron: '/electronico/reservas/:id/liquidar', texto: 'Liquidar reserva', accion: 'editar', coleccion: '/electronico/reservas', aplicar: (item) => ({ ...item, saldoPendiente: 0, estado: 'COMPLETADA' }) },
  { metodo: 'post', patron: '/electronico/reservas/:id/cancelar', texto: 'Cancelar reserva', accion: 'editar', coleccion: '/electronico/reservas', aplicar: (item) => ({ ...item, estado: 'CANCELADA' }) },
  {
    metodo: 'post', patron: '/electronico/notificaciones', texto: 'Enviar notificación', accion: 'crear', coleccion: '/electronico/notificaciones',
    fila: (c) => ({ id: c.idTemporal, idUsuario: c.cuerpo.idUsuario ?? 0, destinatario: c.cuerpo.difundirTodos ? 'Todos los clientes' : nombreDe(c, '/electronico/notificaciones/destinatarios', c.cuerpo.idUsuario), titulo: c.cuerpo.titulo, mensaje: c.cuerpo.mensaje, leido: false, fechaEnvio: c.ahora }),
    respuesta: () => ({ cantidadEnviada: 1 }),
    idRespuesta: () => undefined,
  },
  { metodo: 'patch', patron: '/electronico/notificaciones/mias/leer-todas', texto: 'Marcar notificaciones como leídas', accion: 'editar', coleccion: '/electronico/notificaciones/mias/leer-todas', respuesta: () => ({ cantidadActualizada: 0 }) },
  { metodo: 'patch', patron: '/electronico/notificaciones/mias/:id/leido', texto: 'Marcar notificación como leída', accion: 'editar', coleccion: '/electronico/notificaciones', aplicar: (item) => ({ ...item, leido: true }) },
  { metodo: 'delete', patron: '/electronico/notificaciones/:id', texto: 'Eliminar notificación', accion: 'eliminar', coleccion: '/electronico/notificaciones' },

  // Inventario
  {
    metodo: 'post', patron: '/inventario/archivos/imagenes', texto: 'Subir imagen', accion: 'crear', coleccion: '/inventario/archivos/imagenes',
    idRespuesta: (datos) => datos.url,
  },
  {
    metodo: 'post', patron: '/inventario/productos', texto: 'Crear producto', accion: 'crear', coleccion: '/inventario/productos', listas: ['/inventario/productos', '/inventario/productos/todas'],
    fila: (c) => conCategoria({ id: c.idTemporal, descripcion: null, descuentoPorcentaje: 0, activo: true, imagenes: lista(c.cuerpo.imagenes).map((imagen, i) => ({ esPrincipal: i === 0, orden: i, ...imagen, id: c.idTemporal - i - 1 })), variantes: lista(c.cuerpo.variantes).map((variante, i) => ({ activo: true, corte: '', ...variante, id: c.idTemporal - 1000 - i })) }, c),
  },
  editar('/inventario/productos/:id', 'Editar producto', '/inventario/productos', { ...conLectura('/inventario/productos'), aplicar: conCategoria }),
  { metodo: 'delete', patron: '/inventario/productos/:id', texto: 'Desactivar producto', accion: 'eliminar', coleccion: '/inventario/productos' },
  editar('/inventario/productos/:id/sucursales', 'Cambiar sucursales del producto', '/inventario/productos', { aplicar: (item, c) => ({ ...item, sucursales: sucursalesDe(c) }) }),
  {
    metodo: 'post', patron: '/inventario/productos/:id/variantes', texto: 'Agregar variante', accion: 'editar', coleccion: '/inventario/productos',
    aplicar: (item, c) => ({ ...item, variantes: [...lista(item.variantes), { activo: true, corte: '', ...c.cuerpo, id: c.idTemporal }] }),
    idRespuesta: (datos, cuerpo) => lista(datos.variantes).find((v) => v.sku === cuerpo.sku)?.id,
  },
  editar('/inventario/productos/:id/variantes/:sub', 'Editar variante', '/inventario/productos'),
  { metodo: 'delete', patron: '/inventario/productos/:id/variantes/:sub', texto: 'Eliminar variante', accion: 'editar', coleccion: '/inventario/productos' },
  {
    metodo: 'post', patron: '/inventario/productos/:id/imagenes', texto: 'Agregar imagen', accion: 'editar', coleccion: '/inventario/productos',
    aplicar: (item, c) => ({ ...item, imagenes: [...lista(item.imagenes), { esPrincipal: false, orden: lista(item.imagenes).length, ...c.cuerpo, id: c.idTemporal }] }),
    idRespuesta: (datos, cuerpo) => lista(datos.imagenes).find((i) => i.url === cuerpo.url)?.id,
  },
  editar('/inventario/productos/:id/imagenes/:sub', 'Editar imagen', '/inventario/productos'),
  { metodo: 'delete', patron: '/inventario/productos/:id/imagenes/:sub', texto: 'Eliminar imagen', accion: 'editar', coleccion: '/inventario/productos' },
  {
    metodo: 'post', patron: '/inventario/categorias', texto: 'Crear categoría', accion: 'crear', coleccion: '/inventario/categorias', listas: ['/inventario/categorias', '/inventario/categorias/todas'],
    fila: (c) => ({ id: c.idTemporal, nombre: c.cuerpo.nombre, slug: c.cuerpo.slug, descripcion: nulo(c.cuerpo.descripcion), imagenUrl: nulo(c.cuerpo.imagenUrl), activo: true, categoriaPadreId: nulo(c.cuerpo.categoriaPadreId), temporadas: lista<number>(c.cuerpo.temporadaIds).map((id) => ({ id, nombre: nombreDe(c, '/inventario/temporadas', id) })), hijos: [] }),
  },
  editar('/inventario/categorias/:id', 'Editar categoría', '/inventario/categorias', {
    ...enLista('/inventario/categorias/todas'),
    aplicar: (item, c) => ({ ...item, ...c.cuerpo, temporadas: lista<number>(c.cuerpo.temporadaIds).map((id) => ({ id, nombre: nombreDe(c, '/inventario/temporadas', id) })) }),
  }),
  { metodo: 'post', patron: '/inventario/proveedores', texto: 'Crear proveedor', accion: 'crear', coleccion: '/inventario/proveedores', fila: (c) => ({ id: c.idTemporal, nombreContacto: null, telefonoContacto: null, correoContacto: null, activo: true, ...c.cuerpo }) },
  editar('/inventario/proveedores/:id', 'Editar proveedor', '/inventario/proveedores', enLista('/inventario/proveedores')),
  { metodo: 'post', patron: '/inventario/temporadas', texto: 'Crear temporada', accion: 'crear', coleccion: '/inventario/temporadas', fila: (c) => ({ id: c.idTemporal, descripcion: null, ...c.cuerpo, estado: estadoTemporada(c.cuerpo.fechaInicio, c.cuerpo.fechaFin, c.ahora) }) },
  editar('/inventario/temporadas/:id', 'Editar temporada', '/inventario/temporadas', { ...enLista('/inventario/temporadas'), aplicar: (item, c) => ({ ...item, ...c.cuerpo, estado: estadoTemporada(c.cuerpo.fechaInicio, c.cuerpo.fechaFin, c.ahora) }) }),
  { metodo: 'delete', patron: '/inventario/temporadas/:id', texto: 'Eliminar temporada', accion: 'eliminar', coleccion: '/inventario/temporadas' },
  { metodo: 'post', patron: '/inventario/almacenes', texto: 'Crear almacén', accion: 'crear', coleccion: '/inventario/almacenes', fila: (c) => ({ id: c.idTemporal, ubicacionFisica: null, activo: true, ...c.cuerpo, sucursalNombre: nombreDe(c, '/operaciones/sucursales', c.cuerpo.idSucursal), cantidadVariantes: 0 }) },
  editar('/inventario/almacenes/:id', 'Editar almacén', '/inventario/almacenes', { ...conLectura('/inventario/almacenes'), aplicar: (item, c) => ({ ...item, ...c.cuerpo, sucursalNombre: nombreDe(c, '/operaciones/sucursales', c.cuerpo.idSucursal) }) }),
  {
    metodo: 'post', patron: '/inventario/stock', texto: 'Registrar stock', accion: 'crear', coleccion: '/inventario/stock',
    fila: (c) => {
      const variante = c.buscarVariante(c.cuerpo.idVarianteProducto)
      const almacen = c.buscar('/inventario/almacenes', c.cuerpo.idAlmacen)
      return { id: c.idTemporal, idAlmacen: c.cuerpo.idAlmacen, almacenNombre: almacen?.nombre ?? '—', idSucursal: almacen?.idSucursal ?? 0, sucursalNombre: almacen?.sucursalNombre ?? '—', idVarianteProducto: c.cuerpo.idVarianteProducto, sku: variante?.sku ?? '—', productoNombre: variante?.productoNombre ?? 'Prenda', talla: variante?.talla ?? '', color: variante?.color ?? '', precio: numero(variante?.precio), stockDisponible: numero(c.cuerpo.stockDisponible), stockReservado: 0, stockMinimo: numero(c.cuerpo.stockMinimo), stockMaximo: numero(c.cuerpo.stockMaximo), bajoMinimo: numero(c.cuerpo.stockDisponible) < numero(c.cuerpo.stockMinimo) }
    },
  },
  editar('/inventario/stock/:id', 'Editar límites de stock', '/inventario/stock', conLectura('/inventario/stock')),
  {
    metodo: 'patch', patron: '/inventario/stock/:id/ajuste', texto: 'Ajustar stock', accion: 'editar', coleccion: '/inventario/stock',
    aplicar: (item, c) => {
      const cantidad = numero(c.cuerpo.cantidad)
      const actual = numero(item.stockDisponible)
      const stockDisponible = c.cuerpo.tipo === 'ENTRADA' ? actual + cantidad : c.cuerpo.tipo === 'SALIDA' ? actual - cantidad : cantidad
      return { ...item, stockDisponible, bajoMinimo: stockDisponible < numero(item.stockMinimo) }
    },
  },

  // Operaciones
  { metodo: 'post', patron: '/operaciones/ciudades', texto: 'Crear ciudad', accion: 'crear', coleccion: '/operaciones/ciudades', fila: (c) => ({ id: c.idTemporal, nombre: c.cuerpo.nombre, departamentoId: c.cuerpo.idDepartamento, departamentoNombre: nombreDe(c, '/operaciones/departamentos', c.cuerpo.idDepartamento) }) },
  { metodo: 'post', patron: '/operaciones/sucursales', texto: 'Crear sucursal', accion: 'crear', coleccion: '/operaciones/sucursales', fila: (c) => conCiudad({ id: c.idTemporal, telefono: null, correo: null, horarioApertura: null, horarioCierre: null, activo: true }, c) },
  editar('/operaciones/sucursales/:id', 'Editar sucursal', '/operaciones/sucursales', { ...enLista('/operaciones/sucursales'), aplicar: conCiudad }),
  { metodo: 'post', patron: '/operaciones/clientes', texto: 'Crear cliente', accion: 'crear', coleccion: '/operaciones/clientes', fila: (c) => ({ id: c.idTemporal, telefono: null, sexo: null, ciudadResidencia: null, direccionPrincipal: null, ...c.cuerpo, estadoAcceso: 'HABILITADO', activo: true, puntosFidelidad: 0 }) },
  editar('/operaciones/clientes/:id', 'Editar cliente', '/operaciones/clientes', conLectura('/operaciones/clientes')),
  {
    metodo: 'post', patron: '/operaciones/empleados', texto: 'Crear empleado', accion: 'crear', coleccion: '/operaciones/empleados',
    fila: (c) => ({ id: c.idTemporal, telefono: null, sexo: null, fechaFinalizacion: null, ...c.cuerpo, estadoAcceso: 'HABILITADO', activo: true, codigoEmpleado: 'Sin enviar', salario: numero(c.cuerpo.salario), sucursales: sucursalesDe(c) }),
  },
  editar('/operaciones/empleados/:id', 'Editar empleado', '/operaciones/empleados', { ...conLectura('/operaciones/empleados'), aplicar: (item, c) => ({ ...item, ...c.cuerpo, sucursales: c.cuerpo.sucursalIds ? sucursalesDe(c) : item.sucursales }) }),

  // Plantillas de reportes
  { metodo: 'post', patron: '/reports/templates', texto: 'Crear plantilla de reporte', accion: 'crear', coleccion: '/reports/templates', fila: (c) => ({ id: c.idTemporal, ...c.cuerpo }) },
  editar('/reports/templates/:id', 'Editar plantilla de reporte', '/reports/templates', enLista('/reports/templates')),
  { metodo: 'delete', patron: '/reports/templates/:id', texto: 'Eliminar plantilla de reporte', accion: 'eliminar', coleccion: '/reports/templates' },
]

const compilados = REGLAS.map((regla) => ({
  regla,
  expresion: new RegExp(`^${regla.patron.replace(':id', '(-?\\d+)').replace(/:[a-z]+/g, '-?\\d+')}$`),
}))

export function rutaDe(url: string): string {
  return url.split('?')[0].replace(/\/+$/, '')
}

/** La regla de esta escritura y el id al que afecta, o null si esta operacion necesita red. */
export function reglaDe(metodo: string, url: string): { regla: Regla; id: number | null } | null {
  const ruta = rutaDe(url)
  for (const { regla, expresion } of compilados) {
    if (regla.metodo !== metodo) continue
    const coincidencia = ruta.match(expresion)
    if (coincidencia) return { regla, id: coincidencia[1] ? Number(coincidencia[1]) : null }
  }
  return null
}
