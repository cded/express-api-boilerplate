import express, { Request, Response } from 'express';
import session from 'express-session';
import redis from 'redis';
import connectRedis from 'connect-redis';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());

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
      maxAge: 1000 * 60 * 60 * 24 * 7 * 365
    }
  })
);

declare module 'express-session' {
  export interface Session {
    user: { [key: string]: any };
    userId: number;
  }
}

const prisma = new PrismaClient();

app.get('/', async (req: Request, res: Response) => {
  if (!(req.session && req.session.userId)) {
    return res.status(401).json('You need to authenticate to access');
  }
  const users = await prisma.user.findMany();
  return res.json(users);
});

app.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(400).json('Incorrect email');
  }

  const doesPasswordMatch = await bcrypt.compare(password, user.password);

  if (!doesPasswordMatch) {
    return res.status(400).json('Incorrect password');
  }

  req.session.userId = user.id;

  return res.status(200).send(req.session);
});

app.post('/register', async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  const doesUserExist = await prisma.user.findUnique({ where: { email } });
  if (doesUserExist) {
    return res.status(400).send();
  }
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword }
  });

  req.session.userId = user.id;

  return res.status(201).send(req.session);
});

app.post('/logout', async (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.status(200).send('logged out');
  });
});

app.listen(PORT, () => {
  console.log(`Server Running at ${PORT} 🚀`);
});
