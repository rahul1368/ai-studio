import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get last 5 generations for the user
    const generations = await prisma.generation.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        prompt: true,
        originalImage: true,
        resultImage: true,
        status: true,
        error: true,
        createdAt: true,
      },
    });

    // Transform file paths to web URLs
    const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
    const transformedGenerations = generations.map((gen) => ({
      ...gen,
      originalImage: gen.originalImage.replace(process.cwd() + '/', ''),
      resultImage: gen.resultImage ? gen.resultImage.replace(process.cwd() + '/', '') : null,
    }));

    return NextResponse.json({
      generations: transformedGenerations,
      count: generations.length,
    });
  } catch (error) {
    console.error('Generations fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

