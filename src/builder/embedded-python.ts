import AdmZip from 'adm-zip';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { RUNTIME_CONFIG } from '../constants/runtime';

/**
 * Runtime de Python embebido empaquetado en un zip.
 *
 * Extrae el bundle en `~/.secti_addons/python` la primera vez (o cuando cambia
 * el tamaño del zip) y expone la ruta del binario.
 */
export class EmbeddedPython {
  private readonly bundlePath: string;
  private readonly directory: string;

  /**
   * @param bundlePath Ruta del `python-bundle.zip` embebido en el ejecutable.
   * @param baseDir Carpeta base donde extraer el runtime (por defecto el home).
   */
  constructor(bundlePath: string, baseDir: string = os.homedir()) {
    this.bundlePath = bundlePath;
    this.directory = path.join(
      baseDir,
      RUNTIME_CONFIG.rootFolderName,
      RUNTIME_CONFIG.pythonFolderName,
    );
  }

  /** @returns Ruta del binario de Python dentro del runtime extraído. */
  get binaryPath(): string {
    return path
      .join(this.directory, RUNTIME_CONFIG.pythonBinaryName)
      .replace(/\\/g, '/');
  }

  /**
   * Garantiza que el runtime esté extraído y vigente.
   * @returns Ruta del binario de Python embebido.
   */
  async resolve(): Promise<string> {
    const bundle = Buffer.from(await Bun.file(this.bundlePath).arrayBuffer());
    const signature = String(bundle.length);

    if (!(await this.isReady(signature))) {
      await this.extract(bundle, signature);
    }

    return this.binaryPath;
  }

  /** @returns Ruta del archivo marcador de extracción completada. */
  private markerPath(): string {
    return path.join(this.directory, RUNTIME_CONFIG.readyMarkerName);
  }

  /**
   * Indica si el runtime ya está extraído para la firma del bundle actual.
   * @param signature Firma del bundle (su tamaño en bytes).
   */
  private async isReady(signature: string): Promise<boolean> {
    try {
      return (await readFile(this.markerPath(), 'utf-8')) === signature;
    } catch {
      return false;
    }
  }

  /**
   * Borra el runtime previo, extrae el bundle y escribe el marcador.
   * @param bundle Contenido del zip.
   * @param signature Firma a guardar en el marcador.
   */
  private async extract(bundle: Buffer, signature: string): Promise<void> {
    await rm(this.directory, { recursive: true, force: true });
    await mkdir(this.directory, { recursive: true });
    new AdmZip(bundle).extractAllTo(this.directory, true);
    await writeFile(this.markerPath(), signature, 'utf-8');
  }
}
