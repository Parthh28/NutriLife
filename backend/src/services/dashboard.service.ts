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

    // Get Targets (Fallback to default if not set)
    const targets = user.dailyCalories ? {
      calories: user.dailyCalories,
      macros: user.macroSplit as any || { protein: 150, carbs: 200, fat: 60 }
    } : CalorieEngine.calculateTargets(30, 70, 175, 'male', 1.5, 'maintain');

    return {
      today: todayTotals,
      targets: {
        calories: targets.calories || (targets as any).dailyCalories,
        macros: (targets as any).macros || targets.macros
      },
      habits: user.habits,
      insights: user.patterns
    };
  }
}
