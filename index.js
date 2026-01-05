import express from 'express';
import places from './routes/placers.js';
import users from './routes/users.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import globalErrorHandler from './middlewares/errorHandler.js';
import { createLoggerFor } from './helpers/loggers/loggers.js';
import http from 'http'
import { init } from './socket.js';

const app = express();
const port = process.env.PORT || 3000;
const logger = createLoggerFor(import.meta.url, 'Port service');
const server = http.createServer(app)
init(server);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use('/img', places);
app.use('/auth', users);

app.use(globalErrorHandler);
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  logger.info('Server running...');
});
