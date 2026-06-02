
import { Request, Response } from "express";
import { r2Config } from "../config/rt2.js";
import sharp from "sharp";
import crypto from "crypto";
import {
  Bucket$,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { analyzeFood } from "../services/openai.js";
import FoodEntry from "../models/FoodEntry.js";

const optimizeImage = async (buffer: Buffer): Promise<Buffer> => {
  const originalSize = buffer.length;

  const optimizedBuffer = await sharp(buffer)
    .rotate()
    .resize(1024, 1024, {
      fit: "inside",
      withoutEnlargement: true, // don't upscale images
    })
    .jpeg({
      quality: 85,
      mozjpeg: true,
    })
    .toBuffer();

  return optimizedBuffer;
};

const uploadToR2 = async (
  buffer: Buffer
): Promise<{ url: string; key: string }> => {
  const fileName = `${crypto.randomBytes(16).toString("hex")}.jpeg`;
  const key = `colorie-tracker-rec/${fileName}`;

  try {
    // upload r2 client

    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    });

    console.log("Uploading to R2...");

    const result = await r2Config.client.send(command);
    console.log("Upload successful:", result);

    return {
      url: `${r2Config.publicUrl}/${key}`,
      key: key,
    };
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};

export const scanFood = async (req: Request, res: Response): Promise<void> => {


    try {

        if (!req.user) {
      res.status(400).json({ message: "Please upload an image of the food" });
      return;
    }

        const image = req.file?.buffer;
    // optimize using sharp
    console.log("Optimizing image...");

    
if (!image) {
  throw new Error("Image is required");
}

const optimizedImage = await optimizeImage(image)


        const { url, key } = await uploadToR2(optimizedImage);
    console.log("Upload successful:", key);

    console.log("Uploading to R2...");


     const foodAnalysis = await analyzeFood(url);
    console.log("Food analysis:", foodAnalysis);

    // save food to database

    const foodEntry = await FoodEntry.create({
      userId: req.user?._id,
      foodName: foodAnalysis.foodName,
      calories: foodAnalysis.calories,
      protein: foodAnalysis.protein,
      fat: foodAnalysis.fat,
      carbs: foodAnalysis.carbs,
      mealType: foodAnalysis.mealType,
      imageUrl: url,
      storageKey: key,
    });

      // return food name
    res.status(201).json({
      message: "Food scanned successfully",
      food: foodEntry,
    });
        
    } catch (error) {

        console.error("Error scanning food:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
        
    }
  

}


export const analyzeFoodImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // get image from request body
    if (!req.file) {
      res.status(400).json({ message: "Please upload an image of the food" });
      return;
    }

    // check user is authenticated
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const image = req.file.buffer;
    // optimize using sharp
    console.log("Optimizing image...");

    const optimizedImage = await optimizeImage(image);

    console.log("Uploading to R2...");
    const { url, key } = await uploadToR2(optimizedImage);
    console.log("Upload successful:", key);

    // call openai api and pass url to get food micronutrients
    console.log("Analyzing food...");
    const foodData = await analyzeFood(url);
    console.log("Food analysis:", foodData);

    //   base64 encode the image

    const imageBase64 = `data:image/jpeg;base64,${optimizedImage.toString(
      "base64"
    )}`;
    console.log("Image base64 encoded:");

    res.status(200).json({
      ...foodData,
      imageUrl: url,
      storageKey: key,
      imageBase64,
    });
  } catch (error) {
    console.error("Error analyzing food image:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};


export const saveFoodEntry = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      foodName,
      calories,
      protein,
      fat,
      carbs,
      mealType,
      imageUrl,
      storageKey,
    } = req.body;

    if (!foodName || !calories === undefined || !imageUrl || !storageKey) {
      res
        .status(400)
        .json({
          message: "All fields are required except protein, fat, and carbs",
        });
      return;
    }

    // check user is authenticated
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const foodEntry = await FoodEntry.create({
      userId: req.user?._id,
      foodName,
      calories,
      protein,
      fat,
      carbs,
      mealType: mealType || "snack",
      imageUrl,
      storageKey,
    });

    console.log("Food entry saved:", foodEntry);
    res.status(201).json(foodEntry);
  } catch (error) {
    console.error("Error saving food entry:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};



export const discardAnalyzedFood = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { storageKey } = req.body;

    if (!storageKey) {
      res.status(400).json({ message: "Storage key is required" });
      return;
    }
    // check user is authenticated
    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    // Delete the image from R2

    try {
      const command = new DeleteObjectCommand({
        Bucket: r2Config.bucketName,
        Key: storageKey,
      });

      console.log("Deleting image from R2...");
      await r2Config.client.send(command);
      console.log("Image deleted from R2 successfully");

      res.status(200).json({ message: "Image deleted from R2 successfully" });
    } catch (error) {
      console.error("Error deleting image from R2:", error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
  } catch (error) {
    console.error("Error discarding analyzed food:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};




