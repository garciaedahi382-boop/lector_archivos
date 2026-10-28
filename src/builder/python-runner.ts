import { PYTHON_CONFIG } from '../config/default';

export interface ExecutionResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface BuilderOptions {
  binary?: string;
  scriptPath?: string;
  code?: string;
  module?: string;
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  flags?: string[];
  encoding?: BufferEncoding;
}

export class PythonRunner {
  private options: BuilderOptions = {};

  constructor(options?: Partial<BuilderOptions>) {
    this.options = { ...options };
  }

  withScript(path: string): this {
    this.options.scriptPath = path;
    return this;
  }

  withCode(code: string): this {
    this.options.code = code;
    return this;
  }

  withModule(name: string): this {
    this.options.module = name;
    return this;
  }

  withTimeout(ms: number): this {
    this.options.timeout = ms;
    return this;
  }

  withCwd(cwd: string): this {
    this.options.cwd = cwd;
    return this;
  }

  withEnv(env: Record<string, string>): this {
    this.options.env = { ...this.options.env, ...env };
    return this;
  }

  addFlag(flag: string): this {
    this.options.flags = [...(this.options.flags ?? []), flag];
    return this;
  }

  private resolveBinary(): string {
    const binary = this.options.binary ?? PYTHON_CONFIG.binaryPath;

    if (binary === 'auto') {
      for (const candidate of ['python3', 'python']) {
        try {
          Bun.spawnSync(['which', candidate]);
          return candidate;
        } catch { /* sigue buscando */ }
      }
      return PYTHON_CONFIG.binaryPath;
    }

    return binary;
  }

  private buildCommand(binary: string): string[] {
    const flags = [...PYTHON_CONFIG.defaultFlags, ...(this.options.flags ?? [])];

    if (this.options.scriptPath) {
      return [binary, ...flags, this.options.scriptPath];
    }
    if (this.options.code !== undefined) {
      return [binary, ...flags, '-c', this.options.code];
    }
    if (this.options.module) {
      return [binary, ...flags, '-m', this.options.module];
    }
    throw new Error('Debes especificar un script (.withScript()) o código (.withCode())');
  }

  private buildEnv(binary: string): Record<string, string> {
    const env: Record<string, string> = {};

    for (const [key, value] of Object.entries(process.env)) {
      if (value) env[key] = value;
    }

    if (this.options.env) {
      Object.assign(env, this.options.env);
    }

    if ((binary.includes('embedded') || binary.includes('embed')) && !env.PYTHONHOME) {
      const binDir = binary.substring(0, binary.lastIndexOf('/'));
      env.PYTHONHOME = binDir;
      env.PYTHONPATH = `${binDir}/python314.zip:${binDir}`;
    }

    return env;
  }

  async execute(): Promise<ExecutionResult> {
    const startTime = performance.now();
    const binary = this.resolveBinary();
    const cmd = this.buildCommand(binary);
    const timeout = this.options.timeout ?? PYTHON_CONFIG.timeoutMs;
    const encoding = this.options.encoding ?? PYTHON_CONFIG.encoding;

    const child = Bun.spawn(cmd, {
      stdin: 'inherit',
      stdout: 'pipe',
      stderr: 'pipe',
      env: this.buildEnv(binary),
      cwd: this.options.cwd,
    });

    if (timeout > 0) {
      setTimeout(() => {
        if (!child.killed) child.kill('SIGTERM');
      }, timeout).unref();
    }

    const exitCode = await child.exited;
    const stdout = child.stdout ? new TextDecoder(encoding).decode(await new Response(child.stdout).arrayBuffer()) : '';
    const stderr = child.stderr ? new TextDecoder(encoding).decode(await new Response(child.stderr).arrayBuffer()) : '';

    return {
      exitCode,
      stdout,
      stderr,
      durationMs: Math.round(performance.now() - startTime),
    };
  }
}
