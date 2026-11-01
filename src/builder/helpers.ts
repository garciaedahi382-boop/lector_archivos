import { DOMParser } from '@xmldom/xmldom';
import { OUTPUT_CONFIG } from '../constants/output';

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/**
 * Resultado de leer un documento.
 */
export interface PdfReadResult {
  /** Párrafos en el orden del documento. */
  paragraphs: string[];
  /** Listas numeradas/vinadas agrupadas. */
  lists: string[][];
  /** Tablas como filas ya unidas por `OUTPUT_CONFIG.tableCellSeparator`. */
  tables?: string[][];
  /** Título tomado del primer párrafo, si existe. */
  title?: string;
}

/**
 * Opciones de parseo del XML de un documento OOXML.
 */
export interface ParseDocxOptions {
  /** Si es `true`, las tablas se extraen y sus párrafos se omiten del texto. */
  readTables?: boolean;
}

/**
 * Helper de parseo de XML OOXML con estructura Word (`t`, `p`, `tbl`, `tr`, `tc`).
 *
 * Todos sus métodos son estáticos porque no mantiene estado.
 */
export class DocumentXmlHelper {
  /**
   * Concatena el texto (`t`) contenido en un elemento.
   * @param el Elemento contenedor (párrafo, celda, etc.).
   * @returns Texto plano del elemento.
   */
  static findText(el: Element): string {
    const children = el.getElementsByTagNameNS(NS, 't');
    return Array.from(children).map(c => c.textContent || '').join('');
  }

  /**
   * Indica si el párrafo pertenece a una lista numerada/vinada (`numPr`/`ilvl`).
   * @param el Párrafo (`p`).
   */
  static isListItem(el: Element): boolean {
    const numPr = el.getElementsByTagNameNS(NS, 'numPr')[0];
    if (!numPr) return false;
    return numPr.getElementsByTagNameNS(NS, 'ilvl').length > 0;
  }

  /**
   * Obtiene el texto del primer párrafo del cuerpo, usado como título.
   * @param doc Documento DOM.
   * @returns Título o `null` si no hay párrafos con texto.
   */
  static getFirstParagraphTitle(doc: Document): string | null {
    const body = doc.getElementsByTagNameNS(NS, 'body')[0];
    if (!body) return null;
    const firstP = body.getElementsByTagNameNS(NS, 'p')[0];
    if (!firstP) return null;
    return this.findText(firstP).trim() || null;
  }

  /**
   * Indica si el elemento está dentro de una tabla (`tbl`), buscando ancestros.
   * @param el Elemento a inspeccionar.
   */
  static isInsideTable(el: Element): boolean {
    let node: Node | null = el.parentNode;
    while (node) {
      if (node.nodeType === 1 && (node as Element).localName === 'tbl') return true;
      node = node.parentNode;
    }
    return false;
  }

  /**
   * Extrae una fila de tabla uniendo sus celdas no vacías.
   * @param row Fila (`tr`).
   * @returns Celdas unidas por `OUTPUT_CONFIG.tableCellSeparator`.
   */
  static extractTableRow(row: Element): string {
    const cells = Array.from(row.getElementsByTagNameNS(NS, 'tc'));
    return cells
      .map(cell => this.findText(cell).trim())
      .filter(text => text.length > 0)
      .join(OUTPUT_CONFIG.tableCellSeparator);
  }

  /**
   * Extrae todas las tablas del documento.
   * @param doc Documento DOM.
   * @returns Tablas, cada una como lista de filas; las filas vacías se omiten.
   */
  static extractTables(doc: Document): string[][] {
    const tables: string[][] = [];
    const items = Array.from(doc.getElementsByTagNameNS(NS, 'tbl'));

    for (const table of items) {
      const rows = Array.from(table.getElementsByTagNameNS(NS, 'tr'))
        .map(row => this.extractTableRow(row))
        .filter(row => row.length > 0);

      if (rows.length > 0) tables.push(rows);
    }

    return tables;
  }

  /**
   * Recorre los párrafos del documento separando texto de listas.
   * @param doc Documento DOM.
   * @param options Opciones de parseo (lectura de tablas).
   * @returns Párrafos sueltos y listas agrupadas.
   */
  static extractDocumentItems(doc: Document, options: ParseDocxOptions = {}): { paragraphs: string[]; lists: string[][] } {
    const paragraphs: string[] = [];
    const lists: string[][] = [];
    let currentList: string[] = [];

    const items = Array.from(doc.getElementsByTagNameNS(NS, 'p'));

    for (const item of items) {
      if (options.readTables && this.isInsideTable(item)) continue;
      const text = this.findText(item);
      if (!text.trim()) continue;

      if (this.isListItem(item)) {
        currentList.push(text.trim());
      } else {
        if (currentList.length > 0) {
          lists.push(currentList);
          currentList = [];
        }
        paragraphs.push(text.trim());
      }
    }

    if (currentList.length > 0) lists.push(currentList);

    return { paragraphs, lists };
  }

  /**
   * Parsea el XML de un documento completo (párrafos, listas, título y tablas).
   * @param xmlStr Contenido de `word/document.xml`.
   * @param options Opciones de parseo (lectura de tablas).
   * @returns Resultado listo para `ResultFileWriter`.
   */
  static parseDocxXml(xmlStr: string, options: ParseDocxOptions = {}): PdfReadResult {
    const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
    const items = this.extractDocumentItems(doc, options);
    const result: PdfReadResult = options.readTables ? { ...items, tables: this.extractTables(doc) } : items;

    const title = this.getFirstParagraphTitle(doc);
    if (title) result.title = title;

    return result;
  }
}
