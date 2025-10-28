import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@repo/database';
import { generateImage, validateImage } from '@repo/langchain';
import { verifyToken } from '@repo/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_RETRIES = 3;

@Injectable()
export class GenerationService {
  async getUserFromToken(token: string) {
    const payload = verifyToken(token);
    
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async createGeneration(file: Express.Multer.File, prompt: string, token: string) {
    const user = await this.getUserFromToken(token);
    
    if (!file || !file.buffer) {
      throw new BadRequestException('Image file is required');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported file type. Use PNG, JPEG, or WEBP');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Max size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB`
      );
    }

    const buffer = file.buffer;
    const isValidImage = await validateImage(buffer);
    
    if (!isValidImage) {
      throw new BadRequestException('Invalid image format');
    }

    const uploadsPath = join(process.cwd(), UPLOAD_DIR);
    await mkdir(uploadsPath, { recursive: true });

    const timestamp = Date.now();
    const originalFilename = `${user.id}-${timestamp}-${file.originalname}`;
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

    let result = await generateImage({
      imageBuffer: buffer,
      imagePath: originalPath,
      prompt: prompt.trim(),
    });

    // Retry transient failures (generator simulates random errors)
    let attempt = 1;
    while (!result.success && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 300 * attempt));
      result = await generateImage({
        imageBuffer: buffer,
        imagePath: originalPath,
        prompt: prompt.trim(),
      });
      attempt += 1;
    }

    if (result.success && result.resultPath) {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          resultImage: result.resultPath,
        },
      });

      return {
        message: 'Image generated successfully',
        generation: {
          id: generation.id,
          prompt: generation.prompt,
          originalImage: `/${UPLOAD_DIR}/${originalFilename}`,
          resultImage: result.resultPath.replace(process.cwd() + '/', ''),
          status: 'COMPLETED',
        },
      };
    } else {
      await prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          error: result.error || 'Unknown error',
        },
      });

      throw new BadRequestException(result.error || 'Generation failed');
    }
  }

  async getGenerations(token: string, page = 1, limit = 12) {
    const user = await this.getUserFromToken(token);

    const skip = (page - 1) * limit;

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          prompt: true,
          originalImage: true,
          resultImage: true,
          status: true,
          error: true,
          createdAt: true,
        },
      }),
      prisma.generation.count({
        where: {
          userId: user.id,
        },
      }),
    ]);

    const transformedGenerations = generations.map((gen) => ({
      ...gen,
      originalImage: gen.originalImage.replace(process.cwd() + '/', ''),
      resultImage: gen.resultImage ? gen.resultImage.replace(process.cwd() + '/', '') : null,
    }));

    return {
      generations: transformedGenerations,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async reapplyGeneration(generationId: string, prompt: string, token: string) {
    const user = await this.getUserFromToken(token);

    const generation = await prisma.generation.findFirst({
      where: { id: generationId, userId: user.id },
      select: { id: true, originalImage: true },
    });

    if (!generation) {
      throw new UnauthorizedException('Generation not found');
    }

    const storedPath = generation.originalImage;
    const isAbsolute = storedPath.startsWith('/') || /^[A-Za-z]:\\/.test(storedPath);
    const originalPath = isAbsolute ? storedPath : join(process.cwd(), storedPath);
    const buffer = await readFile(originalPath);

    // Reuse normal create flow but with existing original file
    const result = await generateImage({
      imageBuffer: buffer,
      imagePath: originalPath,
      prompt: prompt.trim(),
    });

    const newGen = await prisma.generation.create({
      data: {
        userId: user.id,
        prompt: prompt.trim(),
        originalImage: generation.originalImage,
        status: result.success ? 'COMPLETED' : 'FAILED',
        resultImage: result.success && result.resultPath ? result.resultPath.replace(process.cwd() + '/', '') : null,
        error: result.success ? null : (result.error || 'Generation failed'),
      },
    });

    if (!result.success) {
      throw new BadRequestException(result.error || 'Generation failed');
    }

    return {
      message: 'Image re-generated successfully',
      generation: {
        id: newGen.id,
        prompt: newGen.prompt,
        originalImage: newGen.originalImage,
        resultImage: newGen.resultImage,
        status: newGen.status,
      },
    };
  }
}
