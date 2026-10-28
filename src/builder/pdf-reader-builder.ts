import AdmZip from 'adm-zip';
import path from 'node:path';
import { PYTHON_CONFIG } from '../config/default';
import type { BuilderOptions } from './python-runner';
import { PythonRunner } from './python-runner';
import { DocumentXmlHelper, type PdfReadResult } from './helpers';
import { ResultFileWriter } from './result-file-writer';

export type { PdfReadResult };

export interface PdfReaderOptions extends Partial<BuilderOptions> {
  inputFile: string;
  outputDocx?: string;
}

const LOCAL_PACKAGES = path.join(process.cwd(), '__deps', 'site-packages');

export class PdfReaderBuilder {
  private inputPath: string;
  private outputPath: string;
  private runnerOpts: Partial<BuilderOptions>;

  constructor(options: PdfReaderOptions) {
    this.inputPath = options.inputFile;
    this.outputPath = options.outputDocx ?? `__tmp_${Date.now()}.docx`;
    this.runnerOpts = options;
  }

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

  async readWithCheerio(): Promise<PdfReadResult> {
    const zip = new AdmZip(this.outputPath);
    const xmlBuf = zip.readFile('word/document.xml');

    if (!xmlBuf) throw new Error('No se encontro document.xml');

    const xmlStr = xmlBuf.toString('utf-8');
    return DocumentXmlHelper.parseDocxXml(xmlStr);
  }

  async execute(): Promise<PdfReadResult> {
    await this.convert();
    const result = await this.readWithCheerio();
    await new ResultFileWriter().write(result);
    return result;
  }
}
