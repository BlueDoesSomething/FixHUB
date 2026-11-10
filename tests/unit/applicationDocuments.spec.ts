import { beforeEach, describe, expect, test, vi } from 'vitest';
import { uploadApplicationDocuments } from '@/services/applicationDocuments';

const storage = vi.hoisted(() => ({ list: vi.fn(), upload: vi.fn() }));
vi.mock('@/services/supabase', () => ({ getSupabaseBackend: () => ({ storage: { from: () => storage } }) }));

beforeEach(() => {
  vi.clearAllMocks();
  storage.list.mockResolvedValue({ data: [], error: null });
  storage.upload.mockResolvedValue({ error: null });
});

describe('application image uploads', () => {
  test('puts the image under the signed-in user and application, not the data URL header', async () => {
    await uploadApplicationDocuments('user-1', 'application-1', [{ name: 'repair.png', type: 'image/png', size: 3,
      dataUrl: 'data:image/png;base64,AQID' }]);
    expect(storage.upload).toHaveBeenCalledWith('user-1/application-1/0--repair.png',
      new Uint8Array([1, 2, 3]), { contentType: 'image/png', upsert: false });
  });

  test('does not claim success when Storage rejects the upload', async () => {
    storage.upload.mockResolvedValue({ error: new Error('Storage denied') });
    await expect(uploadApplicationDocuments('user-1', 'application-1', [{ name: 'proof.jpg', type: 'image/jpeg', size: 3,
      dataUrl: 'data:image/jpeg;base64,AQID' }])).rejects.toThrow('Storage denied');
  });
});
