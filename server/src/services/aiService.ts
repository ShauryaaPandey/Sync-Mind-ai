import { GoogleGenAI } from '@google/genai';

export const processMeetingTranscript = async (transcriptText: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert AI meeting assistant. Analyze the meeting transcript provided below and return ONLY a valid raw JSON object (no markdown code blocks, no trailing comments).

    Return JSON with this exact structure:
    {
      "title": "A concise title summarizing the meeting topic",
      "summary": "A detailed executive summary of the discussion",
      "actionItems": [
        {
          "title": "Clear description of action item or task",
          "assignedTo": "Name of person or 'Unassigned'",
          "completed": false
        }
      ],
      "keyDecisions": [
        "List of concrete decisions made during the meeting"
      ],
      "sentiment": "Positive" | "Neutral" | "Negative"
    }

    Meeting Transcript:
    "${transcriptText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    return JSON.parse(rawText);
  } catch (error) {
    console.error('Gemini AI Processing Error:', error);
    throw new Error('Failed to extract meeting structured data using Gemini AI');
  }
};