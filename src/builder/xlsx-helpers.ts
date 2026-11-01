import AdmZip from 'adm-zip';
import path from 'node:path';
import { FORMAT_CONFIG } from '../constants/formats';
import { OUTPUT_CONFIG } from '../constants/output';
import { DocumentXmlHelper } from './helpers';

const NS = FORMAT_CONFIG.namespaces.spreadsheet;
const REL_NS = FORMAT_CONFIG.namespaces.officeRelationships;
const PACKAGE_REL_NS = FORMAT_CONFIG.namespaces.packageRelationships;

/**
 * Hoja del libro con su nombre y la ruta interna del XML.
 */
export interface SheetInfo {
  /** Nombre visible de la hoja. */
  name: string;
  /** Ruta de la hoja dentro del zip (ej. `xl/worksheets/sheet1.xml`). */
  path: string;
}

/**
 * Helper de parseo de un `.xlsx`: cadenas compartidas, relaciones y celdas.
 *
 * Todos sus métodos son estáticos porque no mantiene estado.
 */
export class XlsxXmlHelper {
  /**
   * Lee `xl/sharedStrings.xml` (valores de celdas de tipo `s`).
   * @param zip Contenido del `.xlsx`.
   * @returns Cadenas compartidas en el orden del índice referenciado por `v`.
   */
  static readSharedStrings(zip: AdmZip): string[] {
    const buf = zip.readFile(FORMAT_CONFIG.xlsx.sharedStringsPath);
    if (!buf) return [];

    const doc = DocumentXmlHelper.parseXml(buf.toString('utf-8'));
    return Array.from(doc.getElementsByTagNameNS(NS, 'si')).map(si =>
      Array.from(si.getElementsByTagNameNS(NS, 't')).map(t => t.textContent ?? '').join(''),
    );
  }

  /**
   * Lee las relaciones del workbook (`Id` → `Target`).
   * @param zip Contenido del `.xlsx`.
   * @returns Mapa de relaciones; vacío si el archivo no existe.
   */
  static readRelationships(zip: AdmZip): Map<string, string> {
    const relationships = new Map<string, string>();
    const buf = zip.readFile(FORMAT_CONFIG.xlsx.workbookRelsPath);
    if (!buf) return relationships;

    const doc = DocumentXmlHelper.parseXml(buf.toString('utf-8'));
    for (const rel of Array.from(doc.getElementsByTagNameNS(PACKAGE_REL_NS, 'Relationship'))) {
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      if (id && target) relationships.set(id, target);
    }

    return relationships;
  }

  /**
   * Normaliza el `Target` de una relación a una ruta dentro del zip.
   * @param target Valor del atributo `Target`.
   * @returns Ruta relativa a la raíz del paquete.
   */
  static resolveTarget(target: string): string {
    if (!target) return '';
    if (target.startsWith('/')) return target.slice(1);
    return path.posix.normalize(`${FORMAT_CONFIG.xlsx.sheetBasePath}${target}`);
  }

  /**
   * Lee las hojas en el orden declarado en `xl/workbook.xml`.
   * @param zip Contenido del `.xlsx`.
   * @returns Hojas con nombre y ruta de su XML.
   */
  static readSheets(zip: AdmZip): SheetInfo[] {
    const buf = zip.readFile(FORMAT_CONFIG.xlsx.workbookPath);
    if (!buf) return [];

    const relationships = this.readRelationships(zip);
    const doc = DocumentXmlHelper.parseXml(buf.toString('utf-8'));

    return Array.from(doc.getElementsByTagNameNS(NS, 'sheet'))
      .map(sheet => {
        const relId = sheet.getAttributeNS(REL_NS, 'id') ?? '';
        const target = relationships.get(relId) ?? '';
        return { name: sheet.getAttribute('name') ?? '', path: this.resolveTarget(target) };
      })
      .filter(sheet => sheet.path.length > 0);
  }

  /**
   * Obtiene el texto de una celda (`s` compartida, `inlineStr` o valor crudo).
   * @param cell Elemento `c`.
   * @param sharedStrings Cadenas compartidas del libro.
   * @returns Texto de la celda o cadena vacía.
   */
  static readCell(cell: Element, sharedStrings: string[]): string {
    const type = cell.getAttribute('t') ?? '';

    if (type === 'inlineStr') {
      return Array.from(cell.getElementsByTagNameNS(NS, 't'))
        .map(t => t.textContent ?? '')
        .join('')
        .trim();
    }

    const raw = (cell.getElementsByTagNameNS(NS, 'v')[0]?.textContent ?? '').trim();
    if (!raw) return '';
    if (type === 's') return sharedStrings[Number(raw)] ?? raw;

    return raw;
  }

  /**
   * Extrae todas las filas con contenido de una hoja.
   * @param doc DOM de la hoja.
   * @param sharedStrings Cadenas compartidas del libro.
   * @returns Filas ya unidas por `OUTPUT_CONFIG.tableCellSeparator`.
   */
  static readRows(doc: Document, sharedStrings: string[]): string[] {
    return Array.from(doc.getElementsByTagNameNS(NS, 'row'))
      .map(row => this.readRow(row, sharedStrings))
      .filter(row => row.length > 0);
  }

  /**
   * Extrae una fila uniendo sus celdas no vacías.
   * @param row Elemento `row`.
   * @param sharedStrings Cadenas compartidas del libro.
   * @returns Celdas unidas por `OUTPUT_CONFIG.tableCellSeparator`.
   */
  static readRow(row: Element, sharedStrings: string[]): string {
    return Array.from(row.getElementsByTagNameNS(NS, 'c'))
      .map(cell => this.readCell(cell, sharedStrings))
      .filter(text => text.length > 0)
      .join(OUTPUT_CONFIG.tableCellSeparator);
  }
}
