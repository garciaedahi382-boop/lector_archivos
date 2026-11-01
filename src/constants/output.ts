/**
 * Configuración del archivo de resultados.
 */
export const OUTPUT_CONFIG = {
  /** Carpeta oculta (dentro del home) donde se guarda el resultado. */
  folderName: '.secti_addons',
  /** Nombre del archivo de texto generado. */
  fileName: 'resultados.txt',
  /** Codificación de escritura. */
  encoding: 'utf-8' as BufferEncoding,
  /** Prefijo de cada elemento de lista. */
  listItemPrefix: '- ',
  /** Separador usado para unir las celdas de una fila de tabla. */
  tableCellSeparator: ', ',
  /** Separador usado para unir las partes del documento. */
  joiner: ' ',
} as const;
