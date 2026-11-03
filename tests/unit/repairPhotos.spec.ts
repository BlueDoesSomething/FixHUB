import { afterEach, describe, expect, test, vi } from 'vitest';
import { prepareRepairPhoto } from '@/services/repairPhotos';

afterEach(() => vi.unstubAllGlobals());

describe('repair photo validation', () => {
  test('rejects unsupported formats, empty files, and files larger than 5 MB', async () => {
    await expect(prepareRepairPhoto(new File(['text'], 'bad.svg', { type: 'image/svg+xml' }))).rejects.toThrow('JPG, PNG, or WebP');
    await expect(prepareRepairPhoto(new File([], 'empty.png', { type: 'image/png' }))).rejects.toThrow('5 MB');
    await expect(prepareRepairPhoto(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' }))).rejects.toThrow('5 MB');
  });

  test('rejects a file disguised with an allowed MIME type', async () => {
    await expect(prepareRepairPhoto(new File(['<svg/>'], 'fake.png', { type: 'image/png' }))).rejects.toThrow('contents do not match');
  });

  test('checks image decoding and stores a binary Blob, not a preview URL', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 100, height: 100, close }));
    const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], 'device.png', { type: 'image/png' });
    const photo = await prepareRepairPhoto(file);
    expect(photo.name).toBe('device.png');
    expect(photo.blob.size).toBe(file.size);
    expect(photo.blob.type).toBe('image/png');
    expect(close).toHaveBeenCalledOnce();
    expect(photo).not.toHaveProperty('previewUrl');
  });

  test('rejects undecodable images and excessive pixel dimensions', async () => {
    const file = new File([new Uint8Array([255, 216, 255, 0])], 'device.jpg', { type: 'image/jpeg' });
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('Invalid image')));
    await expect(prepareRepairPhoto(file)).rejects.toThrow('could not be decoded');
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10000, height: 10000, close }));
    await expect(prepareRepairPhoto(file)).rejects.toThrow('40 megapixels');
    expect(close).toHaveBeenCalledOnce();
  });
});
