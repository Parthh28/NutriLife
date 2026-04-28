import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Model fetched successfully");
    // Unfortunately genAI doesn't have a simple listModels in the same way as the REST API without extra setup
    // but we can try a simple generation
    const result = await models.generateContent("hello");
    console.log(result.response.text());
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

listModels();
