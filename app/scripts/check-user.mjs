import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const users = await p.user.findMany({ select: { id: true, email: true, name: true, googleId: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 5 });
console.log(JSON.stringify(users, null, 1));
await p.$disconnect();
