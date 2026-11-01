# Reglas del Agente

## Principios
- Nunca crear algo que no se haya pedido expl\u00edcitamente
- Nunca generar archivos adicionales no solicitados (README, docs, tests, etc.)
- Solo hacer lo que el usuario dicta
- Ninguna funcionalidad extra no solicitada
- Todo c\u00f3digo auxiliar va dentro de clases, nunca funciones sueltas fuera de clase
- Siempre patrones y principios mencionados por el usuario (Builder, DRY, responsabilidad)
- Cada vez que se agregue algo (archivo, clase, interfaz, método, constante, script) se debe documentar con JSDoc en el mismo cambio

## Ejecuci\u00f3n
- Nunca usar Python del sistema
- Usar siempre Python embebido definido en la config

## MAP
```
index.ts                            CLI.entry: argv[2]=file, argv[3]=-t|--tablas; ext -> pdf|docx|pptx|xlsx builder; otro ext -> exit 1
src/index.ts                        public.api: PythonRunner, PdfReaderBuilder, DocxReaderBuilder, PptxReaderBuilder, XlsxReaderBuilder, PdfReadResult, *ReaderOptions, FORMAT_CONFIG, PYTHON_CONFIG
src/config/default.ts               PYTHON_CONFIG{binaryPath,timeoutMs:60000,encoding,defaultFlags:[-B]}
src/constants/cli.ts                CLI_CONFIG{helpFlags,tableFlags,unsupportedFormatMessage,helpText}
src/constants/formats.ts            FORMAT_CONFIG{extensions{pdf,docx,pptx,xlsx},namespaces{word,drawing,spreadsheet,officeRelationships,packageRelationships},docx{documentPath},pptx{slidePattern},xlsx{workbookPath,workbookRelsPath,sharedStringsPath,sheetBasePath}}
src/constants/output.ts             OUTPUT_CONFIG{folderName:.secti_addons,fileName:resultados.txt,encoding,listItemPrefix:'- ',tableCellSeparator:', ',joiner:' '}
src/constants/runtime.ts            RUNTIME_CONFIG{rootFolderName,pythonFolderName,pythonBinaryName,readyMarkerName}
src/constants/text.ts               TEXT_CONFIG{space,sentenceEnd,terminalPunctuation,whitespace,repeatedSymbols}
src/builder/python-runner.ts        PythonRunner: withScript|withCode|withModule|withTimeout|withCwd|withEnv|addFlag -> execute():ExecutionResult{exitCode,stdout,stderr,durationMs}
src/builder/embedded-python.ts      EmbeddedPython: resolve() -> binaryPath; extract(zip -> ~/.secti_addons/python); marker .ready=byteLength
src/builder/pdf-reader-builder.ts   PdfReaderBuilder{inputFile,outputDocx?,readTables?,*BuilderOptions}: withTables()|convert()|readWithCheerio()|execute():PdfReadResult
src/builder/docx-reader-builder.ts  DocxReaderBuilder{inputFile,readTables?}: withTables()|readDocument()|execute(); AdmZip word/document.xml -> DocumentXmlHelper.parseDocxXml
src/builder/pptx-reader-builder.ts  PptxReaderBuilder{inputFile,readTables?}: withTables()|execute(); slideN.xml ordenado por numero, ns=drawing
src/builder/xlsx-helpers.ts         XlsxXmlHelper{readSharedStrings,readRelationships,resolveTarget,readSheets,readCell,readRows,readRow}; SheetInfo{name,path}
src/builder/xlsx-reader-builder.ts  XlsxReaderBuilder{inputFile,readTables?}: withTables()|execute(); nombre de hoja = parrafo, filas = tabla
src/builder/helpers.ts              DocumentXmlHelper{parseXml,findText,isListItem,getFirstParagraphTitle,isInsideTable,extractTableRow,extractTables,extractDocumentItems,parseDocxXml} (namespace configurable); PdfReadResult{title?,paragraphs[],lists[][],tables?}; ParseDocxOptions{readTables?,namespace?}
src/builder/result-file-writer.ts   ResultFileWriter: write(r):path; filePath; orden: title,paragraphs,lists,tables
src/builder/text-cleaner-builder.ts TextCleanerBuilder: collapseRepeatedSymbols|collapseWhitespace|ensureSentenceEnd -> build():string
dist/python-bundle.zip              asset, import ... with {type:'file'}
python/embedded/                    local embedded runtime
__deps/site-packages                py deps path (pdf2docx). NOT in repo
tests/smoke.test.ts                 smoke de builders (DocxReaderBuilder, XlsxReaderBuilder, PptxReaderBuilder, ResultFileWriter)
tests/exe.smoke.test.ts             smoke del .exe compilado: help, docx, xlsx, pptx, --tablas, formato no soportado
tests/ooxml-fixture.ts              OoxmlFixture: genera/limpia .docx (AdmZip + XML) y .xlsx (exceljs) y .pptx (pptxgenjs) en os.tmpdir()
tests/*.pdf                         PDFs de muestra (tests/ esta en .gitignore)
package.json                        deps: @xmldom/xmldom, adm-zip; devDeps: exceljs, pptxgenjs (solo fixtures); script test=bun test
```

