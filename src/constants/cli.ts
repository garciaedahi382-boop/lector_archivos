export const CLI_CONFIG = {
  helpFlags: ['-h', '--help'] as readonly string[],
  helpText: [
    'Uso: lector_archivos <archivo.pdf>',
    '',
    'Lee el PDF y guarda el resultado en ~/.secti_addons/resultados.txt',
    '',
    'Opciones:',
    '  -h, --help    Muestra esta ayuda',
  ].join('\n'),
} as const;
