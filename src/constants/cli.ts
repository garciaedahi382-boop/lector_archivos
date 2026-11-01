/**
 * Definición de la interfaz de línea de comandos.
 */
export const CLI_CONFIG = {
  /** Banderas que muestran la ayuda. */
  helpFlags: ['-h', '--help'] as readonly string[],
  /** Banderas que activan la lectura de tablas del documento. */
  tableFlags: ['-t', '--tablas'] as readonly string[],
  /** Mensaje mostrado (por stderr) cuando la extensión no está soportada. */
  unsupportedFormatMessage: 'Formato no soportado',
  /** Texto de ayuda impreso por el CLI. */
  helpText: [
    'Uso: lector_archivos <archivo> [opciones]',
    '',
    'Archivos soportados: .pdf, .docx, .pptx, .xlsx',
    'Lee el archivo y guarda el resultado en ~/.secti_addons/resultados.txt',
    '',
    'Opciones:',
    '  -h, --help      Muestra esta ayuda',
    '  -t, --tablas    Lee e incluye las tablas del documento',
  ].join('\n'),
} as const;
