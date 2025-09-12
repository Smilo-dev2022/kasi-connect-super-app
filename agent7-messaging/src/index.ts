import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { attachWebSocketServer } from './ws';
import { authRouter, requireJwt } from './auth';
import { keysRouter } from './keys';
import { groupsRouter } from './groups';
import { getMissedMessagesRouter, receiptsRouter } from './messages_http';
import { safetyRouter } from './safety';
import { mediaRouter } from './media_http';
import { devicesRouter } from './push_devices';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req: Request, res: Response) => {
	res.json({ ok: true, service: 'agent7-messaging' });
});

app.use('/auth', authRouter);
app.use('/keys', requireJwt, keysRouter);
app.use('/groups', requireJwt, groupsRouter);
app.use('/messages', requireJwt, getMissedMessagesRouter);
app.use('/receipts', requireJwt, receiptsRouter);
app.use('/safety', requireJwt, safetyRouter);
app.use('/media', requireJwt, mediaRouter);
app.use('/devices', requireJwt, devicesRouter);

const server = http.createServer(app);
attachWebSocketServer(server);

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Agent7 messaging listening on http://localhost:${PORT}`);
});