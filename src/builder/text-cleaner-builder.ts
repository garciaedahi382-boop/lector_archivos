import { TEXT_CONFIG } from '../constants/text';

/**
 * Builder de limpieza de texto aplicado a cada parte del documento antes de
 * escribirla en el archivo de resultados.
 *
 * @example
 * const texto = new TextCleanerBuilder('hola   mundo!!!')
 *   .collapseRepeatedSymbols()
 *   .collapseWhitespace()
 *   .ensureSentenceEnd()
 *   .build();
 */
export class TextCleanerBuilder {
  private text: string;

  /** @param text Texto a normalizar. */
  constructor(text: string) {
    this.text = text;
  }

  /**
   * Colapsa símbolos repetidos consecutivos (`!!!` → `!`).
   * @returns La misma instancia para encadenar.
   */
  collapseRepeatedSymbols(): this {
    this.text = this.text.replace(TEXT_CONFIG.repeatedSymbols, '$1');
    return this;
  }

  /**
   * Colapsa espacios/tabs/saltos múltiples en un espacio y recorta extremos.
   * @returns La misma instancia para encadenar.
   */
  collapseWhitespace(): this {
    this.text = this.text.replace(TEXT_CONFIG.whitespace, TEXT_CONFIG.space).trim();
    return this;
  }

  /**
   * Agrega un punto final si el texto no termina en puntuación de cierre.
   * @returns La misma instancia para encadenar.
   */
  ensureSentenceEnd(): this {
    if (this.text && !TEXT_CONFIG.terminalPunctuation.test(this.text)) {
      this.text = `${this.text}${TEXT_CONFIG.sentenceEnd}`;
    }
    return this;
  }

  /** @returns El texto ya normalizado. */
  build(): string {
    return this.text;
  }
}
