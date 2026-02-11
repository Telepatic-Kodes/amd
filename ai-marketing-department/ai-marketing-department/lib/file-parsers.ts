/**
 * File Parsers - Utilidades para extraer contenido de archivos PDF, DOCX y TXT
 *
 * Proporciona funciones para parsear diferentes formatos de archivo y convertir
 * su contenido a texto plano y HTML compatible con TipTap.
 */

// Note: These imports use dynamic imports in the functions to avoid build-time issues
// pdf-parse and mammoth will be imported when needed

/**
 * Contenido parseado de un archivo con metadata
 */
export interface ParsedContent {
  text: string;        // Texto plano extraído
  html: string;        // Contenido HTML formateado (compatible con TipTap)
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;  // Tamaño en bytes
    wordCount: number;
    readingTime: number; // Minutos estimados de lectura
  };
}

/**
 * Error de parseo con información del archivo
 */
export interface ParseError {
  error: string;
  fileName: string;
  fileType: string;
}

/**
 * Resultado de validación de archivo
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida un archivo antes de parsearlo
 *
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (default: 10)
 * @returns Resultado de validación con mensaje de error si es inválido
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 10
): ValidationResult {
  // Validar tamaño
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB. Tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Validar tipo de archivo
  const supportedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no soportado. Solo se permiten PDF, DOCX y TXT. Tu archivo: ${file.type || "desconocido"}`,
    };
  }

  return { valid: true };
}

/**
 * Calcula el conteo de palabras de un texto
 */
function calculateWordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Calcula el tiempo estimado de lectura (200 palabras/minuto)
 */
function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

/**
 * Convierte texto plano a HTML básico con párrafos
 */
function textToHtml(text: string): string {
  // Dividir por saltos de línea dobles (párrafos)
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map((para) => {
      // Preservar saltos de línea simples como <br>
      const lines = para.trim().split(/\n/).filter((line) => line.trim());
      if (lines.length === 0) return "";

      const content = lines.join("<br>");
      return `<p>${content}</p>`;
    })
    .filter((p) => p)
    .join("");
}

/**
 * Extrae texto plano de HTML de forma segura
 */
function extractTextFromHtml(html: string): string {
  // Usar DOMParser para extraer texto de forma segura sin ejecutar scripts
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

/**
 * Parsea un archivo PDF y extrae su contenido
 *
 * @param file - Archivo PDF
 * @returns Contenido parseado con texto y HTML
 */
export async function parsePdf(file: File): Promise<ParsedContent> {
  try {
    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Importar pdf-parse dinámicamente - usar default para CJS
    const pdfParseModule = await import("pdf-parse");
    // @ts-expect-error - El módulo tiene diferentes estructuras en browser vs Node
    const pdfParse = pdfParseModule.default || pdfParseModule;

    // Parsear el PDF
    const data = await pdfParse(Buffer.from(arrayBuffer));

    // Extraer texto
    const text = data.text.trim();

    if (!text) {
      throw new Error("El PDF no contiene texto extraíble");
    }

    // Convertir a HTML
    const html = textToHtml(text);

    // Calcular metadata
    const wordCount = calculateWordCount(text);
    const readingTime = calculateReadingTime(wordCount);

    return {
      text,
      html,
      metadata: {
        fileName: file.name,
        fileType: "PDF",
        fileSize: file.size,
        wordCount,
        readingTime,
      },
    };
  } catch (error) {
    throw new Error(
      `Error al parsear PDF: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }
}

/**
 * Parsea un archivo DOCX y extrae su contenido con formato
 *
 * @param file - Archivo DOCX
 * @returns Contenido parseado con texto y HTML preservando formato
 */
export async function parseDocx(file: File): Promise<ParsedContent> {
  try {
    // Leer el archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Importar mammoth dinámicamente - usar default
    const mammothModule = await import("mammoth");
    const mammoth = mammothModule.default || mammothModule;

    // Convertir a HTML con mammoth (preserva formato)
    const result = await mammoth.convertToHtml({
      arrayBuffer,
    });

    const html = result.value.trim();

    if (!html) {
      throw new Error("El documento DOCX está vacío");
    }

    // Extraer texto plano del HTML de forma segura usando DOMParser
    const text = extractTextFromHtml(html);

    // Calcular metadata
    const wordCount = calculateWordCount(text);
    const readingTime = calculateReadingTime(wordCount);

    return {
      text,
      html,
      metadata: {
        fileName: file.name,
        fileType: "DOCX",
        fileSize: file.size,
        wordCount,
        readingTime,
      },
    };
  } catch (error) {
    throw new Error(
      `Error al parsear DOCX: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }
}

/**
 * Parsea un archivo TXT y extrae su contenido
 *
 * @param file - Archivo TXT
 * @returns Contenido parseado con texto y HTML
 */
export async function parseTxt(file: File): Promise<ParsedContent> {
  try {
    // Leer como texto
    const text = await file.text();

    if (!text.trim()) {
      throw new Error("El archivo de texto está vacío");
    }

    // Convertir a HTML
    const html = textToHtml(text);

    // Calcular metadata
    const wordCount = calculateWordCount(text);
    const readingTime = calculateReadingTime(wordCount);

    return {
      text,
      html,
      metadata: {
        fileName: file.name,
        fileType: "TXT",
        fileSize: file.size,
        wordCount,
        readingTime,
      },
    };
  } catch (error) {
    throw new Error(
      `Error al parsear TXT: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }
}

/**
 * Parsea un archivo según su tipo (PDF, DOCX o TXT)
 *
 * Función principal que enruta al parser apropiado según el tipo de archivo
 *
 * @param file - Archivo a parsear
 * @returns Contenido parseado o error
 */
export async function parseFile(
  file: File
): Promise<ParsedContent | ParseError> {
  try {
    // Validar archivo primero
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        error: validation.error || "Archivo inválido",
        fileName: file.name,
        fileType: file.type,
      };
    }

    // Enrutar al parser apropiado
    switch (file.type) {
      case "application/pdf":
        return await parsePdf(file);

      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return await parseDocx(file);

      case "text/plain":
        return await parseTxt(file);

      default:
        return {
          error: `Tipo de archivo no soportado: ${file.type}`,
          fileName: file.name,
          fileType: file.type,
        };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al parsear archivo",
      fileName: file.name,
      fileType: file.type,
    };
  }
}

/**
 * Type guard para verificar si el resultado es ParsedContent o ParseError
 */
export function isParsedContent(
  result: ParsedContent | ParseError
): result is ParsedContent {
  return "text" in result && "html" in result && "metadata" in result;
}

/**
 * Type guard para verificar si el resultado es ParseError
 */
export function isParseError(
  result: ParsedContent | ParseError
): result is ParseError {
  return "error" in result;
}
