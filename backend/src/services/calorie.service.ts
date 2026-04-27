export class CalorieEngine {
  static calculateTargets(age: number, weightKg: number, heightCm: number, gender: 'male'|'female', activityMultiplier: number, goal: 'lose'|'maintain'|'gain') {
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    bmr = gender === 'male' ? bmr + 5 : bmr - 161;

    let tdee = bmr * activityMultiplier;

    if (goal === 'lose') tdee *= 0.85; 
    if (goal === 'gain') tdee *= 1.15; 
    
    tdee = Math.round(tdee);

    return {
      dailyCalories: tdee,
      macros: {
        proteinGrams: Math.round((tdee * 0.30) / 4),
        carbGrams: Math.round((tdee * 0.40) / 4),
        fatGrams: Math.round((tdee * 0.30) / 9)
      }
    };
  }
}
