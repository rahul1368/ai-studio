import { NextRequest } from 'next/server';
import { verifyToken } from '@repo/auth';
import { prisma } from '@repo/database';

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return user;
}

export function requireAuth(handler: (req: NextRequest, user: any) => Promise<Response>) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req);

    if (!user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(req, user);
  };
}

