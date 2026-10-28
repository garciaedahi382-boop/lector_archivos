import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { OUTPUT_CONFIG } from '../constants/output';
import type { PdfReadResult } from './helpers';
import { TextCleanerBuilder } from './text-cleaner-builder';

export class ResultFileWriter {
  private readonly directory: string;

  constructor(baseDir: string = os.homedir()) {
    this.directory = path.join(baseDir, OUTPUT_CONFIG.folderName);
  }

  get filePath(): string {
    return path.join(this.directory, OUTPUT_CONFIG.fileName);
  }

  async write(result: PdfReadResult): Promise<string> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.filePath, this.format(result), OUTPUT_CONFIG.encoding);
    return this.filePath;
  }

  private format(result: PdfReadResult): string {
    const parts: string[] = [];

    if (result.title) parts.push(result.title);

    parts.push(...result.paragraphs);

    for (const list of result.lists) {
      parts.push(...list.map(item => `${OUTPUT_CONFIG.listItemPrefix}${item}`));
    }

    return parts
      .map(part => this.clean(part))
      .filter(part => part.length > 0)
      .join(OUTPUT_CONFIG.joiner);
  }

  private clean(text: string): string {
    return new TextCleanerBuilder(text)
      .collapseRepeatedSymbols()
      .collapseWhitespace()
      .ensureSentenceEnd()
      .build();
  }
}
