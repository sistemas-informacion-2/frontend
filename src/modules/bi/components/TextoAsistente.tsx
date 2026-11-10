import type { ReactNode } from 'react'

/** Negrita, cursiva y codigo de una linea. Todo se arma con elementos de React: nada se inserta como HTML. */
function enLinea(texto: string): ReactNode[] {
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g).filter(Boolean)
  return partes.map((parte, indice) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) return <strong key={indice} className="font-semibold text-neutral-900 dark:text-white">{parte.slice(2, -2)}</strong>
    if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) return <code key={indice} className="rounded bg-neutral-100 px-1 text-xs dark:bg-neutral-800">{parte.slice(1, -1)}</code>
    if (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2) return <em key={indice}>{parte.slice(1, -1)}</em>
    return parte
  })
}

const celdas = (linea: string) => linea.trim().replace(/^\||\|$/g, '').split('|').map((celda) => celda.trim())
const esSeparador = (linea: string) => /^\s*\|?[\s:|-]+\|?\s*$/.test(linea) && linea.includes('-')

function Tabla({ lineas }: { lineas: string[] }) {
  const cuerpo = lineas.slice(1).filter((linea) => !esSeparador(linea))
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>{celdas(lineas[0]).map((celda, i) => <th key={i} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">{enLinea(celda)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {cuerpo.map((linea, i) => <tr key={i}>{celdas(linea).map((celda, j) => <td key={j} className="px-3 py-2">{enLinea(celda)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  )
}

/** Muestra la respuesta de Gemini, que llega en Markdown simple: parrafos, listas, tablas y negritas. */
export function TextoAsistente({ texto }: { texto: string }) {
  const lineas = texto.split('\n')
  const bloques: ReactNode[] = []
  for (let i = 0; i < lineas.length; ) {
    const linea = lineas[i]
    if (!linea.trim()) {
      i++
    } else if (linea.trim().startsWith('|')) {
      const inicio = i
      while (i < lineas.length && lineas[i].trim().startsWith('|')) i++
      bloques.push(<Tabla key={inicio} lineas={lineas.slice(inicio, i)} />)
    } else if (/^\s*([*-]|\d+\.)\s+/.test(linea)) {
      const inicio = i
      const numerada = /^\s*\d+\./.test(linea)
      while (i < lineas.length && /^\s*([*-]|\d+\.)\s+/.test(lineas[i])) i++
      const items = lineas.slice(inicio, i).map((item, j) => <li key={j}>{enLinea(item.replace(/^\s*([*-]|\d+\.)\s+/, ''))}</li>)
      bloques.push(numerada ? <ol key={inicio} className="list-decimal space-y-1 pl-5">{items}</ol> : <ul key={inicio} className="list-disc space-y-1 pl-5">{items}</ul>)
    } else {
      bloques.push(<p key={i}>{enLinea(linea.replace(/^#+\s*/, ''))}</p>)
      i++
    }
  }
  return <div className="space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{bloques}</div>
}
