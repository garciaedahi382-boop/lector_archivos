import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { OUTPUT_CONFIG } from '../constants/output';
import type { PdfReadResult } from './helpers';
import { TextCleanerBuilder } from './text-cleaner-builder';

/**
 * Escribe el resultado de la lectura en un archivo de texto plano.
 *
 * Orden de salida: título, párrafos, listas (con prefijo `- `) y filas de tabla
 * (celdas unidas por coma). Cada parte pasa por `TextCleanerBuilder`.
 */
export class ResultFileWriter {
  private readonly directory: string;

  /** @param baseDir Carpeta base donde crear `.secti_addons` (por defecto el home). */
  constructor(baseDir: string = os.homedir()) {
    this.directory = path.join(baseDir, OUTPUT_CONFIG.folderName);
  }

  /** @returns Ruta absoluta del archivo de resultados. */
  get filePath(): string {
    return path.join(this.directory, OUTPUT_CONFIG.fileName);
  }

  /**
   * Crea la carpeta si no existe y sobrescribe el archivo de resultados.
   * @param result Resultado de la lectura.
   * @returns Ruta del archivo escrito.
   */
  async write(result: PdfReadResult): Promise<string> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.filePath, this.format(result), OUTPUT_CONFIG.encoding);
    return this.filePath;
  }

  /**
   * Compone el texto final uniendo las partes limpias.
   * @param result Resultado de la lectura.
   * @returns Contenido del archivo.
   */
  private format(result: PdfReadResult): string {
    const parts: string[] = [];

    if (result.title) parts.push(result.title);

    parts.push(...result.paragraphs);

    for (const list of result.lists) {
      parts.push(...list.map(item => `${OUTPUT_CONFIG.listItemPrefix}${item}`));
    }

    for (const table of result.tables ?? []) {
      parts.push(...table);
    }

    return parts
      .map(part => this.clean(part))
      .filter(part => part.length > 0)
      .join(OUTPUT_CONFIG.joiner);
  }

  /**
   * Normaliza una parte del documento.
   * @param text Texto crudo.
   * @returns Texto sin símbolos repetidos, sin espacios múltiples y con cierre.
   */
  private clean(text: string): string {
    return new TextCleanerBuilder(text)
      .collapseRepeatedSymbols()
      .collapseWhitespace()
      .ensureSentenceEnd()
      .build();
  }
}
