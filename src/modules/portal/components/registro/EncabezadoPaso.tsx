const NOMBRES = ['Plan', 'Identificación tributaria', 'Administrador']

/** "PASO 2 DE 3 • IDENTIFICACIÓN TRIBUTARIA", barra de avance y titulo del paso. */
export function EncabezadoPaso({ paso, titulo, texto }: { paso: 1 | 2 | 3; titulo: string; texto: string }) {
  return (
    <header>
      <div className="flex gap-1.5" aria-hidden="true">
        {NOMBRES.map((nombre, indice) => (
          <span key={nombre} className={`h-1 flex-1 rounded-full ${indice < paso ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-800'}`} />
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
        Paso {paso} de 3 • {NOMBRES[paso - 1]}
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{texto}</p>
    </header>
  )
}
