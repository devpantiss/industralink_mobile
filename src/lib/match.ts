import type { Job, WorkerProfile, ExperienceBand } from '../types';

const ORDER: ExperienceBand[] = ['fresher', '1_2', '3_5', '5_plus'];

/** A simple 0 to 100 fit: trade 40, experience 25, education 20, city 15. */
export function matchScore(w: WorkerProfile, j: Job): number {
  let score = 0;
  if (w.trade && w.trade === j.trade) score += 40;
  if (w.experience && ORDER.indexOf(w.experience) >= ORDER.indexOf(j.experience)) score += 25;
  else if (w.experience && ORDER.indexOf(w.experience) === ORDER.indexOf(j.experience) - 1) score += 12;
  if (j.qualifications.length === 0 || j.qualifications.some((q) => w.qualifications.includes(q))) score += 20;
  const wc = w.location?.city?.trim().toLowerCase();
  if (wc && wc === j.location.city.trim().toLowerCase()) score += 15;
  else if (w.willingToRelocate) score += 8;
  return score;
}
