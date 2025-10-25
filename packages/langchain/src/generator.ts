import sharp from 'sharp';
import type { GenerationInput, GenerationResult } from './types';

/**
 * Simulate AI image generation
 * Since this is a demo, we'll apply simple image transformations
 * to simulate a "generated" result
 */
export async function generateImage(input: GenerationInput): Promise<GenerationResult> {
  try {
    // Simulate API errors randomly (20% chance)
    if (Math.random() < 0.2) {
      throw new Error('Simulated API error: Service temporarily unavailable');
    }

    // Simulate processing delay (1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Apply transformations based on prompt keywords
    let image = sharp(input.imageBuffer);

    const promptLower = input.prompt.toLowerCase();

    // Apply different effects based on prompt
    if (promptLower.includes('vintage') || promptLower.includes('retro')) {
      image = image.tint({ r: 255, g: 240, b: 200 }).modulate({ saturation: 0.7 });
    } else if (promptLower.includes('dark') || promptLower.includes('moody')) {
      image = image.modulate({ brightness: 0.7, saturation: 1.2 });
    } else if (promptLower.includes('bright') || promptLower.includes('vibrant')) {
      image = image.modulate({ brightness: 1.2, saturation: 1.3 });
    } else if (promptLower.includes('blur') || promptLower.includes('soft')) {
      image = image.blur(3);
    } else {
      // Default: slight color enhancement
      image = image.modulate({ saturation: 1.1, brightness: 1.05 });
    }

    // Add a colored border to show it's been "processed"
    image = image.extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 100, g: 200, b: 255, alpha: 1 }
    });

    // Generate output path
    const timestamp = Date.now();
    const outputPath = input.imagePath.replace(
      /(\.[^.]+)$/,
      `-generated-${timestamp}$1`
    );

    // Save the processed image
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

/**
 * Validate image file
 */
export async function validateImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!metadata.format;
  } catch {
    return false;
  }
}

