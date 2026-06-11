import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
