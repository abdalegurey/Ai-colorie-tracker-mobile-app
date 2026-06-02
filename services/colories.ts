import { Types } from "mongoose";
import FoodEntry from "../models/FoodEntry.js";

interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealBreakdown: {
    breakfast: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
    lunch: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
    dinner: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
    snack: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    };
  };
  entries: number;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
}

interface MealStats {
  _id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
}

interface OverallStats {
  _id: null;
  totalEntries: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface WeeklySummary {
  dailyData: Record<
    string,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    }
  >;
  totalEntries: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgCalories: number;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
}


interface MonthlySummary {
  totalEntries: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  avgCalories: number;
  highestDay: number;
  daysTracked: number;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
  dailyData: Record<
    number,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    }
  >;
}

/* 
  Scenario: User logs 3 meals on 2026-01-15
  Input data in FoodEntry collection:
  [
    { userId: "507f1f77bcf86cd799439011", mealType: "breakfast", calories: 500, protein: 30, carbs: 60, fat: 15, timestamp: "2024-01-15T08:00:00Z" },
    { userId: "507f1f77bcf86cd799439011", mealType: "lunch", calories: 800, protein: 40, carbs: 100, fat: 25, timestamp: "2024-01-15T13:00:00Z" },
    { userId: "507f1f77bcf86cd799439011", mealType: "dinner", calories: 700, protein: 50, carbs: 80, fat: 20, timestamp: "2024-01-15T19:00:00Z" }
  ]
  
  Output:
  {
    totalCalories: 2000,
    totalProtein: 120,
    totalCarbs: 240,
    totalFat: 60,
    entries: 3,
    mealBreakdown: {
      breakfast: { calories: 500, protein: 30, carbs: 60, fat: 15, count: 1 },
      lunch: { calories: 800, protein: 40, carbs: 100, fat: 25, count: 1 },
      dinner: { calories: 700, protein: 50, carbs: 80, fat: 20, count: 1 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 }
    }
  }
 */


