import { Request, Response } from "express";
import User from "../models/User.js"
import jwt from "jsonwebtoken";


const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "", {
    expiresIn: "30d",
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, dailyColorieGoal } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Normalize email

    const normalizedEmail = email.toLowerCase().trim();

    // check if email is already in use

    const userExist = await User.findOne({ email: normalizedEmail });

    if (userExist) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    // create user

    const user = await User.create({
      email: normalizedEmail,
      password,
      name,
      dailyColorieGoal: dailyColorieGoal || 2000,
    });

    // generate token

    res.status(201).json({
      message: "User created successfully",
      user: {
        email: user.email,
        name: user.name,
        dailyColorieGoal: user.dailyColorieGoal,
        token: generateToken(user._id.toString()),
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const login  = async (req: Request, res: Response): Promise<void> => {

    try {
        const  { email, password } = req.body;

        if(!email || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

    //   check if user exists
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if(!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
    }

    // compare password

    const isMatch = await user.comparePassword(password);

    if(!isMatch) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
    }

    // generate token

    const token = generateToken(user._id.toString());

    res.status(200).json({
        message: "Login successful",
        user: {
            email: user.email,
            name: user.name,
            dailyColorieGoal: user.dailyColorieGoal,
            token: token,
        },
    });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


export const me = async (req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({
            message: "User fetched successfully",
            user: req.user,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, dailyColorieGoal, onboardingCompleted } = req.body;

        const user = await User.findById(req.user?._id).select("-password");

        if(!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        if(name) user.name = name;
        if(dailyColorieGoal) user.dailyColorieGoal = dailyColorieGoal;
        if(onboardingCompleted !== undefined) user.onboardingCompleted = onboardingCompleted;

        const updatedUser = await user.save();

        res.json({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          dailyCalorieGoal: updatedUser.dailyColorieGoal,
          onboardingCompleted: updatedUser.onboardingCompleted,
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}