import express, { Request, Response } from 'express';
import cors from 'cors';
import { InterventionEngine } from './services/intervention.service';
import { CalorieEngine } from './services/calorie.service';
import { AuthService } from './services/auth.service';
import { FoodService } from './services/food.service';
import { DashboardService } from './services/dashboard.service';
import { ChatbotService } from './services/chatbot.service';
import { BlogService } from './services/blog.service';
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

app.post('/user/update-profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await AuthService.updateProfile(req.user!.userId, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

app.delete('/food/log/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await FoodService.deleteLog(req.user!.userId, req.params.id);
    res.json({ success: true });
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

app.get('/user/weekly-stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await DashboardService.getWeeklyStats(req.user!.userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chatbot Routes
app.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  console.log(`[Chat] Request from user ${req.user!.userId}`);
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const response = await ChatbotService.getResponse(req.user!.userId, message);
    res.json({ response });
  } catch (error: any) {
    console.error(`[Chat Error] ${error.message}`);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

app.get('/chat/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const history = await ChatbotService.getHistory(req.user!.userId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Blog Routes
app.get('/blogs', async (req: Request, res: Response) => {
  try {
    const blogs = await BlogService.getAllBlogs();
    res.json(blogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/blogs', async (req: Request, res: Response) => {
  try {
    const blog = await BlogService.createBlog(req.body);
    res.json(blog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/blogs/:id/like', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const like = await BlogService.toggleLike(req.params.id, userId);
    const count = await BlogService.getLikesCount(req.params.id);
    res.json({ like, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