export const getDailySummary = async (
  userId: string | Types.ObjectId,
  date: Date = new Date()
): Promise<DailySummary> => {
  const startOfDay = new Date(date);

  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);

  endOfDay.setHours(23, 59, 59, 999);

  // conver user id to object id

  const userIdObjectId =
    typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  const [result] = await FoodEntry.aggregate<{
    mealStats: MealStats[];
    overallStats: OverallStats[];
  }>([
    // match the user id

    {
      $match: {
        userId: userIdObjectId,
        timestamp: { $gte: startOfDay, $lte: endOfDay },
      },
    },

    // [
    //     { userId: "507f1f77bcf86cd799439011", mealType: "breakfast", calories: 500, protein: 30, carbs: 60, fat: 15, timestamp: "2024-01-15T08:00:00Z" },
    //     { userId: "507f1f77bcf86cd799439011", mealType: "lunch", calories: 800, protein: 40, carbs: 100, fat: 25, timestamp: "2024-01-15T13:00:00Z" },
    //     { userId: "507f1f77bcf86cd799439011", mealType: "dinner", calories: 700, protein: 50, carbs: 80, fat: 20, timestamp: "2024-01-15T19:00:00Z" }
    //     { userId: "507f1f77bcf86cd799439011", mealType: "breakfast", calories: 700, protein: 50, carbs: 80, fat: 20, timestamp: "2024-01-15T19:00:00Z" }
    //   ]

    {
      $facet: {
        // meal stats

        mealStats: [
          {
            $group: {
              _id: "$mealType",
              totalEntries: { $sum: 1 },
              totalCalories: { $sum: "$calories" },
              totalProtein: { $sum: "$protein" },
              totalCarbs: { $sum: "$carbs" },
              totalFat: { $sum: "$fat" },
            },
          },
        ],

        // overall stats

        overallStats: [
          {
            $group: {
              _id: null,
              totalEntries: { $sum: 1 },
              totalCalories: { $sum: "$calories" },
              totalProtein: { $sum: "$protein" },
              totalCarbs: { $sum: "$carbs" },
              totalFat: { $sum: "$fat" },
            },
          },
        ],
      },
    },
  ]);

  // FINAL RESULT STRUCTURE:
  // result = {
  //   mealStats: [
  //     { _id: "breakfast", calories: 800, protein: 50, carbs: 100, fat: 25, count: 2 },  // ← 2 breakfast entries summed!
  //     { _id: "lunch", calories: 800, protein: 40, carbs: 100, fat: 25, count: 1 },
  //     { _id: "dinner", calories: 700, protein: 50, carbs: 80, fat: 20, count: 1 }
  //   ],
  //   overallStats: [
  //     { _id: null, totalEntries: 4, totalCalories: 2300, totalProtein: 140, totalCarbs: 280, totalFat: 70 }
  //   ]
  // }

  // Initialize default summary structure
  const summary: DailySummary = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealBreakdown: {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
    },
    entries: 0,
    macros: {
      protein: { grams: 0, calories: 0, percentage: 0 },
      carbs: { grams: 0, calories: 0, percentage: 0 },
      fat: { grams: 0, calories: 0, percentage: 0 },
    },
  };

  // Populate overall stats

  if (result.overallStats.length > 0) {
    const overall = result.overallStats[0];

    summary.totalCalories = overall.totalCalories;
    summary.totalProtein = overall.totalProtein;
    summary.totalCarbs = overall.totalCarbs;
    summary.totalFat = overall.totalFat;
    summary.entries = overall.totalEntries;
  }

  // Populate meal breakdown

  console.log("result", result);

  result.mealStats.forEach((meal: any) => {

    console.log("meal", meal);
    //   mealStats: [
    //     { _id: "breakfast", calories: 800, protein: 50, carbs: 100, fat: 25, count: 2 },  // ← 2 breakfast entries summed!
    //     { _id: "lunch", calories: 800, protein: 40, carbs: 100, fat: 25, count: 1 },
    //     { _id: "dinner", calories: 700, protein: 50, carbs: 80, fat: 20, count: 1 }
    //   ],

    const mealType = meal._id as keyof DailySummary["mealBreakdown"];
    if (summary.mealBreakdown[mealType]) {
      summary.mealBreakdown[mealType] = {
        calories: meal.totalCalories || 0,
        protein: meal.totalProtein || 0,
        carbs: meal.totalCarbs || 0,
        fat: meal.totalFat || 0,
        count: meal.totalEntries || 0,
      };
    }
  });

  //   Calcuate macros to calories

  const caloriesFromProtein = summary.totalProtein * 4;
  const caloriesFromCarbs = summary.totalCarbs * 4;
  const caloriesFromFat = summary.totalFat * 9;

  const totalMacrosCalories =
    caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;

  summary.macros = {
    protein: {
      grams: summary.totalProtein,
      calories: caloriesFromProtein,
      percentage:
        totalMacrosCalories > 0
          ? Math.round(caloriesFromProtein / totalMacrosCalories) * 100
          : 0,
    },
    carbs: {
      grams: summary.totalCarbs,
      calories: caloriesFromCarbs,
      percentage:
        totalMacrosCalories > 0
          ? Math.round(caloriesFromCarbs / totalMacrosCalories) * 100
          : 0,
    },
    fat: {
      grams: summary.totalFat,
      calories: caloriesFromFat,
      percentage:
        totalMacrosCalories > 0
          ? Math.round(caloriesFromFat / totalMacrosCalories) * 100
          : 0,
    },
  };
  return summary;
};


