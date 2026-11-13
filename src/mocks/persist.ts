import { File, Paths } from 'expo-file-system';
import { mockDb } from './db';

/**
 * Keeps demo data across app reloads: what you apply to, shortlist or approve stays done.
 * Bump VERSION when the seed data changes so old saved data is thrown away.
 */
const VERSION = 1;
const file = () => new File(Paths.document, 'industrialink-demo-data.json');

export function loadDemoData() {
  try {
    const f = file();
    if (!f.exists) return;
    const saved = JSON.parse(f.textSync());
    if (saved?.version === VERSION && saved.data) mockDb.restore(saved.data);
  } catch {
    // Unreadable file: start from the seed data.
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
/** Save shortly after a change (several quick changes write once). */
export function saveDemoData() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      const f = file();
      if (!f.exists) f.create();
      f.writeSync(JSON.stringify({ version: VERSION, data: mockDb.snapshot() }));
    } catch {
      // Saving is a convenience; ignore failures.
    }
  }, 300);
}

/** Forget saved demo changes (takes effect on the next app start). */
export function resetDemoData() {
  clearTimeout(timer);
  try {
    const f = file();
    if (f.exists) f.delete();
  } catch {
    // Nothing to delete.
  }
}
