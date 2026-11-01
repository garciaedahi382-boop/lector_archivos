/**
 * Formatos de archivo soportados y su estructura interna (OOXML).
 */
export const FORMAT_CONFIG = {
  /** Extensiones reconocidas por el CLI (siempre en minúsculas). */
  extensions: {
    pdf: '.pdf',
    pptx: '.pptx',
    xlsx: '.xlsx',
  },
  /** Namespaces XML de cada formato OOXML. */
  namespaces: {
    /** `w:` de Word (`word/document.xml`). */
    word: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    /** `a:` de DrawingML (texto/tablas de diapositivas). */
    drawing: 'http://schemas.openxmlformats.org/drawingml/2006/main',
    /** Hoja de cálculo (`workbook.xml`, `sharedStrings.xml`, `sheetN.xml`). */
    spreadsheet: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    /** Relaciones de documento (`r:id` dentro de `workbook.xml`). */
    officeRelationships: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    /** Relaciones del paquete (`workbook.xml.rels`). */
    packageRelationships: 'http://schemas.openxmlformats.org/package/2006/relationships',
  },
  /** Rutas y patrones internos de un `.pptx`. */
  pptx: {
    /** Patrón de las diapositivas; el grupo 1 es el número de diapositiva. */
    slidePattern: '^ppt/slides/slide(\\d+)\\.xml$',
  },
  /** Rutas internas de un `.xlsx`. */
  xlsx: {
    /** Índice de hojas y nombres. */
    workbookPath: 'xl/workbook.xml',
    /** Relaciones que mapean `r:id` a la ruta de cada hoja. */
    workbookRelsPath: 'xl/_rels/workbook.xml.rels',
    /** Tabla de cadenas compartidas (valores de celdas de texto). */
    sharedStringsPath: 'xl/sharedStrings.xml',
    /** Prefijo al que son relativos los `Target` de las relaciones. */
    sheetBasePath: 'xl/',
  },
} as const;
