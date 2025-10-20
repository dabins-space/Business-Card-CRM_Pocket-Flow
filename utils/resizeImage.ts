// utils/resizeImage.ts
type ResizeOpts = {
    maxWidth?: number;      // 긴 변 기준 최대 크기
    maxHeight?: number;
    quality?: number;       // 0~1 (JPEG/WEBP)
    mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
    targetBytes?: number;   // 목표 최대 바이트 (예: 3_000_000 = 3MB)
  };
  
  export async function resizeImage(
    file: File,
    opts: ResizeOpts = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.82,
      mimeType = 'image/jpeg',
      targetBytes = 3_000_000, // 3MB 이하로 조절 (Vercel 4MB 안전선)
    } = opts;
  
    // File → HTMLImageElement
    const img = await fileToImage(file);
  
    // 목표 크기 계산(가로/세로 비율 유지)
    const { width, height } = fitWithin(img.width, img.height, maxWidth, maxHeight);
  
    // draw
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
  
    ctx.drawImage(img, 0, 0, width, height);
  
    // 품질 조절 루프(목표 바이트 이하가 될 때까지 품질 낮춤)
    let q = quality;
    let blob = await toBlob(canvas, mimeType, q);
    while (blob.size > targetBytes && q > 0.4) {
      q -= 0.07;                       // 조금씩 낮춰가며 재시도
      blob = await toBlob(canvas, mimeType, q);
    }
    return blob;
  }
  
  function fitWithin(w: number, h: number, maxW: number, maxH: number) {
    const ratio = Math.min(maxW / w, maxH / h, 1); // 원본보다 키우지 않음
    return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
  }
  
  function fileToImage(file: File): Promise<HTMLImageElement> {
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
  
  function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        type,
        quality
      );
    });
  }
  