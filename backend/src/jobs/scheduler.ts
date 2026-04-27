import * as cron from 'node-cron';
import { InterventionEngine } from '../services/intervention.service';
import { NotificationSystem } from '../services/notification.service';

export const startJobs = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running proactive intervention check...');
    
    // MOCK: Fetching a single user
    const mockUser = {
      id: 'user-123',
      patterns: { lateNightSnacker: true, sweetTooth: true }
    };
    
    const intervention = await InterventionEngine.evaluateIntervention(mockUser.id, mockUser.patterns);
    
    if (intervention.shouldIntervene && intervention.message) {
      await NotificationSystem.sendPush(mockUser.id, intervention.message);
    }
  });
};
