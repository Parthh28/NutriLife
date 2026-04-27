export class SubstitutionEngine {
  static getAlternative(craving: string) {
    const map: Record<string, any> = {
      'JunkFoodSnack': { 
        suggestion: 'Air-popped popcorn with nutritional yeast', 
        why: 'Satisfies the crunch with 80% fewer calories and high fiber.' 
      },
      'SugaryDrinkOrTreat': { 
        suggestion: 'Greek yogurt with frozen berries', 
        why: 'Kills the sweet craving while providing 15g of protein.' 
      }
    };
    return map[craving] || { suggestion: 'Drink 500ml of water and wait 10 mins', why: 'Hydration often masks hunger.' };
  }
}
