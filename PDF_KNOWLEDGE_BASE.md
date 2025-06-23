# 📄 Base de Conocimiento con PDFs

Guía completa para implementar y usar la funcionalidad de base de conocimiento con PDFs en el VoiceBot.

## 🎯 ¿Qué es RAG?

**RAG (Retrieval-Augmented Generation)** es una técnica que combina:
- **Retrieval**: Búsqueda de información relevante en una base de datos
- **Augmented**: Aumenta las respuestas del modelo con contexto específico
- **Generation**: Genera respuestas más precisas y fundamentadas

## 🚀 Implementación Completa

### 1. **Habilitar la funcionalidad**

Edita `src/utils/constants.ts`:

```typescript
KNOWLEDGE_BASE: {
  ENABLED: true, // ← Cambiar a true
  PDF_UPLOAD: {
    ENABLED: true, // ← Cambiar a true
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf'],
    CHUNK_SIZE: 1000, // Tamaño de chunks
    OVERLAP: 200, // Overlap entre chunks
  },
  VECTOR_STORE: {
    ENABLED: true, // ← Cambiar a true
    PROVIDER: 'openai',
    EMBEDDING_MODEL: 'text-embedding-3-small',
    SIMILARITY_TOP_K: 3,
  },
  RAG: {
    ENABLED: true, // ← Cambiar a true
    CONTEXT_WINDOW: 4000,
    TEMPERATURE: 0.7,
    SYSTEM_PROMPT: 'Eres un asistente experto...'
  }
}
```

### 2. **Instalar dependencias**

```bash
# Para extracción de PDFs
npm install pdf-parse pdfjs-dist

# Para embeddings (opcional - usar OpenAI por defecto)
npm install @pinecone-database/pinecone
# o
npm install weaviate-ts-client
```

### 3. **Implementar extracción real de PDFs**

Reemplaza la función simulada en `src/services/pdfService.ts`:

```typescript
import * as pdfjsLib from 'pdfjs-dist';

private async extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}
```

### 4. **Implementar embeddings reales**

```typescript
private async generateEmbeddings(document: PDFDocument): Promise<void> {
  for (const chunk of document.chunks) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk.content,
    });
    
    const embedding = response.data[0].embedding;
    this.embeddings.set(chunk.id, embedding);
  }
}
```

### 5. **Implementar búsqueda vectorial real**

```typescript
async searchSimilarChunks(query: string, topK: number = 3): Promise<PDFChunk[]> {
  // Generar embedding de la consulta
  const queryEmbedding = await this.generateQueryEmbedding(query);
  
  // Calcular similitud coseno con todos los chunks
  const similarities = [];
  for (const [chunkId, embedding] of this.embeddings) {
    const similarity = this.cosineSimilarity(queryEmbedding, embedding);
    similarities.push({ chunkId, similarity });
  }
  
  // Ordenar por similitud y retornar top K
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  return similarities
    .slice(0, topK)
    .map(({ chunkId }) => this.getChunkById(chunkId))
    .filter(Boolean);
}
```

## 📋 Uso del Sistema

### **Modo Cliente**
1. Sube PDFs usando el componente `PDFUpload`
2. El sistema procesa automáticamente los documentos
3. Las preguntas se responden usando el contexto de los PDFs

### **Modo Admin**
1. Accede con `?admin=true`
2. Ve la sección de gestión de PDFs
3. Monitorea chunks y embeddings
4. Ajusta configuración de RAG

## 🔧 Configuración Avanzada

### **Tamaño de Chunks**
```typescript
CHUNK_SIZE: 1000, // Caracteres por chunk
OVERLAP: 200,     // Overlap entre chunks
```

**Recomendaciones:**
- **Chunks pequeños (500-1000)**: Mejor precisión, más chunks
- **Chunks grandes (2000-4000)**: Más contexto, menos chunks
- **Overlap 10-20%**: Evita cortar información importante

### **Búsqueda Vectorial**
```typescript
SIMILARITY_TOP_K: 3, // Chunks más relevantes
```

**Recomendaciones:**
- **K=1-3**: Respuestas más específicas
- **K=5-10**: Más contexto, respuestas más completas

