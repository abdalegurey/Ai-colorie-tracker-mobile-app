import { zodResponseFormat } from "openai/helpers/zod";
import { OpenAI } from "openai";
import { z } from "zod";

import { config } from "../config/config.js";

const FoodAnalysisSchema = z.object({
  foodName: z.string().describe("The name of the food"),
  calories: z.number().describe("The calories of the food"),
  protein: z.number().describe("The protein of the food"),
  fat: z.number().describe("The fat of the food"),
  carbs: z.number().describe("The carbs of the food"),
  mealType: z
    .enum(["breakfast", "lunch", "dinner", "snack"])
    .describe("The meal type of the food"),
});

type FoodAnalysisResult = z.infer<typeof FoodAnalysisSchema>;



const openai = new OpenAI({
    apiKey: config.openaiApiKey,
});

export const analyzeFood = async (
  imageUrl: string
): Promise<FoodAnalysisResult> => {
  try {
    console.log("Analyzing food...");

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",

      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image and provide nutritional information. 
              Make your best estimate for a typical serving size shown in the image.
              Provide accurate nutritional values based on the food visible in the image.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low",
              },
            },
          ],
        },
      ],
      //   use zod response format to parse the response
      response_format: zodResponseFormat(FoodAnalysisSchema, "foodAnalysis"),
      max_completion_tokens: 300,
    });

    console.log("Completion:", JSON.stringify(completion, null, 2));

    const message = completion.choices[0]?.message;

    // check if message is actually parsed

    console.log("Message parsed:", message.parsed);
    if (message?.parsed) {

      return {
        foodName: message.parsed.foodName,
        calories: message.parsed.calories,
        protein: message.parsed.protein,
        fat: message.parsed.fat,
        carbs: message.parsed.carbs,
        mealType: message.parsed.mealType,
      };
    }

    if (message?.refusal) {
      throw new Error(`OpenAI refused to analyze the food: ${message.refusal}`);
    }

    throw new Error("Failed to analyze food");
  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};