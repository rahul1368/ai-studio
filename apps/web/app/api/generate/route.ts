import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@repo/database';
import { generateImage, validateImage } from '@repo/langchain';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isValidImage = await validateImage(buffer);
    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Invalid image format. Please upload a valid image.' },
        { status: 400 }
      );
    }

    const uploadsPath = join(process.cwd(), UPLOAD_DIR);
    await mkdir(uploadsPath, { recursive: true });

    const timestamp = Date.now();
    const originalFilename = `${user.id}-${timestamp}-${file.name}`;
    const originalPath = join(uploadsPath, originalFilename);
    await writeFile(originalPath, buffer);

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        prompt: prompt.trim(),
        originalImage: originalPath,
        status: 'PROCESSING',
      },
    });

    const result = await generateImage({
      imageBuffer: buffer,
      imagePath: originalPath,
      prompt: prompt.trim(),
    });

    if (result.success && result.resultPath) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          resultImage: result.resultPath,
        },
      });

      return NextResponse.json({
        message: 'Image generated successfully',
        generation: {
          id: generation.id,
          prompt: generation.prompt,
          originalImage: `/${UPLOAD_DIR}/${originalFilename}`,
          resultImage: result.resultPath.replace(process.cwd() + '/', ''),
          status: 'COMPLETED',
        },
      });
    } else {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error: result.error || 'Unknown error',
        },
      });

      return NextResponse.json(
        {
          error: result.error || 'Generation failed',
          generation: {
            id: generation.id,
            status: 'FAILED',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

