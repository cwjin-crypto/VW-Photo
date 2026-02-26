import { GoogleGenAI } from "@google/genai";
import { BackgroundType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSalesRepImages(
  sourceImages: string[], // base64 strings
  backgroundType: BackgroundType,
  name: string
) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing from environment variables.");
    throw new Error("API 키가 설정되지 않았습니다. 관리자에게 문의하세요.");
  }

  const model = "gemini-2.5-flash-image";
  
  const backgroundPrompts = {
    solid: "a perfectly flat, solid light gray background (hex color #F3F4F6), no shadows, no gradients, minimalist professional studio style",
    logo: "a perfectly flat, solid white background (hex color #FFFFFF) with the specific dark blue Volkswagen circular logo (thin lines, minimalist 2D design, as seen in brand guidelines) positioned exactly in the top right corner. The logo should be clean, sharp, and high-contrast.",
    showroom: "a specific high-end Volkswagen showroom interior. On the left, a silver Volkswagen Atlas SUV is parked. In the background, there is a large blue digital screen with the text 'Welcome to Volkswagen'. The floor is polished light gray tile, and there is a minimalist white reception desk. The lighting is bright, clean, and professional."
  };

  const shots = [
    {
      type: "front",
      prompt: `Generate a professional corporate portrait of the person in the source image. 
               Angle: Upper body front shot. 
               Pose: Professional, friendly, standing straight, looking at the camera. 
               Background: ${backgroundPrompts[backgroundType]}. 
               Lighting: Standardized professional studio lighting, soft shadows, neutral color temperature. Ignore any lighting or background colors from the source image.
               Style: High-quality photography, professional business attire. 
               The person's face and features must strictly match the source image.`
    },
    {
      type: "side",
      prompt: `Generate a professional corporate portrait of the person in the source image. 
               Angle: Upper body 45-degree side shot, head turned slightly towards the camera. 
               Pose: Professional, friendly, confident. 
               Background: ${backgroundPrompts[backgroundType]}. 
               Lighting: Standardized professional studio lighting, soft shadows, neutral color temperature. Ignore any lighting or background colors from the source image.
               Style: High-quality photography, professional business attire. 
               The person's face and features must strictly match the source image.`
    },
    {
      type: "full",
      prompt: `Generate a professional full-body corporate photo of the person in the source image. 
               Angle: Full body shot from head to toe. 
               Pose: Standing professionally, confident posture, arms relaxed or slightly crossed. 
               Background: ${backgroundPrompts[backgroundType]}. 
               Lighting: Standardized professional studio lighting, soft shadows, neutral color temperature. Ignore any lighting or background colors from the source image.
               Style: High-quality photography, professional business attire. 
               The person's face and features must strictly match the source image.`
    }
  ];

  const generateShot = async (shot: typeof shots[0]) => {
    try {
      const parts = sourceImages.map(img => ({
        inlineData: {
          data: img.split(",")[1],
          mimeType: "image/png"
        }
      }));

      parts.push({ text: shot.prompt } as any);

      const response = await ai.models.generateContent({
        model,
        contents: { parts }
      });

      const candidate = response.candidates?.[0];
      if (!candidate) throw new Error("No candidates returned from AI");

      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data found in response");
    } catch (error) {
      console.error(`Error generating ${shot.type} shot:`, error);
      throw error;
    }
  };

  // Run in parallel for better performance
  const [front, side, full] = await Promise.all([
    generateShot(shots[0]),
    generateShot(shots[1]),
    generateShot(shots[2])
  ]);

  return { front, side, full };
}
