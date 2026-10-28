import { DOMParser } from '@xmldom/xmldom';

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export interface PdfReadResult {
  paragraphs: string[];
  lists: string[][];
  title?: string;
}

export class DocumentXmlHelper {
  static findText(el: Element): string {
    const children = el.getElementsByTagNameNS(NS, 't');
    return Array.from(children).map(c => c.textContent || '').join('');
  }

  static isListItem(el: Element): boolean {
    const numPr = el.getElementsByTagNameNS(NS, 'numPr')[0];
    if (!numPr) return false;
    return numPr.getElementsByTagNameNS(NS, 'ilvl').length > 0;
  }

  static getFirstParagraphTitle(doc: Document): string | null {
    const body = doc.getElementsByTagNameNS(NS, 'body')[0];
    if (!body) return null;
    const firstP = body.getElementsByTagNameNS(NS, 'p')[0];
    if (!firstP) return null;
    return this.findText(firstP).trim() || null;
  }

  static extractDocumentItems(doc: Document): { paragraphs: string[]; lists: string[][] } {
    const paragraphs: string[] = [];
    const lists: string[][] = [];
    let currentList: string[] = [];

    const items = doc.getElementsByTagNameNS(NS, 'p');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
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

  static parseDocxXml(xmlStr: string): PdfReadResult {
    const doc = new DOMParser().parseFromString(xmlStr, 'text/xml');
    const items = this.extractDocumentItems(doc);
    const result: PdfReadResult = items;

    const title = this.getFirstParagraphTitle(doc);
    if (title) result.title = title;

    return result;
  }
}