export const getWeeklySummary = async (
  userId: string | Types.ObjectId,
  startDate: Date,
  endDate: Date
): Promise<WeeklySummary> => {
  // convert user id to object id
  const userIdObjectId =
    typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  // aggregate query to get weekly summary

  /*
dailyStats: Array<{
            _id: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            count: number;
          }>;
          overallStats: OverallStats[];
   */

  // STAGE 1: $match - Filter by userId and week date range
  // ──────────────────────────────────────────────────────────────────────────
  // INPUT: All food entries in collection
  //   [{ userId: "507f...", calories: 500, timestamp: "2024-01-15T08:00:00Z" },
  //    { userId: "507f...", calories: 800, timestamp: "2024-01-15T13:00:00Z" },
  //    { userId: "507f...", calories: 600, timestamp: "2024-01-16T12:00:00Z" },
  //    { userId: "999f...", calories: 300, ... },  // Different user - filtered out
  //    { userId: "507f...", calories: 400, ... }]  // Outside date range - filtered out

  const [result] = await FoodEntry.aggregate([
    {
      $match: {
        userId: userIdObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      // INPUT: [{ calories: 500, timestamp: "2024-01-15T08:00:00Z" },  // Date: 2024-01-15
      //         { calories: 800, timestamp: "2024-01-15T13:00:00Z" },  // Date: 2024-01-15
      //         { calories: 600, timestamp: "2024-01-16T12:00:00Z" },  // Date: 2024-01-16
      //         { calories: 700, timestamp: "2024-01-17T19:00:00Z" }]  // Date: 2024-01-17

      $facet: {
        // STAGE 2: $facet - Group by daily date and sum stats
        // ──────────────────────────────────────────────────────────────────────────
        // INPUT: [{ calories: 500, timestamp: "2024-01-15T08:00:00Z" },  // Date: 2024-01-15
        //         { calories: 800, timestamp: "2024-01-15T13:00:00Z" },  // Date: 2024-01-15
        //         { calories: 600, timestamp: "2024-01-16T12:00:00Z" },  // Date: 2024-01-16
        //         { calories: 700, timestamp: "2024-01-17T19:00:00Z" }]  // Date: 2024-01-17

        dailyStats: [
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
              calories: { $sum: "$calories" },
              protein: { $sum: "$protein" },
              carbs: { $sum: "$carbs" },
              fat: { $sum: "$fat" },
              count: { $sum: 1 },
            },
          },
          {
            $sort: {
              _id: 1, // sort by date ascending
            },
          },
        ],

        // STAGE 3: $facet - Sum overall stats

        overallStats: [
          {
            $group: {
              _id: null,
              totalEntries: { $sum: 1 },
              totalCalories: { $sum: "$calories" },
              totalProtein: { $sum: "$protein" },
              totalCarbs: { $sum: "$carbs" },
              totalFat: { $sum: "$fat" },
            },
          },
        ],
      },
    },
  ]);

  // FINAL RESULT STRUCTURE:
  // result = {
  //   dailyStats: [
  //     { _id: "2024-01-15", calories: 1300, protein: 70, carbs: 160, fat: 40, count: 2 },
  //     { _id: "2024-01-16", calories: 600, protein: 35, carbs: 70, fat: 18, count: 1 },
  //     { _id: "2024-01-17", calories: 700, protein: 50, carbs: 80, fat: 20, count: 1 }
  //   ],
  //   overallStats: [
  //     { _id: null, totalEntries: 4, totalCalories: 2600, totalProtein: 155, totalCarbs: 310, totalFat: 78 }
  //   ]
  // }

  // Transform dailyStats into an object keyed by date

  const dailyData: Record<
    string,
    {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      count: number;
    }
  > = {};

  result.dailyStats.forEach((day: any) => {
    dailyData[day._id] = {
      calories: day.calories || 0,
      protein: day.protein || 0,
      carbs: day.carbs || 0,
      fat: day.fat || 0,
      count: day.count || 0,
    };
  });

  const overallStats = result.overallStats[0] || {
    totalEntries: 0,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };

  // Calculate macros: convert grams to calories and calculate percentages
  const caloriesFromProtein = overallStats.totalProtein * 4;
  const caloriesFromCarbs = overallStats.totalCarbs * 4;
  const caloriesFromFat = overallStats.totalFat * 9;
  const totalMacroCalories =
    caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;

  return {
    dailyData,
    totalEntries: overallStats.totalEntries,
    totalCalories: overallStats.totalCalories,
    totalProtein: overallStats.totalProtein,
    totalCarbs: overallStats.totalCarbs,
    totalFat: overallStats.totalFat,
    avgCalories:
      result.dailyStats.length > 0
        ? Math.round(overallStats.totalCalories / result.dailyStats.length)
        : 0,
    macros: {
      protein: {
        grams: overallStats.totalProtein,
        calories: caloriesFromProtein,
        percentage:
          totalMacroCalories > 0
            ? Math.round(caloriesFromProtein / totalMacroCalories) * 100
            : 0,
      },
      carbs: {
        grams: overallStats.totalCarbs,
        calories: caloriesFromCarbs,
        percentage:
          totalMacroCalories > 0
            ? Math.round(caloriesFromCarbs / totalMacroCalories) * 100
            : 0,
      },
      fat: {
        grams: overallStats.totalFat,
        calories: caloriesFromFat,
        percentage:
          totalMacroCalories > 0
            ? Math.round(caloriesFromFat / totalMacroCalories) * 100
            : 0,
      },
    },
  };

  //   this returns like this:

  /*
  
  {
      dailyData: {
          "2024-01-15": { calories: 1300, protein: 70, carbs: 160, fat: 40, count: 2 },
          "2024-01-16": { calories: 600, protein: 35, carbs: 70, fat: 18, count: 1 },
          "2024-01-17": { calories: 700, protein: 50, carbs: 80, fat: 20, count: 1 }
      },
      totalEntries: 4,
      totalCalories: 2600,
      totalProtein: 155,
      totalCarbs: 310,
      totalFat: 78,
      avgCalories: 650,
      macros: {
          protein: { grams: 155, calories: 620, percentage: 23.85 },
          carbs: { grams: 310, calories: 1240, percentage: 47.69 },
          fat: { grams: 78, calories: 702, percentage: 28.46 }
      }
  }
  */
};


