import { VOICEBOT_CONFIG } from '../utils/constants';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker para pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PDFChunk {
  id: string;
  content: string;
  page: number;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
}

export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  pages: number;
  chunks: PDFChunk[];
  uploadedAt: Date;
}

export interface KnowledgeBaseResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Servicio para manejo de PDFs y base de conocimiento
 */
class PDFService {
  private documents: Map<string, PDFDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  /**
   * Procesa un archivo PDF y lo convierte en chunks
   */
  async processPDF(file: File): Promise<KnowledgeBaseResponse> {
    try {
      // Validar archivo
      if (!this.validateFile(file)) {
        return {
          success: false,
          message: 'Archivo no válido',
          error: 'El archivo debe ser un PDF válido de máximo 10MB'
        };
      }

      // Extraer texto del PDF
      const text = await this.extractTextFromPDF(file);
      
      // Dividir en chunks
      const chunks = this.createChunks(text);
      
      // Crear documento
      const document: PDFDocument = {
        id: this.generateId(),
        name: file.name,
        size: file.size,
        pages: chunks.length, // Simplificado
        chunks,
        uploadedAt: new Date()
      };

      // Guardar documento
      this.documents.set(document.id, document);

      // Generar embeddings (simulado por ahora)
      await this.generateEmbeddings(document);

      return {
        success: true,
        message: `PDF procesado exitosamente. ${chunks.length} chunks creados.`,
        data: document
      };

    } catch (error) {
      console.error('Error procesando PDF:', error);
      return {
        success: false,
        message: 'Error procesando PDF',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Valida un archivo PDF
   */
  private validateFile(file: File): boolean {
    const { MAX_FILE_SIZE, ALLOWED_TYPES } = VOICEBOT_CONFIG.KNOWLEDGE_BASE.PDF_UPLOAD;
    
    if (file.size > MAX_FILE_SIZE) {
      return false;
    }
    
    if (!ALLOWED_TYPES.includes(file.type as any)) {
      return false;
    }
    
    return true;
  }

  /**
   * Extrae texto de un PDF usando pdf.js
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  }

  /**
   * Crea chunks de texto para procesamiento
   */
  private createChunks(text: string): PDFChunk[] {
    const { CHUNK_SIZE, OVERLAP } = VOICEBOT_CONFIG.KNOWLEDGE_BASE.PDF_UPLOAD;
    const chunks: PDFChunk[] = [];
    
    let startIndex = 0;
    let chunkId = 0;
    
    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
      const content = text.substring(startIndex, endIndex).trim();
      
      if (content.length > 0) {
        chunks.push({
          id: `chunk_${chunkId}`,
          content,
          page: Math.floor(chunkId / 2) + 1, // Simplificado
          startIndex,
          endIndex
        });
        chunkId++;
      }
      
      const nextStartIndex = endIndex - OVERLAP;
      
      // Evitar bucle infinito si el solapamiento es demasiado grande o el chunk es muy pequeño
      if (nextStartIndex <= startIndex) {
        startIndex = endIndex;
      } else {
        startIndex = nextStartIndex;
      }
    }
    
    return chunks;
  }

  /**
   * Genera embeddings para los chunks (simulado)
   */
  private async generateEmbeddings(document: PDFDocument): Promise<void> {
    // En una implementación real, usarías OpenAI Embeddings API
    for (const chunk of document.chunks) {
      // Simulación de embedding
      const embedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);
      this.embeddings.set(chunk.id, embedding);
    }
  }

  /**
   * Busca chunks similares a una consulta
   */
  async searchSimilarChunks(_query: string, topK: number = 3): Promise<PDFChunk[]> {
    // En una implementación real, usarías similitud coseno
    const allChunks: PDFChunk[] = [];
    
    for (const document of this.documents.values()) {
      allChunks.push(...document.chunks);
    }
    
    // Simulación de búsqueda - retorna chunks aleatorios
    return allChunks
      .sort(() => Math.random() - 0.5)
      .slice(0, topK);
  }

  /**
   * Obtiene contexto relevante para una pregunta
   */
  async getRelevantContext(question: string): Promise<string> {
    if (!VOICEBOT_CONFIG.KNOWLEDGE_BASE.ENABLED) {
      return '';
    }

    const similarChunks = await this.searchSimilarChunks(
      question, 
      VOICEBOT_CONFIG.KNOWLEDGE_BASE.VECTOR_STORE.SIMILARITY_TOP_K
    );

    return similarChunks
      .map(chunk => chunk.content)
      .join('\n\n');
  }

  /**
   * Lista todos los documentos cargados
   */
  getDocuments(): PDFDocument[] {
    return Array.from(this.documents.values());
  }

  /**
   * Elimina un documento
   */
  deleteDocument(documentId: string): boolean {
    const document = this.documents.get(documentId);
    if (!document) return false;

    // Eliminar embeddings
    for (const chunk of document.chunks) {
      this.embeddings.delete(chunk.id);
    }

    // Eliminar documento
    this.documents.delete(documentId);
    return true;
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Instancia singleton
export const pdfService = new PDFService(); 