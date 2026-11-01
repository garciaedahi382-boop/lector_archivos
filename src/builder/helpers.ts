import { DOMParser } from '@xmldom/xmldom';
import { FORMAT_CONFIG } from '../constants/formats';
import { OUTPUT_CONFIG } from '../constants/output';

/** Namespace XML usado cuando el helper no recibe uno explícito (Word). */
const DEFAULT_NS = FORMAT_CONFIG.namespaces.word;

/**
 * Resultado de leer un documento (DOCX de pdf2docx, PPTX o XLSX).
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
  /** Namespace XML a leer (Word por defecto; DrawingML para PPTX). */
  namespace?: string;
}

/**
 * Helper de parseo de XML OOXML con estructura Word/DrawingML
 * (`t`, `p`, `tbl`, `tr`, `tc`).
 *
 * Todos sus métodos son estáticos porque no mantiene estado; el namespace es
 * un parámetro para poder reutilizarlo con PPTX.
 */
export class DocumentXmlHelper {
  /**
   * Parsea una cadena XML.
   * @param xmlStr Contenido XML.
   * @returns Documento DOM.
   */
  static parseXml(xmlStr: string): Document {
    return new DOMParser().parseFromString(xmlStr, 'text/xml');
  }

  /**
   * Concatena el texto (`t`) contenido en un elemento.
   * @param el Elemento contenedor (párrafo, celda, etc.).
   * @param namespace Namespace XML a consultar.
   * @returns Texto plano del elemento.
   */
  static findText(el: Element, namespace: string = DEFAULT_NS): string {
    const children = el.getElementsByTagNameNS(namespace, 't');
    return Array.from(children).map(c => c.textContent || '').join('');
  }

  /**
   * Indica si el párrafo pertenece a una lista numerada/vinada (`numPr`/`ilvl`).
   * @param el Párrafo (`p`).
   * @param namespace Namespace XML a consultar.
   */
  static isListItem(el: Element, namespace: string = DEFAULT_NS): boolean {
    const numPr = el.getElementsByTagNameNS(namespace, 'numPr')[0];
    if (!numPr) return false;
    return numPr.getElementsByTagNameNS(namespace, 'ilvl').length > 0;
  }

  /**
   * Obtiene el texto del primer párrafo del cuerpo, usado como título.
   * @param doc Documento DOM.
   * @param namespace Namespace XML a consultar.
   * @returns Título o `null` si no hay párrafos con texto.
   */
  static getFirstParagraphTitle(doc: Document, namespace: string = DEFAULT_NS): string | null {
    const body = doc.getElementsByTagNameNS(namespace, 'body')[0];
    if (!body) return null;
    const firstP = body.getElementsByTagNameNS(namespace, 'p')[0];
    if (!firstP) return null;
    return this.findText(firstP, namespace).trim() || null;
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
   * @param namespace Namespace XML a consultar.
   * @returns Celdas unidas por `OUTPUT_CONFIG.tableCellSeparator`.
   */
  static extractTableRow(row: Element, namespace: string = DEFAULT_NS): string {
    const cells = Array.from(row.getElementsByTagNameNS(namespace, 'tc'));
    return cells
      .map(cell => this.findText(cell, namespace).trim())
      .filter(text => text.length > 0)
      .join(OUTPUT_CONFIG.tableCellSeparator);
  }

  /**
   * Extrae todas las tablas del documento.
   * @param doc Documento DOM.
   * @param namespace Namespace XML a consultar.
   * @returns Tablas, cada una como lista de filas; las filas vacías se omiten.
   */
  static extractTables(doc: Document, namespace: string = DEFAULT_NS): string[][] {
    const tables: string[][] = [];
    const items = Array.from(doc.getElementsByTagNameNS(namespace, 'tbl'));

    for (const table of items) {
      const rows = Array.from(table.getElementsByTagNameNS(namespace, 'tr'))
        .map(row => this.extractTableRow(row, namespace))
        .filter(row => row.length > 0);

      if (rows.length > 0) tables.push(rows);
    }

    return tables;
  }

  /**
   * Recorre los párrafos del documento separando texto de listas.
   * @param doc Documento DOM.
   * @param options Opciones de parseo (namespace y lectura de tablas).
   * @returns Párrafos sueltos y listas agrupadas.
   */
  static extractDocumentItems(doc: Document, options: ParseDocxOptions = {}): { paragraphs: string[]; lists: string[][] } {
    const paragraphs: string[] = [];
    const lists: string[][] = [];
    let currentList: string[] = [];

    const namespace = options.namespace ?? DEFAULT_NS;
    const items = Array.from(doc.getElementsByTagNameNS(namespace, 'p'));

    for (const item of items) {
      if (options.readTables && this.isInsideTable(item)) continue;
      const text = this.findText(item, namespace);
      if (!text.trim()) continue;

      if (this.isListItem(item, namespace)) {
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
   * @param xmlStr Contenido de `word/document.xml` o de una diapositiva.
   * @param options Opciones de parseo (namespace y lectura de tablas).
   * @returns Resultado listo para `ResultFileWriter`.
   */
  static parseDocxXml(xmlStr: string, options: ParseDocxOptions = {}): PdfReadResult {
    const doc = this.parseXml(xmlStr);
    const namespace = options.namespace ?? DEFAULT_NS;
    const items = this.extractDocumentItems(doc, options);
    const result: PdfReadResult = options.readTables ? { ...items, tables: this.extractTables(doc, namespace) } : items;

    const title = this.getFirstParagraphTitle(doc, namespace);
    if (title) result.title = title;

    return result;
  }
}
