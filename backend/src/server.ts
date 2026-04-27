import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startJobs } from './jobs/scheduler';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  startJobs();
});
