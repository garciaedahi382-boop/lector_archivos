import AdmZip from 'adm-zip';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { RUNTIME_CONFIG } from '../constants/runtime';

export class EmbeddedPython {
  private readonly bundlePath: string;
  private readonly directory: string;

  constructor(bundlePath: string, baseDir: string = os.homedir()) {
    this.bundlePath = bundlePath;
    this.directory = path.join(
      baseDir,
      RUNTIME_CONFIG.rootFolderName,
      RUNTIME_CONFIG.pythonFolderName,
    );
  }

  get binaryPath(): string {
    return path
      .join(this.directory, RUNTIME_CONFIG.pythonBinaryName)
      .replace(/\\/g, '/');
  }

  async resolve(): Promise<string> {
    const bundle = Buffer.from(await Bun.file(this.bundlePath).arrayBuffer());
    const signature = String(bundle.length);

    if (!(await this.isReady(signature))) {
      await this.extract(bundle, signature);
    }

    return this.binaryPath;
  }

  private markerPath(): string {
    return path.join(this.directory, RUNTIME_CONFIG.readyMarkerName);
  }

  private async isReady(signature: string): Promise<boolean> {
    try {
      return (await readFile(this.markerPath(), 'utf-8')) === signature;
    } catch {
      return false;
    }
  }

  private async extract(bundle: Buffer, signature: string): Promise<void> {
    await rm(this.directory, { recursive: true, force: true });
    await mkdir(this.directory, { recursive: true });
    new AdmZip(bundle).extractAllTo(this.directory, true);
    await writeFile(this.markerPath(), signature, 'utf-8');
  }
}
