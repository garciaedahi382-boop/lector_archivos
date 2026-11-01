import AdmZip from 'adm-zip';
import path from 'node:path';
import { PYTHON_CONFIG } from '../config/default';
import type { BuilderOptions } from './python-runner';
import { PythonRunner } from './python-runner';
import { DocumentXmlHelper, type PdfReadResult } from './helpers';
import { ResultFileWriter } from './result-file-writer';

export type { PdfReadResult };

/**
 * Opciones de `PdfReaderBuilder`.
 */
export interface PdfReaderOptions extends Partial<BuilderOptions> {
  /** Ruta del PDF a leer. */
  inputFile: string;
  /** Ruta del `.docx` intermedio generado por pdf2docx. */
  outputDocx?: string;
  /** Si es `true`, extrae también las tablas del documento. */
  readTables?: boolean;
}

/**
 * Ruta de las dependencias Python locales (`pdf2docx`).
 * Se resuelve con `process.cwd()`, por lo que el CLI debe ejecutarse desde la raíz. */
const LOCAL_PACKAGES = path.join(process.cwd(), '__deps', 'site-packages');

/**
 * Builder que convierte un PDF a DOCX (pdf2docx) y luego extrae su texto.
 *
 * @example
 * const result = await new PdfReaderBuilder({ inputFile, binary })
 *   .withTables()
 *   .execute();
 */
export class PdfReaderBuilder {
  private inputPath: string;
  private outputPath: string;
  private runnerOpts: Partial<BuilderOptions>;
  private readTablesOption: boolean;

  /** @param options Archivo de entrada, binario de Python y salida intermedia. */
  constructor(options: PdfReaderOptions) {
    this.inputPath = options.inputFile;
    this.outputPath = options.outputDocx ?? `__tmp_${Date.now()}.docx`;
    this.runnerOpts = options;
    this.readTablesOption = options.readTables ?? false;
  }

  /**
   * Activa o desactiva la lectura de tablas.
   * @param readTables Valor a aplicar (`true` por defecto).
   */
  withTables(readTables: boolean = true): this {
    this.readTablesOption = readTables;
    return this;
  }

  /**
   * Ejecuta pdf2docx sobre el PDF y genera el `.docx` intermedio.
   * @throws Si el proceso de Python falla.
   */
  async convert(): Promise<void> {
    const input = this.inputPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const output = this.outputPath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const packages = LOCAL_PACKAGES.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    const script = `
import sys
sys.path.insert(0, '${packages}')

from pdf2docx import Converter

try:
    cv = Converter('${input}')
    cv.convert('${output}', start=0, end=None)
    cv.close()
except Exception as e:
    raise e
`;

    await new PythonRunner({ ...this.runnerOpts, binary: this.runnerOpts.binary ?? PYTHON_CONFIG.binaryPath })
      .withCode(script)
      .execute();
  }

  /**
   * Lee el `.docx` intermedio y extrae el contenido.
   *
   * Nota: pese al nombre histórico, usa `adm-zip` + `@xmldom/xmldom`
   * (no Cheerio).
   * @returns Resultado de la lectura.
   */
  async readWithCheerio(): Promise<PdfReadResult> {
    const zip = new AdmZip(this.outputPath);
    const xmlBuf = zip.readFile('word/document.xml');

    if (!xmlBuf) throw new Error('No se encontro document.xml');

    const xmlStr = xmlBuf.toString('utf-8');
    return DocumentXmlHelper.parseDocxXml(xmlStr, { readTables: this.readTablesOption });
  }

  /**
   * Convierte, lee y escribe el resultado en `~/.secti_addons/resultados.txt`.
   * @returns Resultado de la lectura.
   */
  async execute(): Promise<PdfReadResult> {
    await this.convert();
    const result = await this.readWithCheerio();
    await new ResultFileWriter().write(result);
    return result;
  }
}
