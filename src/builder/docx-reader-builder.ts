import AdmZip from 'adm-zip';
import { FORMAT_CONFIG } from '../constants/formats';
import { DocumentXmlHelper, type PdfReadResult } from './helpers';
import { ResultFileWriter } from './result-file-writer';

/**
 * Opciones de `DocxReaderBuilder`.
 */
export interface DocxReaderOptions {
  /** Ruta del `.docx` a leer. */
  inputFile: string;
  /** Si es `true`, extrae también las tablas del documento. */
  readTables?: boolean;
}

/**
 * Builder que lee un `.docx` (zip + `word/document.xml`) sin Python.
 *
 * @example
 * const result = await new DocxReaderBuilder({ inputFile: 'x.docx' })
 *   .withTables()
 *   .execute();
 */
export class DocxReaderBuilder {
  private inputPath: string;
  private readTablesOption: boolean;

  /** @param options Archivo de entrada y si se leen tablas. */
  constructor(options: DocxReaderOptions) {
    this.inputPath = options.inputFile;
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
   * Lee `word/document.xml` y extrae el contenido del documento.
   * @throws Si el zip no contiene `word/document.xml`.
   * @returns Resultado de la lectura.
   */
  async readDocument(): Promise<PdfReadResult> {
    const zip = new AdmZip(this.inputPath);
    const buf = zip.readFile(FORMAT_CONFIG.docx.documentPath);

    if (!buf) throw new Error('No se encontro document.xml');

    return DocumentXmlHelper.parseDocxXml(buf.toString('utf-8'), { readTables: this.readTablesOption });
  }

  /**
   * Lee el documento y escribe el resultado en `~/.secti_addons/resultados.txt`.
   * @returns Resultado de la lectura.
   */
  async execute(): Promise<PdfReadResult> {
    const result = await this.readDocument();
    await new ResultFileWriter().write(result);
    return result;
  }
}
