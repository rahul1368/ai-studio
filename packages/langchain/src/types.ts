export interface GenerationInput {
  imageBuffer: Buffer;
  imagePath: string;
  prompt: string;
}

export interface GenerationResult {
  success: boolean;
  resultPath?: string;
  error?: string;
}

