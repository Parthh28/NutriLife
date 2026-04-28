import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FoodService {
  static async logFood(userId: string, foodData: any) {
    // Basic simulation for demo: If calories aren't provided, estimate them
    const calories = foodData.calories || Math.floor(Math.random() * 300) + 150;
    const mealType = foodData.mealType || 'Snack';
    const macros = foodData.macros || {
      protein: Math.floor(calories * 0.06),
      carbs: Math.floor(calories * 0.1),
      fat: Math.floor(calories * 0.03)
    };

    return await prisma.foodLog.create({
      data: {
        userId,
        foodName: foodData.foodName,
        calories,
        mealType,
        macros
      }
    });
  }

  static async getLogs(userId: string) {
    return await prisma.foodLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  static async analyzeBehavior(userId: string) {
    const logs = await prisma.foodLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const patterns = {
      lateNightSnacker: false,
      skipsBreakfast: false,
      sweetTooth: false
    };

    // Simple analysis logic
    logs.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      
      // Late night: 11 PM - 4 AM
      if (hour >= 23 || hour <= 4) patterns.lateNightSnacker = true;
      
      // Sweet tooth: detect sugar/dessert in name
      if (log.foodName.toLowerCase().includes('sugar') || 
          log.foodName.toLowerCase().includes('chocolate') || 
          log.foodName.toLowerCase().includes('cake')) {
        patterns.sweetTooth = true;
      }
    });

    // Save pattern
    await prisma.behaviorPattern.upsert({
      where: { userId },
      update: { ...patterns, lastUpdated: new Date() },
      create: { userId, ...patterns }
    });

    return patterns;
  }

  static async deleteLog(userId: string, logId: string) {
    return await prisma.foodLog.delete({
      where: { id: logId, userId }
    });
  }
}
