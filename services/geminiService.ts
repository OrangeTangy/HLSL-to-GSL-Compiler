import { GoogleGenAI } from "@google/genai";
import { ShaderLanguage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const transpileShader = async (
  code: string,
  sourceLang: ShaderLanguage,
  targetLang: ShaderLanguage
): Promise<{ code: string; explanation: string }> => {
  
  if (!code.trim()) return { code: "", explanation: "No code provided." };

  const prompt = `
    Act as an expert graphics programming compiler.
    Task: Transpile the following ${sourceLang} shader code to ${targetLang}.
    
    Requirements:
    1. Maintain strict functional equivalence.
    2. Handle uniform, attribute, and varying syntax differences correctly.
    3. If converting to GLSL for WebGL, ensure it is compatible with WebGL 2.0 (ES 3.0).
    4. Provide the raw code for the ${targetLang} version.
    5. Provide a brief explanation of the changes made and any potential caveats.

    Input Code:
    \`\`\`
    ${code}
    \`\`\`

    Output Format:
    Return a JSON object with the following structure:
    {
      "code": "The full transpiled code string",
      "explanation": "The explanation string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from AI");

    const json = JSON.parse(responseText);
    return {
      code: json.code || "// Error parsing generated code",
      explanation: json.explanation || "No explanation provided."
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(`Transpilation failed: ${error.message}`);
  }
};

export const optimizeShader = async (code: string, lang: ShaderLanguage): Promise<{ code: string; explanation: string }> => {
  const prompt = `
    Act as a senior GPU optimization engineer.
    Task: Optimize the following ${lang} shader code for performance without changing its visual output.
    
    Input Code:
    \`\`\`
    ${code}
    \`\`\`

     Output Format:
    Return a JSON object with the following structure:
    {
      "code": "The optimized code string",
      "explanation": "A summary of optimizations applied (e.g., vectorization, dead code elimination, math simplifications)."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const json = JSON.parse(response.text || "{}");
    return {
      code: json.code || code,
      explanation: json.explanation || "Could not optimize."
    };
  } catch (error: any) {
    throw new Error(`Optimization failed: ${error.message}`);
  }
};

export const analyzeShader = async (code: string, lang: ShaderLanguage): Promise<string> => {
   const prompt = `
    Analyze the following ${lang} shader code. 
    Explain what it does, identify potential bugs, and suggest improvements.
    Keep the response concise and formatted in Markdown.

    Code:
    \`\`\`
    ${code}
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error: any) {
    return `Analysis failed: ${error.message}`;
  }
};
