import { GoogleGenAI } from "@google/genai";
import { OPRecord, PredictionResult } from "../types";
import { format, addDays, parseISO } from "date-fns";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function getPredictions(historicalData: OPRecord[], daysToForecast: number = 7): Promise<PredictionResult[]> {
  const model = "gemini-3-flash-preview";
  
  if (historicalData.length === 0) return [];

  const lastDateStr = historicalData[historicalData.length - 1].date;
  const lastDate = parseISO(lastDateStr);

  const prompt = `
    You are an expert healthcare data scientist. 
    Analyze the following historical outpatient (OP) visit data and predict the load for the next ${daysToForecast} days.
    
    Data:
    ${JSON.stringify(historicalData.slice(-30))}

    Return the prediction in JSON format as an array of objects:
    [
      { "date": "YYYY-MM-DD", "predictedCount": number, "confidence": number, "reasoning": "string" }
    ]
    Ensure accuracy based on trends (daily, weekly) in the provided data.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("Prediction error:", error);
    // Fallback: simple linear growth/random trend for demo if AI fails
    return Array.from({ length: daysToForecast }).map((_, i) => {
      const date = addDays(lastDate, i + 1);
      return {
        date: format(date, "yyyy-MM-dd"),
        predictedCount: Math.round(50 + Math.random() * 20),
        confidence: 0.5,
        reasoning: "Fallback baseline model used."
      };
    });
  }
}
