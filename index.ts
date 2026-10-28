import os from 'node:os';
import path from 'node:path';
import { PdfReaderBuilder } from './src';
import { EmbeddedPython } from './src/builder/embedded-python';
import { CLI_CONFIG } from './src/constants/cli';
import pythonBundle from './dist/python-bundle.zip' with { type: 'file' };

const inputFile = process.argv[2];

if (!inputFile || CLI_CONFIG.helpFlags.includes(inputFile)) {
  console.log(CLI_CONFIG.helpText);
  process.exit(inputFile ? 0 : 1);
}

await new PdfReaderBuilder({
  inputFile,
  binary: await new EmbeddedPython(pythonBundle).resolve(),
  outputDocx: path.join(os.tmpdir(), `lector_${Date.now()}.docx`),
}).execute();
