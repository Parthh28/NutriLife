import { PrismaClient } from '@prisma/client';
import { CalorieEngine } from './calorie.service';

const prisma = new PrismaClient();

export class DashboardService {
  static async getSummary(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        foodLogs: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
            }
          }
        },
        habits: true,
        patterns: true
      }
    });

    if (!user) throw new Error('User not found');

    // Calculate Today's Totals
    const todayTotals = user.foodLogs.reduce((acc, log) => {
      const macros = log.macros as any || { protein: 0, carbs: 0, fat: 0 };
      return {
        calories: acc.calories + log.calories,
        protein: acc.protein + (macros.protein || 0),
        carbs: acc.carbs + (macros.carbs || 0),
        fat: acc.fat + (macros.fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    // Get Targets (Normalized fallback)
    const targets = user.dailyCalories ? {
      dailyCalories: user.dailyCalories,
      macros: user.macroSplit as any || { proteinGrams: 150, carbGrams: 200, fatGrams: 60 },
      hydrationLiters: user.hydrationGoal || 2.5,
      fiberGrams: user.fiberGoal || 30
    } : CalorieEngine.calculateTargets(user.age || 30, user.weight || 70, user.height || 175, (user.gender as any) || 'male', user.activityLevel || 1.5, (user.goal as any) || 'maintain');

    return {
      today: todayTotals,
      targets: {
        calories: targets.dailyCalories,
        macros: targets.macros,
        hydration: targets.hydrationLiters,
        fiber: targets.fiberGrams
      },
      todayLogs: user.foodLogs,
      userProfile: {
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        activityLevel: user.activityLevel,
        goal: user.goal
      },
      habits: user.habits,
      insights: user.patterns
    };
  }

  static async getWeeklyStats(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Last 7 days including today
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await prisma.foodLog.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'asc' }
    });

    const dailyStats: { [key: string]: any } = {};

    // Initialize the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { 
        protein: 0, 
        carbs: 0, 
        fat: 0, 
        calories: 0, 
        label: date.toLocaleDateString('en-US', { weekday: 'short' }) 
      };
    }

    logs.forEach(log => {
      const dateStr = log.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        const macros = log.macros as any || { protein: 0, carbs: 0, fat: 0 };
        dailyStats[dateStr].protein += (macros.protein || 0);
        dailyStats[dateStr].carbs += (macros.carbs || 0);
        dailyStats[dateStr].fat += (macros.fat || 0);
        dailyStats[dateStr].calories += log.calories;
      }
    });

    // Convert to array and sort chronologically
    return Object.keys(dailyStats)
      .sort()
      .map(date => ({ date, ...dailyStats[date] }));
  }
}