### **Modelo de Embeddings**
```typescript
EMBEDDING_MODEL: 'text-embedding-3-small', // Más rápido
// o
EMBEDDING_MODEL: 'text-embedding-3-large', // Más preciso
```

## 📊 Monitoreo y Debug

### **Logs en Consola**
```javascript
// Al subir PDF
"PDF procesado exitosamente. 15 chunks creados."

// Al buscar contexto
"Contexto RAG encontrado: Este es un documento PDF de ejemplo..."

// Al generar respuesta
"Tokens usados: 145 (prompt: 23, completion: 122)"
```

### **Métricas Importantes**
- **Número de chunks**: Más chunks = más granularidad
- **Tiempo de procesamiento**: PDFs grandes tardan más
- **Uso de tokens**: RAG aumenta el uso de tokens
- **Calidad de respuestas**: Comparar con/sin RAG

## 🛠️ Optimizaciones

### **1. Preprocesamiento de Texto**
```typescript
private preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Normalizar espacios
    .replace(/[^\w\s\.\,\!\?]/g, '') // Limpiar caracteres especiales
    .trim();
}
```

### **2. Chunking Inteligente**
```typescript
private createSmartChunks(text: string): PDFChunk[] {
  // Dividir por párrafos primero
  const paragraphs = text.split(/\n\s*\n/);
  
  // Luego dividir párrafos largos
  return paragraphs.flatMap(paragraph => 
    this.splitParagraph(paragraph)
  );
}
```

### **3. Caché de Embeddings**
```typescript
private embeddingCache = new Map<string, number[]>();

private async getCachedEmbedding(text: string): Promise<number[]> {
  const hash = this.hashText(text);
  
  if (this.embeddingCache.has(hash)) {
    return this.embeddingCache.get(hash)!;
  }
  
  const embedding = await this.generateEmbedding(text);
  this.embeddingCache.set(hash, embedding);
  return embedding;
}
```

## 🔒 Consideraciones de Seguridad

### **1. Validación de Archivos**
```typescript
private validateFile(file: File): boolean {
  // Verificar tipo MIME real
  const realType = this.getRealFileType(file);
  if (realType !== 'application/pdf') return false;
  
  // Verificar contenido malicioso
  if (this.containsMaliciousContent(file)) return false;
  
  return true;
}
```

### **2. Límites de Uso**
```typescript
const LIMITS = {
  MAX_FILES_PER_USER: 10,
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_PROCESSING_TIME: 30000, // 30 segundos
};
```

## 📈 Escalabilidad

### **Para Producción**
1. **Base de datos vectorial**: Pinecone, Weaviate, Qdrant
2. **Procesamiento asíncrono**: Cola de trabajos
3. **CDN para archivos**: Almacenamiento distribuido
4. **Monitoreo**: Métricas y alertas

### **Ejemplo con Pinecone**
```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

const index = pinecone.index('voicebot-kb');

// Insertar embeddings
await index.upsert([{
  id: chunkId,
  values: embedding,
  metadata: { content: chunk.content }
}]);

// Buscar similares
const results = await index.query({
  vector: queryEmbedding,
  topK: 3
});
```

## 🐛 Solución de Problemas

### **Error: "PDF no válido"**
- Verificar que el archivo sea realmente un PDF
- Comprobar que no esté corrupto
- Verificar límite de tamaño

### **Error: "No se encontró contexto relevante"**
- Verificar que el PDF se procesó correctamente
- Ajustar `SIMILARITY_TOP_K`
- Revisar calidad de embeddings

### **Respuestas lentas**
- Reducir `CHUNK_SIZE`
- Implementar caché de embeddings
- Usar modelo de embeddings más rápido

### **Respuestas de baja calidad**
- Aumentar `CHUNK_SIZE`
- Mejorar preprocesamiento de texto
- Ajustar `TEMPERATURE` en RAG

## 📚 Recursos Adicionales

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

---

**Nota**: Esta implementación es un framework base. Para producción, considera usar servicios especializados como Pinecone, Weaviate o Qdrant para el almacenamiento vectorial. 