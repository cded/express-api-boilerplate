import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const router = express.Router({
  caseSensitive: true,
  strict: true
});

router.post('/login', async (req: Request, res: Response) => {
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

router.post('/register', async (req: Request, res: Response) => {
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

router.post('/logout', async (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.status(200).send('logged out');
  });
});

export default router;
