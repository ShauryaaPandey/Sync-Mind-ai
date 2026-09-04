import { GoogleGenAI } from '@google/genai';
import { MeetingChunk } from '../models/MeetingChunk';

const CHUNK_SIZE = 650;
const CHUNK_OVERLAP = 100;

export const chunkText = (text: string): string[] => {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: string[] = [];
  const sentences = text.split(/[.!?]\s+/);
  
  let currentChunk = '';
  let currentLength = 0;

  for (const sentence of sentences) {
    const sentenceLength = sentence.length;
    
    if (currentLength + sentenceLength > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      
      const words = currentChunk.split(' ');
      const overlapWords = Math.ceil(CHUNK_OVERLAP / 5);
      currentChunk = words.slice(-overlapWords).join(' ') + ' ' + sentence;
      currentLength = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentLength += sentenceLength;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 20);
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing or invalid in server .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text
    });

    if (!response.embeddings || !Array.isArray(response.embeddings) || response.embeddings.length === 0) {
      throw new Error('Invalid embedding response from Gemini API');
    }

    const values = response.embeddings[0].values;
    
    if (!values || !Array.isArray(values)) {
      throw new Error('Embedding values not found in response');
    }

    return values;
  } catch (error) {
    console.error('Gemini Embedding Error:', error);
    throw new Error('Failed to generate embedding: ' + (error as Error).message);
  }
};

export const embedAndStoreMeetingTranscript = async (
  meetingId: string,
  userId: string,
  transcript: string
): Promise<void> => {
  try {
    if (!transcript || transcript.trim().length === 0) {
      console.log(`Skipping embedding for meeting ${meetingId}: empty transcript`);
      return;
    }

    const chunks = chunkText(transcript);
    
    if (chunks.length === 0) {
      console.log(`Skipping embedding for meeting ${meetingId}: no valid chunks`);
      return;
    }

    await MeetingChunk.deleteMany({ meetingId });

    const chunkDocuments = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embedding = await generateEmbedding(chunkText);
      
      chunkDocuments.push({
        meetingId,
        userId,
        chunkIndex: i,
        text: chunkText,
        embedding
      });
    }

    if (chunkDocuments.length > 0) {
      await MeetingChunk.insertMany(chunkDocuments);
      console.log(`Embedded ${chunkDocuments.length} chunks for meeting ${meetingId}`);
    }
  } catch (error) {
    console.error(`Failed to embed meeting ${meetingId}:`, error);
    throw error;
  }
};

export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
};

interface SimilarChunk {
  _id: string;
  meetingId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  score: number;
}

export const findSimilarChunks = async (
  queryEmbedding: number[],
  filter: { userId?: string; meetingId?: string },
  topK: number = 5
): Promise<SimilarChunk[]> => {
  try {
    const query: any = {};
    
    if (filter.userId) {
      query.userId = filter.userId;
    }
    
    if (filter.meetingId) {
      query.meetingId = filter.meetingId;
    }

    const chunks = await MeetingChunk.find(query).lean();

    if (chunks.length === 0) {
      return [];
    }

    const chunksWithScores = chunks.map((chunk: any) => ({
      _id: chunk._id.toString(),
      meetingId: chunk.meetingId.toString(),
      userId: chunk.userId.toString(),
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    chunksWithScores.sort((a, b) => b.score - a.score);

    return chunksWithScores.slice(0, topK);
  } catch (error) {
    console.error('Error finding similar chunks:', error);
    throw new Error('Failed to find similar chunks: ' + (error as Error).message);
  }
};
