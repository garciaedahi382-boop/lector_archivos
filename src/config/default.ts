
export const PYTHON_CONFIG = {
  binaryPath: 'python/embedded/python.exe',
  timeoutMs: 60_000,
  encoding: 'utf-8' as BufferEncoding,
  defaultFlags: ['-B'],
} as const;
