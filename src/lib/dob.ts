export const MIN_AGE = 18;

export function splitDob(iso?: string) {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: m[1]!, m: m[2]!, d: m[3]! } : { y: '', m: '', d: '' };
}

/** '' when empty, 'invalid' when not a real date, else YYYY-MM-DD. */
export function joinDob({ d, m, y }: { d: string; m: string; y: string }): string {
  if (!d && !m && !y) return '';
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (!day || !month || y.length !== 4) return 'invalid';
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return 'invalid';
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function ageOf(iso: string) {
  const b = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age -= 1;
  return age;
}
