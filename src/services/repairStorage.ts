import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { snapshotRepair, validateRepair, type RepairDraft, type SubmittedRepairRequest } from '../data/repair';

interface RepairDatabase extends DBSchema {
  drafts: { key: string; value: { ownerId: string; draft: RepairDraft } };
  requests: { key: string; value: SubmittedRepairRequest; indexes: { ownerId: string } };
}

let database: Promise<IDBPDatabase<RepairDatabase>> | undefined;

function db() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Local storage is unavailable in this browser.'));
  if (!database) {
    database = openDB<RepairDatabase>('fixhub-repairs-v1', 1, {
      upgrade(database) {
        database.createObjectStore('drafts', { keyPath: 'ownerId' });
        database.createObjectStore('requests', { keyPath: 'id' }).createIndex('ownerId', 'ownerId');
      },
      blocking() { void closeRepairStorage(); },
      terminated() { database = undefined; },
    }).catch(error => { database = undefined; throw error; });
  }
  return database;
}

export async function closeRepairStorage() {
  const current = database;
  database = undefined;
  if (current) (await current).close();
}

export async function loadRepairDraft(ownerId: string): Promise<RepairDraft | null> {
  const row = await (await db()).get('drafts', ownerId);
  if (!row) return null;
  const draft = row.draft;
  if (!draft || typeof draft.id !== 'string' || !Array.isArray(draft.photos)
    || ['device', 'brand', 'model', 'problem', 'serviceType', 'location'].some(key => typeof draft[key as keyof RepairDraft] !== 'string')) {
    throw new Error('The saved draft could not be read. Its stored data has not been deleted.');
  }
  return draft;
}

export async function saveRepairDraft(ownerId: string, draft: RepairDraft) {
  await (await db()).put('drafts', { ownerId, draft: snapshotRepair(draft) });
}

export async function listRepairRequests(ownerId: string): Promise<SubmittedRepairRequest[]> {
  const rows = await (await db()).getAllFromIndex('requests', 'ownerId', ownerId);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getRepairRequest(ownerId: string, id: string): Promise<SubmittedRepairRequest | null> {
  const record = await (await db()).get('requests', id);
  return record?.ownerId === ownerId ? record : null;
}

/** Retain legacy browser records safely while stopping repeated uploads after server confirmation. */
export async function markRepairRequestSynced(ownerId: string, id: string) {
  const database = await db();
  const record = await database.get('requests', id);
  if (record?.ownerId === ownerId) await database.put('requests', { ...record, synced: true, syncError: undefined });
}

/** Atomic save + draft reset. Repeating the same draft ID never creates a duplicate. */
export async function submitRepairRequest(ownerId: string, draft: RepairDraft, nextDraft: RepairDraft): Promise<SubmittedRepairRequest> {
  if (Object.keys(validateRepair(draft)).length) throw new Error('Complete the required device details and location first.');
  const database = await db();
  const tx = database.transaction(['requests', 'drafts'], 'readwrite');
  try {
    const existing = await tx.objectStore('requests').get(draft.id);
    if (existing) {
      if (existing.ownerId !== ownerId) throw new Error('This request belongs to another local profile.');
      await tx.done;
      return existing;
    }
    const record: SubmittedRepairRequest = {
      ...snapshotRepair(draft), ownerId,
      reference: `FH-${draft.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
      createdAt: new Date().toISOString(), status: 'Pending',
    };
    await tx.objectStore('requests').add(record);
    await tx.objectStore('drafts').put({ ownerId, draft: snapshotRepair(nextDraft) });
    await tx.done;
    return record;
  } catch (error) {
    try { tx.abort(); } catch { /* The transaction may already have aborted. */ }
    await tx.done.catch(() => undefined);
    throw error;
  }
}

export function repairStorageMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'name' in error && error.name === 'QuotaExceededError') {
    return 'Your device storage is full. Remove some attachments or free up space, then try again. Unsaved changes are still in the current form.';
  }
  return 'Could not save on this device. Browser storage may be blocked or unavailable. Your current form is still here; try again before leaving the page.';
}
