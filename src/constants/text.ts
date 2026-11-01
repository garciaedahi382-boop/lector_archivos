/**
 * Patrones y valores usados por `TextCleanerBuilder` para normalizar el texto.
 */
export const TEXT_CONFIG = {
  /** Espacio simple usado al colapsar el espacio en blanco. */
  space: ' ',
  /** Puntuación que se agrega al final de una oración sin cierre. */
  sentenceEnd: '.',
  /** Puntuación considerada como cierre válido de oración. */
  terminalPunctuation: /[.!?:;]$/,
  /** Cualquier secuencia de espacios, tabs o saltos de línea. */
  whitespace: /\s+/g,
  /** Símbolos (no letras/números/espacios) repetidos dos o más veces. */
  repeatedSymbols: /([^\p{L}\p{N}\s])\1+/gu,
} as const;
