import express, { Request, Response } from 'express';
import session from 'express-session';
import redis from 'redis';
import connectRedis from 'connect-redis';
import cors from 'cors';

import authRoutes from './controllers/auth';
import userRoutes from './controllers/user';

const app = express();
app.use(express.json());

// CORS policy

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true
};
app.use(cors(corsOptions));

const RedisStore = connectRedis(session);
const redisClient = redis.createClient();

const {
  PORT = 8080,
  NODE_ENV = 'development',
  SESSION_SECRET = 'thisisabigsecret552039'
} = process.env;

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    name: 'sid',
    secret: SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
      httpOnly: true,
      secure: NODE_ENV === 'production', // https
      maxAge: 1000 * 60 * 60 * 24 * 7 // a week
    }
  })
);

app.get('/', async (req: Request, res: Response) => {
  if (!(req.session && req.session.userId)) {
    return res.status(401).json('authentication required');
  }

  return res.status(200).json('Welcome!');
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Server Running at ${PORT} 🚀`);
});
