import { MAX_REPAIR_PHOTO_BYTES, REPAIR_IMAGE_TYPES, repairId, type RepairPhoto } from '../data/repair';

function header(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(new Error('This image could not be read. Try selecting it again.'));
    reader.onabort = () => reject(new Error('Reading the image was interrupted.'));
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

function matchesImageType(bytes: Uint8Array, type: string): boolean {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

async function checkDimensions(file: File) {
  if (typeof createImageBitmap === 'function') {
    const image = await createImageBitmap(file);
    try {
      if (!image.width || !image.height || image.width * image.height > 40_000_000) throw new Error('Use an image smaller than 40 megapixels.');
    } finally { image.close(); }
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000) reject(new Error('Use an image smaller than 40 megapixels.'));
      else resolve();
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file is not a readable image.')); };
    image.src = url;
  });
}

export async function prepareRepairPhoto(file: File): Promise<RepairPhoto> {
  if (!REPAIR_IMAGE_TYPES.includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image. Videos, SVG, and HEIC files are not supported yet.');
  if (!file.size || file.size > MAX_REPAIR_PHOTO_BYTES) throw new Error('Each photo must be between 1 byte and 5 MB.');
  if (!matchesImageType(await header(file), file.type)) throw new Error('The file contents do not match its image type. Select a valid photo.');
  try { await checkDimensions(file); }
  catch (error) { throw new Error(error instanceof Error && error.message.includes('40 megapixels') ? error.message : 'This photo could not be decoded. Try a different JPG, PNG, or WebP image.'); }
  return { id: repairId(), name: file.name.slice(0, 255), type: file.type, size: file.size, blob: file.slice(0, file.size, file.type) };
}
