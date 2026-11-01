/**
 * Formatos de archivo soportados y su estructura interna (OOXML).
 */
export const FORMAT_CONFIG = {
  /** Extensiones reconocidas por el CLI (siempre en minúsculas). */
  extensions: {
    pdf: '.pdf',
    pptx: '.pptx',
  },
  /** Namespaces XML de cada formato OOXML. */
  namespaces: {
    /** `w:` de Word (`word/document.xml`). */
    word: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    /** `a:` de DrawingML (texto/tablas de diapositivas). */
    drawing: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  },
  /** Rutas y patrones internos de un `.pptx`. */
  pptx: {
    /** Patrón de las diapositivas; el grupo 1 es el número de diapositiva. */
    slidePattern: '^ppt/slides/slide(\\d+)\\.xml$',
  },
} as const;
