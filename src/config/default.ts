/**
 * Configuración por defecto del intérprete de Python.
 *
 * Regla del proyecto: nunca usar el Python del sistema; siempre el embebido.
 */
export const PYTHON_CONFIG = {
  /** Ruta del binario de Python embebido usada cuando no se pasa `binary`. */
  binaryPath: 'python/embedded/python.exe',
  /** Tiempo máximo de ejecución de un proceso Python, en milisegundos. */
  timeoutMs: 60_000,
  /** Codificación con la que se decodifican `stdout`/`stderr`. */
  encoding: 'utf-8' as BufferEncoding,
  /** Banderas que se agregan siempre a la línea de comandos (`-B` = sin `.pyc`). */
  defaultFlags: ['-B'],
} as const;
