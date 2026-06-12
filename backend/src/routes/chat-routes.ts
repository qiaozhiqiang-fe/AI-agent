import { Router } from 'express';
import { handleChatStream } from '../controllers/chat-controller.js';

export const chatRoutes = Router();

chatRoutes.post('/chat/stream', handleChatStream);
