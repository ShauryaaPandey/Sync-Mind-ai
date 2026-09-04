import { GoogleGenAI } from '@google/genai';

export const processMeetingTranscript = async (transcriptText: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing or invalid in server .env file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert AI meeting assistant. Analyze the meeting transcript provided below and return ONLY a valid raw JSON object (no markdown formatting, no code blocks).

    Return JSON with this exact structure:
    {
      "title": "Concise meeting title",
      "summary": "Detailed executive summary",
      "actionItems": [
        {
          "title": "Description of action item",
          "assignedTo": "Name or Unassigned",
          "completed": false
        }
      ],
      "keyDecisions": [
        "Concrete decision made"
      ],
      "sentiment": "Positive"
    }

    Meeting Transcript:
    "${transcriptText}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const rawText = response.text || '{}';
    const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('Gemini Service Error:', error);
    throw new Error('Failed to generate summary with Gemini AI: ' + (error as Error).message);
  }
};