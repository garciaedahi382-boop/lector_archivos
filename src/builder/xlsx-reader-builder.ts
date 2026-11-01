import AdmZip from 'adm-zip';
import { DocumentXmlHelper, type PdfReadResult } from './helpers';
import { ResultFileWriter } from './result-file-writer';
import { XlsxXmlHelper } from './xlsx-helpers';

/**
 * Opciones de `XlsxReaderBuilder`.
 */
export interface XlsxReaderOptions {
  /** Ruta del `.xlsx` a leer. */
  inputFile: string;
  /** Si es `true`, las filas se agrupan como tablas; si no, van a `paragraphs`. */
  readTables?: boolean;
}

/**
 * Builder que lee un `.xlsx` (zip + XML de hojas) sin Python.
 *
 * Por cada hoja con contenido agrega el nombre como párrafo y luego sus filas.
 *
 * @example
 * const result = await new XlsxReaderBuilder({ inputFile: 'x.xlsx' })
 *   .withTables()
 *   .execute();
 */
export class XlsxReaderBuilder {
  private inputPath: string;
  private readTablesOption: boolean;

  /** @param options Archivo de entrada y si se agrupan las filas como tablas. */
  constructor(options: XlsxReaderOptions) {
    this.inputPath = options.inputFile;
    this.readTablesOption = options.readTables ?? false;
  }

  /**
   * Activa o desactiva la agrupación de filas como tablas.
   * @param readTables Valor a aplicar (`true` por defecto).
   */
  withTables(readTables: boolean = true): this {
    this.readTablesOption = readTables;
    return this;
  }

  /**
   * Lee todas las hojas y escribe el resultado en
   * `~/.secti_addons/resultados.txt`.
   * @returns Resultado de la lectura.
   */
  async execute(): Promise<PdfReadResult> {
    const zip = new AdmZip(this.inputPath);
    const sharedStrings = XlsxXmlHelper.readSharedStrings(zip);
    const result: PdfReadResult = { paragraphs: [], lists: [], tables: [] };

    for (const sheet of XlsxXmlHelper.readSheets(zip)) {
      const buf = zip.readFile(sheet.path);
      if (!buf) continue;

      const doc = DocumentXmlHelper.parseXml(buf.toString('utf-8'));
      const rows = XlsxXmlHelper.readRows(doc, sharedStrings);
      if (rows.length === 0) continue;

      result.paragraphs.push(sheet.name);

      if (this.readTablesOption) result.tables?.push(rows);
      else result.paragraphs.push(...rows);
    }

    await new ResultFileWriter().write(result);
    return result;
  }
}
