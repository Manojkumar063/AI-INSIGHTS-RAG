import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const askGeminiStream = async (
  prompt: string, 
  context: string, 
  history: { role: string; text: string }[] = [],
  onChunk: (chunk: string) => void
) => {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are InsightAI, a professional knowledge assistant. 
    You have access to the content of a document provided below.
    Answer the user's questions based primarily on this content. 
    If the answer is not in the document, say so politely but you can still use your general knowledge if relevant.
    Keep your tone professional, concise, and helpful.
    
    DOCUMENT CONTENT:
    """
    ${context}
    """
  `;

  try {
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }]
      }))
    });

    const stream = await chat.sendMessageStream({ message: prompt });
    let fullText = "";
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
