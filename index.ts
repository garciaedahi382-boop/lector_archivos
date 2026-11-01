import os from 'node:os';
import path from 'node:path';
import { DocxReaderBuilder, PdfReaderBuilder, PptxReaderBuilder, XlsxReaderBuilder } from './src';
import { EmbeddedPython } from './src/builder/embedded-python';
import { CLI_CONFIG } from './src/constants/cli';
import { FORMAT_CONFIG } from './src/constants/formats';
import pythonBundle from './dist/python-bundle.zip' with { type: 'file' };

/**
 * CLI del lector de archivos.
 *
 * Uso: `lector_archivos <archivo> [-t|--tablas]`
 *
 * Despacha por extensión: `.pdf` (conversión con Python embebido),
 * `.pptx` y `.xlsx` (lectura directa del zip OOXML). El resultado se guarda
 * siempre en `~/.secti_addons/resultados.txt` a través de `ResultFileWriter`.
 */

/** Archivo de entrada indicado como primer argumento. */
const inputFile = process.argv[2];
/** `true` si el segundo argumento activa la lectura de tablas (`-t` / `--tablas`). */
const readTables = CLI_CONFIG.tableFlags.includes(process.argv[3] ?? '');

if (!inputFile || CLI_CONFIG.helpFlags.includes(inputFile)) {
  console.log(CLI_CONFIG.helpText);
  process.exit(inputFile ? 0 : 1);
}

/** Extensión normalizada (en minúsculas) usada para elegir el lector. */
const extension = path.extname(inputFile).toLowerCase();

if (extension === FORMAT_CONFIG.extensions.pdf) {
  await new PdfReaderBuilder({
    inputFile,
    binary: await new EmbeddedPython(pythonBundle).resolve(),
    outputDocx: path.join(os.tmpdir(), `lector_${Date.now()}.docx`),
    readTables,
  }).execute();
} else if (extension === FORMAT_CONFIG.extensions.docx) {
  await new DocxReaderBuilder({ inputFile, readTables }).execute();
} else if (extension === FORMAT_CONFIG.extensions.pptx) {
  await new PptxReaderBuilder({ inputFile, readTables }).execute();
} else if (extension === FORMAT_CONFIG.extensions.xlsx) {
  await new XlsxReaderBuilder({ inputFile, readTables }).execute();
} else {
  console.error(`${CLI_CONFIG.unsupportedFormatMessage}: ${extension || inputFile}`);
  process.exit(1);
}
