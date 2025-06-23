import React, { useState, useRef } from 'react';
import { pdfService, PDFDocument, KnowledgeBaseResponse } from '../services/pdfService';
import { VOICEBOT_CONFIG } from '../utils/constants';

interface PDFUploadProps {
  onDocumentAdded?: (document: PDFDocument) => void;
  onDocumentRemoved?: (documentId: string) => void;
}

/**
 * Componente para subir y gestionar PDFs en la base de conocimiento
 */
const PDFUpload: React.FC<PDFUploadProps> = ({ 
  onDocumentAdded, 
  onDocumentRemoved 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [documents, setDocuments] = useState<PDFDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar documentos existentes al montar
  React.useEffect(() => {
    setDocuments(pdfService.getDocuments());
  }, []);

  /**
   * Maneja la subida de un archivo PDF
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Procesando PDF...');

    try {
      const result: KnowledgeBaseResponse = await pdfService.processPDF(file);

      if (result.success) {
        setUploadMessage(`✅ ${result.message}`);
        const newDocument = result.data as PDFDocument;
        setDocuments(prev => [...prev, newDocument]);
        onDocumentAdded?.(newDocument);
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        setUploadMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setUploadMessage('❌ Error procesando el archivo');
      console.error('Error en upload:', error);
    } finally {
      setIsUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Elimina un documento
   */
  const handleDeleteDocument = (documentId: string) => {
    const success = pdfService.deleteDocument(documentId);
    if (success) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      onDocumentRemoved?.(documentId);
    }
  };

  /**
   * Abre el selector de archivos
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!VOICEBOT_CONFIG.KNOWLEDGE_BASE.ENABLED) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          La base de conocimiento está deshabilitada. 
          Habilítala en la configuración para usar PDFs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Subida de archivos */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          {isUploading ? 'Procesando...' : '📄 Subir PDF'}
        </button>
        
        <p className="text-sm text-gray-600 mt-2">
          Máximo {VOICEBOT_CONFIG.KNOWLEDGE_BASE.PDF_UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB
        </p>
        
        {uploadMessage && (
          <p className={`text-sm mt-2 ${
            uploadMessage.startsWith('✅') ? 'text-green-600' : 'text-red-600'
          }`}>
            {uploadMessage}
          </p>
        )}
      </div>

      {/* Lista de documentos */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Documentos cargados ({documents.length})
          </h3>
          
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {document.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {document.chunks.length} chunks • {(document.size / 1024).toFixed(1)}KB • 
                    {document.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={() => handleDeleteDocument(document.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  title="Eliminar documento"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información del sistema */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>• Los PDFs se procesan en chunks de {VOICEBOT_CONFIG.KNOWLEDGE_BASE.PDF_UPLOAD.CHUNK_SIZE} caracteres</p>
        <p>• Se recuperan los {VOICEBOT_CONFIG.KNOWLEDGE_BASE.VECTOR_STORE.SIMILARITY_TOP_K} chunks más relevantes</p>
        <p>• El contexto se incluye automáticamente en las respuestas</p>
      </div>
    </div>
  );
};

export default PDFUpload; 