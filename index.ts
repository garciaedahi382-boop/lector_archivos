import os from 'node:os';
import path from 'node:path';
import { PdfReaderBuilder } from './src';
import { EmbeddedPython } from './src/builder/embedded-python';
import { CLI_CONFIG } from './src/constants/cli';
import pythonBundle from './dist/python-bundle.zip' with { type: 'file' };

/**
 * CLI del lector de archivos.
 *
 * Uso: `lector_archivos <archivo> [-t|--tablas]`
 *
 * El resultado se guarda siempre en `~/.secti_addons/resultados.txt` a través de
 * `ResultFileWriter`.
 */

/** Archivo de entrada indicado como primer argumento. */
const inputFile = process.argv[2];
/** `true` si el segundo argumento activa la lectura de tablas (`-t` / `--tablas`). */
const readTables = CLI_CONFIG.tableFlags.includes(process.argv[3] ?? '');

if (!inputFile || CLI_CONFIG.helpFlags.includes(inputFile)) {
  console.log(CLI_CONFIG.helpText);
  process.exit(inputFile ? 0 : 1);
}

await new PdfReaderBuilder({
  inputFile,
  binary: await new EmbeddedPython(pythonBundle).resolve(),
  outputDocx: path.join(os.tmpdir(), `lector_${Date.now()}.docx`),
  readTables,
}).execute();
