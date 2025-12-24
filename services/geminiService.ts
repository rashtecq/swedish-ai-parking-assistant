
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ParkingAnalysis } from "../types";

// The API key is obtained exclusively from the environment variable process.env.API_KEY.
// Removed import.meta.env to fix the TypeScript error.

export const analyzeParkingSign = async (base64Image: string): Promise<ParkingAnalysis> => {
  // Always initialize with the direct object as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are an expert on Swedish parking regulations (Svenska parkeringsregler).
    Your task is to analyze an image of a Swedish parking sign and determine if a PRIVATE CAR is currently allowed to park there.
    
    Consider common Swedish rules:
    - P-skiva (parking disc) requirements.
    - Time restrictions like "10-18 (10-14)" where ( ) is Saturday and red/bold is Sunday/Holiday.
    - Resident parking (Boendeparkering) zones.
    - "Avgift" (fee) requirements.
    - "Städdag" (street cleaning days).
    - "Datum-parkering" (date-based parking).
    
    Current date/time info: ${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}.
    
    You must return a JSON object with:
    - status: "ALLOWED", "FORBIDDEN", or "UNKNOWN"
    - summary: A one-sentence clear answer (e.g., "Parking allowed until 18:00").
    - details: An array of strings explaining why (e.g., ["Fee required via EasyPark", "Use P-skiva"]).
    - durationLimit: (Optional) Max time allowed.
    - costInfo: (Optional) Any info about fees.
    - timeWindow: (Optional) The current applicable time window.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: "image/jpeg" } },
          { text: "Is parking allowed here right now for a private car? Respond in English but base the logic on Swedish laws." }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            summary: { type: Type.STRING },
            details: { type: Type.ARRAY, items: { type: Type.STRING } },
            durationLimit: { type: Type.STRING },
            costInfo: { type: Type.STRING },
            timeWindow: { type: Type.STRING },
          },
          required: ["status", "summary", "details"]
        }
      }
    });

    // Access the text property directly (not a method).
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr || "{}");
  } catch (error) {
    console.error("Analysis error:", error);
    throw new Error("Failed to analyze sign");
  }
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  // Always initialize with the direct object as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // The output response may contain both image and text parts; iterate through all parts to find the image part.
    const candidate = response.candidates?.[0];
    if (candidate) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data returned from model");
  } catch (error) {
    console.error("Image editing error:", error);
    throw new Error("Failed to edit image");
  }
};
