import { TEXT_CONFIG } from '../constants/text';

export class TextCleanerBuilder {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  collapseRepeatedSymbols(): this {
    this.text = this.text.replace(TEXT_CONFIG.repeatedSymbols, '$1');
    return this;
  }

  collapseWhitespace(): this {
    this.text = this.text.replace(TEXT_CONFIG.whitespace, TEXT_CONFIG.space).trim();
    return this;
  }

  ensureSentenceEnd(): this {
    if (this.text && !TEXT_CONFIG.terminalPunctuation.test(this.text)) {
      this.text = `${this.text}${TEXT_CONFIG.sentenceEnd}`;
    }
    return this;
  }

  build(): string {
    return this.text;
  }
}