## FLOW
PDF: `index.ts(.pdf) -> EmbeddedPython.resolve() -> PdfReaderBuilder.execute() -> convert() [py -c: pdf2docx Converter, sys.path=__deps/site-packages] -> readWithCheerio() [AdmZip word/document.xml -> DocumentXmlHelper.parseDocxXml ns=word] -> ResultFileWriter.write() [~/.secti_addons/resultados.txt]`

DOCX: `index.ts(.docx) -> DocxReaderBuilder.execute() -> readDocument() [AdmZip word/document.xml -> DocumentXmlHelper.parseDocxXml ns=word] -> ResultFileWriter.write()`

PPTX: `index.ts(.pptx) -> PptxReaderBuilder.execute() -> AdmZip ppt/slides/slideN.xml (orden numerico) -> DocumentXmlHelper.extractDocumentItems|extractTables ns=drawing -> ResultFileWriter.write()`

XLSX: `index.ts(.xlsx) -> XlsxReaderBuilder.execute() -> XlsxXmlHelper.readSharedStrings + readSheets [xl/workbook.xml + xl/_rels/workbook.xml.rels] -> sheetN.xml -> readRows (celdas unidas por ', ') -> ResultFileWriter.write()`

## EDGES
```
constants|config  ->  (leaf, no imports from builder)
builder/*         ->  constants/*, config/*, builder/*
builder/*         ->  X  index.ts
index.ts (root)   ->  src/index.ts, embedded-python [only caller], constants/cli, constants/formats
src/index.ts      ->  X  embedded-python, X  constants (solo re-exporta builders/tipos)
tests/*           ->  src/index.ts, builder/* [fixtures], lector_archivos.exe [spawn]
```

## TRAPS
- `readWithCheerio()` no usa Cheerio: AdmZip + @xmldom/xmldom. No renombrar sin pedido.
- `PdfReaderOptions` definido en pdf-reader-builder.ts, re-exportado en src/index.ts.
- `__deps/site-packages` se resuelve con `process.cwd()`: cwd incorrecto = ImportError pdf2docx.
- `PYTHONHOME`/`PYTHONPATH` solo se setean si binary incluye 'embedded'|'embed'.
- `resolveBinary('auto')`: usa which python3|python (prohibido por regla de Python embebido).
- package.json script `run:example` -> src/scripts/example.ts (no existe).
- DOCX/PPTX/XLSX no usan Python: son zip + XML (`adm-zip`, `@xmldom/xmldom`). Solo PDF pasa por `EmbeddedPython`.
- DOCX y el DOCX intermedio del PDF comparten `DocumentXmlHelper.parseDocxXml`; el PDF usa `readWithCheerio()`, el DOCX `readDocument()`.
- PDF usa el DOCX intermedio de pdf2docx: las tablas llegan como `w:tbl`, no como texto suelto.
- `tables` solo existe cuando se pidio `readTables`/`--tablas`; si no, las celdas quedan dentro de `paragraphs`.
- `tests/` esta en `.gitignore`: los tests y fixtures no se versionan.
- `lector_archivos.exe` es un binario compilado: hay que regenerarlo (`bun build --compile index.ts --outfile lector_archivos.exe`) tras cualquier cambio.

## CONV
- JSDoc obligatorio: `/** */` en cada archivo, clase, interfaz, método y constante nueva o modificada, con `@param`/`@returns` cuando aplique.
- helper = static method de clase. Prohibido función suelta top-level.
- builder: `withX():this`, terminador `build()`|`execute()`.
- 0 deps de produccion nuevas: solo `@xmldom/xmldom`, `adm-zip`. devDeps permitidas solo para generar fixtures de test (`exceljs`, `pptxgenjs`).
- tests con `bun test`; generar fixtures con clases helper (`OoxmlFixture`), nunca funciones sueltas.
- TS strict + noUncheckedIndexedAccess + noEmit. runtime Bun.
- python: siempre PYTHON_CONFIG.binaryPath o EmbeddedPython, nunca system python.
