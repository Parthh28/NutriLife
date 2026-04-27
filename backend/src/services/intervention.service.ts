import { PredictionEngine } from './prediction.service';
import { SubstitutionEngine } from './substitution.service';

export class InterventionEngine {
  static async evaluateIntervention(userId: string, pattern: any) {
    const currentHour = new Date().getHours();
    const prediction = PredictionEngine.predictNextBehavior(userId, currentHour, pattern);
    
    if (prediction.riskLevel === 'HIGH') {
      const alternative = SubstitutionEngine.getAlternative(prediction.predictedAction);
      
      return {
        shouldIntervene: true,
        type: 'WARNING',
        message: `Craving something sweet or crunchy? Try ${alternative.suggestion} instead!`,
        reason: alternative.why
      };
    }
    
    return { shouldIntervene: false };
  }
}