/**
 * Calculate monthly statistics using MongoDB aggregation
 *
 * @example
 * // Scenario: User logs meals throughout January 2024
 * // Input: userId = "507f1f77bcf86cd799439011", year = 2024, month = 1
 * // Input data in FoodEntry collection (sample entries):
 * // [
 * //   { userId: "507f...", calories: 500, protein: 30, carbs: 60, fat: 15, timestamp: "2024-01-15T08:00:00Z" },
 * //   { userId: "507f...", calories: 800, protein: 40, carbs: 100, fat: 25, timestamp: "2024-01-15T13:00:00Z" },
 * //   { userId: "507f...", calories: 700, protein: 50, carbs: 80, fat: 20, timestamp: "2024-01-20T19:00:00Z" },
 * //   { userId: "507f...", calories: 600, protein: 35, carbs: 70, fat: 18, timestamp: "2024-01-20T12:00:00Z" }
 * // ]
 * //
 * // Output:
 * // {
 * //   totalEntries: 4,
 * //   totalCalories: 2600,
 * //   totalProtein: 155,
 * //   totalCarbs: 310,
 * //   totalFat: 78,
 * //   avgCalories: 1300,  // Average per day (2600 / 2 days)
 * //   highestDay: 1300,   // Highest calories in a single day (Jan 15: 500+800=1300)
 * //   daysTracked: 2,     // Number of unique days with entries (even though there are 4 entries total,
 * //                       // they're spread across only 2 different days: Jan 15 and Jan 20)
 * //   dailyData: {
 * //     15: { calories: 1300, protein: 70, carbs: 160, fat: 40, count: 2 },
 * //     20: { calories: 1300, protein: 85, carbs: 150, fat: 38, count: 2 }
 * //   }
 * // }
 */