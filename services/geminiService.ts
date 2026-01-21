
import { GoogleGenAI } from "@google/genai";
import { SchoolIssue, Feedback } from "../types";

export const analyzeGaps = async (issues: SchoolIssue[], feedback: Feedback[]) => {
  // Accessing the API key from the environment. 
  // In Netlify, this must be set in Site Settings > Environment Variables
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY is not defined. Please set it in Netlify Environment Variables.");
    return "Configuration Error: API Key is missing. Please check Netlify settings.";
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = `
    As an expert data analyst for UNICEF Pakistan, analyze the following school reported issues and community feedback.
    
    Current Issues:
    ${JSON.stringify(issues.map(i => ({ loc: i.province, cat: i.category, desc: i.description, sev: i.severity })))}
    
    Community Feedback:
    ${JSON.stringify(feedback.map(f => ({ type: f.authorType, msg: f.content })))}
    
    Please provide:
    1. A summary of the most critical province-wise gaps.
    2. Three actionable recommendations for UNICEF policy makers.
    3. Sentiment analysis of community feedback.
    
    Format the response in clean Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Analysis failed to generate.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Error occurred while connecting to the AI service. Please ensure your API_KEY is valid in Netlify.";
  }
};
