import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3002;

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  // TODO: Implement event handling, filtering, and notifications
});

server.listen(port, () => {
  console.log(`Safety events service listening at http://localhost:${port}`);
});
