import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const router = express.Router({
  caseSensitive: true,
  strict: true
});

router.get('/', async (req: Request, res: Response) => {
  if (!(req.session && req.session.userId)) {
    return res.status(401).json('authentication required');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId }
  });

  console.log(user);
  return res.status(200).json(user);
});

export default router;
