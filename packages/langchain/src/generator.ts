import sharp from 'sharp';
import type { GenerationInput, GenerationResult } from './types';

export async function generateImage(input: GenerationInput): Promise<GenerationResult> {
  try {
    if (Math.random() < 0.2) {
      throw new Error('Simulated API error: Service temporarily unavailable');
    }

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let image = sharp(input.imageBuffer);
    const promptLower = input.prompt.toLowerCase();

    if (promptLower.includes('vintage') || promptLower.includes('retro')) {
      image = image.tint({ r: 255, g: 240, b: 200 }).modulate({ saturation: 0.7 });
    } else if (promptLower.includes('dark') || promptLower.includes('moody')) {
      image = image.modulate({ brightness: 0.7, saturation: 1.2 });
    } else if (promptLower.includes('bright') || promptLower.includes('vibrant')) {
      image = image.modulate({ brightness: 1.2, saturation: 1.3 });
    } else if (promptLower.includes('blur') || promptLower.includes('soft')) {
      image = image.blur(3);
    } else {
      image = image.modulate({ saturation: 1.1, brightness: 1.05 });
    }

    image = image.extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 100, g: 200, b: 255, alpha: 1 }
    });

    const timestamp = Date.now();
    const outputPath = input.imagePath.replace(
      /(\.[^.]+)$/,
      `-generated-${timestamp}$1`
    );

    await image.toFile(outputPath);

    return {
      success: true,
      resultPath: outputPath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function validateImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!metadata.format;
  } catch {
    return false;
  }
}

