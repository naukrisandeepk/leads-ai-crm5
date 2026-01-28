import { GoogleGenAI, Type } from "@google/genai";
import { LeadCategory, BuyingIntent, Urgency, BuyingStage, AnalysisResult } from "../types";

// Access API Key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      enum: [LeadCategory.HOT, LeadCategory.WARM, LeadCategory.NO_LEAD],
      description: "Classify based on buying intent.",
    },
    intent: {
      type: Type.STRING,
      enum: [BuyingIntent.EXPLICIT, BuyingIntent.IMPLICIT, BuyingIntent.FUTURE, BuyingIntent.NONE],
      description: "The type of buying intent detected.",
    },
    urgency: {
      type: Type.STRING,
      enum: [Urgency.HIGH, Urgency.MEDIUM, Urgency.LOW],
      description: "The urgency level of the request.",
    },
    stage: {
      type: Type.STRING,
      enum: [BuyingStage.AWARENESS, BuyingStage.CONSIDERATION, BuyingStage.DECISION, BuyingStage.UNKNOWN],
      description: "Estimated buying stage.",
    },
    product_detected: {
      type: Type.STRING,
      description: "The specific product or service mentioned, or 'Unknown'.",
    },
    recommended_action: {
      type: Type.STRING,
      enum: ["Follow Up Immediately", "Nurture", "Ignore", "Send Pricing", "Schedule Demo", "Connect on LinkedIn", "Reply to Comment"],
      description: "Best next step for the CRM agent specific to the platform.",
    },
    score: {
      type: Type.INTEGER,
      description: "Lead score from 0 to 100.",
    },
    summary_notes: {
      type: Type.STRING,
      description: "A short summary of the analysis for the CRM notes.",
    },
  },
  required: ["category", "intent", "urgency", "stage", "product_detected", "recommended_action", "score", "summary_notes"],
};

export const analyzeMessage = async (message: string, source: string): Promise<AnalysisResult> => {
  try {
    const prompt = `
      You are an expert Lead Intelligence Agent. Analyze the following social media message from a potential customer.
      
      Platform & Source: ${source}
      Message Text: "${message}"

      Context:
      - LinkedIn messages tend to be B2B and professional.
      - Instagram/Facebook are often B2C but can be B2B.
      - YouTube comments may be technical queries or general praise.

      Determine the lead category, intent, urgency, and extract relevant details.
      Be strict. "Hot Leads" must show clear buying intent. "No Lead" includes simple greetings ("Hi", "Nice post") or spam.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 0 }, 
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      category: LeadCategory.NO_LEAD,
      intent: BuyingIntent.NONE,
      urgency: Urgency.LOW,
      stage: BuyingStage.UNKNOWN,
      product_detected: "Error analyzing",
      recommended_action: "Ignore",
      score: 0,
      summary_notes: "AI Analysis failed. Please review manually.",
    };
  }
};