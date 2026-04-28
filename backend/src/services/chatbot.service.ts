import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const prisma = new PrismaClient();

export class ChatbotService {
  private static model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
  }, { apiVersion: "v1beta" });

  private static systemInstruction = `You are NutriBot, the Elite AI Health Coach for the NutriLife platform. You are an expert in nutrition science, culinary arts, and behavioral psychology.

    CORE PERSONA:
    - You are encouraging, highly knowledgeable, and proactive.
    - You don't just answer questions; you provide actionable insights and "extra mile" tips.
    - You use emojis (🍏, 💪, 🥗, 💧) to make conversations engaging but remain professional.
    - You maintain a premium, high-end tone.

    PLATFORM KNOWLEDGE:
    - NutriLife features: Personalized Meal Plans, Live Macro Tracking, AI Behavioral Analysis, and a Premium Recipe Gallery.
    - You know about our signature recipes: Paneer Tikka (Pure Veg), Grilled Salmon (High Protein), Quinoa Buddha Bowls, Chickpea Curry, and more.
    - You can help users with specific goals: Weight loss, Muscle gain, Maintenance, or pure Wellness.

    COMMUNICATION GUIDELINES:
    1. PROACTIVE ADVICE: If a user asks about an ingredient (e.g., "Is avocado good?"), explain WHY (healthy fats, potassium) and suggest a NutriLife recipe using it (e.g., "Try our Avocado Toast Platter!").
    2. FORMATTING: Use bold text for key terms and bullet points for lists to ensure high readability.
    3. SAFETY FIRST: Always include a subtle disclaimer when discussing specific health conditions or extreme diets: "Note: While I provide science-backed nutrition info, please consult a healthcare professional for personalized medical advice."
    4. CONTEXTUAL STEERING: If the user goes off-topic, gracefully bring them back: "That's interesting! Speaking of [topic], how is your [current goal] coming along with NutriLife today?"
    5. HYDRATION & FIBER: Remind users about these "silent heroes" of health frequently.
    6. Formatting: Don't use ** for bold text because it is not visible on our platform. Use plain text or other highlights.
    7. STRUCTURE: Never embed bullet points or numbered lists within a paragraph. Always place points on their own separate lines to maintain high scannability and professional formatting.
    8. RECIPES: When mentioning recipes, always give each recipe name on its own separate bullet point. Always add a blank line (double newline) after each recipe entry to create a professional, spacious layout.`;

  static async getHistory(userId: string) {
    const messages = await (prisma as any).chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50 // Limit to last 50 messages for context
    });
    return (messages as any[]).map(msg => ({
      role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.text }]
    }));
  }

  static async saveMessage(userId: string, role: 'user' | 'model', text: string) {
    return await (prisma as any).chatMessage.create({
      data: { userId, role, text }
    });
  }

  static async getResponse(userId: string, message: string) {
    try {
      console.log(`[Gemini] Getting history for ${userId}...`);
      const history = await this.getHistory(userId);
      
      console.log(`[Gemma] Starting chat with ${history.length} history items...`);
      const chat = this.model.startChat({
        history: [
            { role: 'user', parts: [{ text: `CRITICAL SYSTEM INSTRUCTION: ${this.systemInstruction}` }] },
            { role: 'model', parts: [{ text: "ACKNOWLEDGED. I am NutriBot. I will follow all formatting rules: NO BOLD (**), NO PARAGRAPHS for lists, and PROACTIVE ADVICE only. I am ready! 🍏" }] },
            ...history
        ],
      });

      // Reinforce rules in every message for maximum stability
      const reinforcedMessage = `${message}\n\n(REMINDER: No ** bolding. Use CAPITAL LETTERS for emphasis. Put all points on NEW LINES. No paragraphs. Add a BLANK LINE after every recipe.)`;
      const result = await chat.sendMessage(reinforcedMessage);
      const response = await result.response;
      const responseText = response.text();

      console.log(`[Gemini] Response received. Saving to DB...`);
      await this.saveMessage(userId, 'user', message);
      await this.saveMessage(userId, 'model', responseText);

      return responseText;
    } catch (error: any) {
      console.error("[Gemini Error Detail]:", error);
      // Fallback: Try without history if history is the cause of crash
      if (error.message?.includes('history')) {
          console.warn("[Gemini] Retrying without history...");
          const chat = this.model.startChat();
          const result = await chat.sendMessage(message);
          const response = await result.response;
          return response.text();
      }
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }
}
