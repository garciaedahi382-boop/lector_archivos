/**
 * API pública del lector de archivos.
 *
 * Expone los runners/builders (PDF, PPTX, XLSX), sus tipos de resultado y de
 * opciones, y las constantes de configuración reutilizables.
 */

/** Builder para ejecutar procesos de Python embebido. */
export { PythonRunner } from './builder/python-runner';
/** Tipos de `PythonRunner`: resultado de ejecución y opciones del builder. */
export type { ExecutionResult, BuilderOptions } from './builder/python-runner';
/** Builder de lectura de PDF (conversión con pdf2docx + parseo del DOCX). */
export { PdfReaderBuilder } from './builder/pdf-reader-builder';
/** Tipo de resultado y opciones de `PdfReaderBuilder`. */
export type { PdfReadResult, PdfReaderOptions } from './builder/pdf-reader-builder';
/** Builder de lectura de DOCX (zip + WordprocessingML, sin Python). */
export { DocxReaderBuilder } from './builder/docx-reader-builder';
/** Opciones de `DocxReaderBuilder`. */
export type { DocxReaderOptions } from './builder/docx-reader-builder';
/** Builder de lectura de PPTX (zip + DrawingML, sin Python). */
export { PptxReaderBuilder } from './builder/pptx-reader-builder';
/** Opciones de `PptxReaderBuilder`. */
export type { PptxReaderOptions } from './builder/pptx-reader-builder';
/** Builder de lectura de XLSX (zip + SpreadsheetML, sin Python). */
export { XlsxReaderBuilder } from './builder/xlsx-reader-builder';
/** Opciones de `XlsxReaderBuilder`. */
export type { XlsxReaderOptions } from './builder/xlsx-reader-builder';
/** Formatos soportados, namespaces OOXML y rutas internas. */
export { FORMAT_CONFIG } from './constants/formats';
/** Configuración por defecto del Python embebido. */
export { PYTHON_CONFIG } from './config/default';
