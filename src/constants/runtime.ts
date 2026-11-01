/**
 * Nombres de carpetas/archivos del runtime extraído (Python embebido).
 */
export const RUNTIME_CONFIG = {
  /** Carpeta raíz dentro del home del usuario. */
  rootFolderName: '.secti_addons',
  /** Subcarpeta donde se extrae el runtime de Python. */
  pythonFolderName: 'python',
  /** Nombre del binario de Python dentro de la subcarpeta. */
  pythonBinaryName: 'python.exe',
  /** Archivo marcador con la firma del bundle ya extraído. */
  readyMarkerName: '.ready',
} as const;
