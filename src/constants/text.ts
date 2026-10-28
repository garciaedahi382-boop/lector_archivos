export const TEXT_CONFIG = {
  space: ' ',
  sentenceEnd: '.',
  terminalPunctuation: /[.!?:;]$/,
  whitespace: /\s+/g,
  repeatedSymbols: /([^\p{L}\p{N}\s])\1+/gu,
} as const;
