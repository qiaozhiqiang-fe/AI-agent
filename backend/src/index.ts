import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { chatRoutes } from './routes/chat-routes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/example', (_req, res) => {
  res.json({
    code: 0,
    message: '前后端调用成功',
    data: {
      appName: 'AI Agent',
      serverTime: new Date().toISOString(),
    },
  });
});

app.use('/api', chatRoutes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
