import AdmZip from 'adm-zip';
import { FORMAT_CONFIG } from '../constants/formats';
import { DocumentXmlHelper, type PdfReadResult } from './helpers';
import { ResultFileWriter } from './result-file-writer';

/**
 * Opciones de `PptxReaderBuilder`.
 */
export interface PptxReaderOptions {
  /** Ruta del `.pptx` a leer. */
  inputFile: string;
  /** Si es `true`, extrae también las tablas de las diapositivas. */
  readTables?: boolean;
}

/** Patrón que identifica las diapositivas y captura su número. */
const SLIDE_PATTERN = new RegExp(FORMAT_CONFIG.pptx.slidePattern);

/**
 * Builder que lee un `.pptx` (zip + `ppt/slides/slideN.xml`) sin Python.
 *
 * @example
 * const result = await new PptxReaderBuilder({ inputFile: 'x.pptx' })
 *   .withTables()
 *   .execute();
 */
export class PptxReaderBuilder {
  private inputPath: string;
  private readTablesOption: boolean;

  /** @param options Archivo de entrada y si se leen tablas. */
  constructor(options: PptxReaderOptions) {
    this.inputPath = options.inputFile;
    this.readTablesOption = options.readTables ?? false;
  }

  /**
   * Activa o desactiva la lectura de tablas de diapositiva.
   * @param readTables Valor a aplicar (`true` por defecto).
   */
  withTables(readTables: boolean = true): this {
    this.readTablesOption = readTables;
    return this;
  }

  /**
   * Obtiene el número de diapositiva a partir de la ruta interna.
   * @param entryName Nombre de la entrada del zip.
   */
  private slideNumber(entryName: string): number {
    const match = SLIDE_PATTERN.exec(entryName);
    return match?.[1] ? Number(match[1]) : 0;
  }

  /**
   * Lista las diapositivas del zip ordenadas por número.
   * @param zip Contenido del `.pptx`.
   * @returns Rutas internas `ppt/slides/slideN.xml` en orden. */
  private slideEntries(zip: AdmZip): string[] {
    return zip
      .getEntries()
      .map(entry => entry.entryName)
      .filter(entryName => SLIDE_PATTERN.test(entryName))
      .sort((a, b) => this.slideNumber(a) - this.slideNumber(b));
  }

  /**
   * Extrae párrafos, listas y (opcionalmente) tablas de una diapositiva.
   * @param zip Contenido del `.pptx`.
   * @param entryName Ruta interna de la diapositiva.
   * @returns Resultado parcial de esa diapositiva.
   */
  private readSlide(zip: AdmZip, entryName: string): PdfReadResult {
    const buf = zip.readFile(entryName);
    if (!buf) return { paragraphs: [], lists: [] };

    const namespace = FORMAT_CONFIG.namespaces.drawing;
    const options = { readTables: this.readTablesOption, namespace };
    const doc = DocumentXmlHelper.parseXml(buf.toString('utf-8'));
    const items = DocumentXmlHelper.extractDocumentItems(doc, options);

    const result: PdfReadResult = { paragraphs: items.paragraphs, lists: items.lists };
    if (this.readTablesOption) result.tables = DocumentXmlHelper.extractTables(doc, namespace);

    return result;
  }

  /**
   * Lee todas las diapositivas y escribe el resultado en
   * `~/.secti_addons/resultados.txt`.
   * @returns Resultado de la lectura.
   */
  async execute(): Promise<PdfReadResult> {
    const zip = new AdmZip(this.inputPath);
    const result: PdfReadResult = { paragraphs: [], lists: [], tables: [] };

    for (const entryName of this.slideEntries(zip)) {
      const slide = this.readSlide(zip, entryName);
      result.paragraphs.push(...slide.paragraphs);
      result.lists.push(...slide.lists);
      if (slide.tables) result.tables?.push(...slide.tables);
    }

    await new ResultFileWriter().write(result);
    return result;
  }
}
