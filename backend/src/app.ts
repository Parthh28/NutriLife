import express, { Request, Response } from 'express';
import cors from 'cors';
import { InterventionEngine } from './services/intervention.service';
import { CalorieEngine } from './services/calorie.service';
import { AuthService } from './services/auth.service';
import { FoodService } from './services/food.service';
import { DashboardService } from './services/dashboard.service';
import { authenticate, AuthRequest } from './middleware/auth.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Auth Routes
app.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const result = await AuthService.signup(email, password, name);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


// Mock endpoint for intervention check
app.get('/intervention/check', async (req: Request, res: Response) => {
  // Mock pattern
  const pattern = { lateNightSnacker: true, sweetTooth: true };
  const intervention = await InterventionEngine.evaluateIntervention('user-123', pattern);
  res.json(intervention);
});

// Calorie calculator endpoint
app.post('/calculate-calories', (req: Request, res: Response) => {
  const { age, weight, height, gender, activityMultiplier, goal } = req.body;
  const targets = CalorieEngine.calculateTargets(age, weight, height, gender, activityMultiplier, goal);
  res.json(targets);
});

// Food Log Routes
app.post('/food/log', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const log = await FoodService.logFood(req.user!.userId, req.body);
    // Trigger behavioral analysis in background
    FoodService.analyzeBehavior(req.user!.userId);
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/food/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await FoodService.getLogs(req.user!.userId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/behavior/insights', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const insights = await FoodService.analyzeBehavior(req.user!.userId);
    const intervention = await InterventionEngine.evaluateIntervention(req.user!.userId, insights);
    res.json({ insights, intervention });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const summary = await DashboardService.getSummary(req.user!.userId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

