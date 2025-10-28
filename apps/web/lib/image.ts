export async function compressImageFile(
  file: File,
  options: { maxSize: number; quality: number; format?: 'image/webp' | 'image/jpeg' } = {
    maxSize: 1024,
    quality: 0.8,
    format: 'image/webp',
  }
): Promise<File> {
  const img = await readImage(file);
  const { canvas, ctx } = createCanvas();
  const { width, height } = scaleToMax(img.width, img.height, options.maxSize);
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  const type = options.format ?? 'image/webp';
  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), type, options.quality)
  );
  return new File([blob], renameToExtension(file.name, type), { type });
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createCanvas() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  return { canvas, ctx };
}

function scaleToMax(w: number, h: number, max: number) {
  const ratio = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function renameToExtension(name: string, mime: string) {
  const ext = mime === 'image/jpeg' ? 'jpg' : 'webp';
  return name.replace(/\.[^.]+$/, '') + '.' + ext;
}


