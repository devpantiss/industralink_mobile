/**
 * Small translation layer, same as the web dashboard:
 *
 *   t("Find jobs")                      -> "ନିଯୁକ୍ତି ଖୋଜନ୍ତୁ" when Odia is on
 *   t("{n} open jobs", { n: 3 })        -> placeholders work in every language
 *
 * The English text is the key, so untranslated strings stay English.
 * Only worker and logged-out screens are translated; HR and admin always see English.
 * Word lists live in ./locales (copied from the dashboard, plus app-only strings in ./extra).
 */
import hi from './locales/hi';
import or from './locales/or';
import { EXTRA_HI, EXTRA_OR } from './extra';

export type Lang = 'en' | 'hi' | 'or';

/** Native name first, so people can find their own language without reading English. */
export const LANGS: { code: Lang; native: string; english: string }[] = [
  { code: 'hi', native: 'हिंदी', english: 'Hindi' },
  { code: 'or', native: 'ଓଡ଼ିଆ', english: 'Odia' },
  { code: 'en', native: 'English', english: 'English' },
];

const DICTS: Record<Exclude<Lang, 'en'>, Record<string, string>> = {
  hi: { ...hi, ...EXTRA_HI },
  or: { ...or, ...EXTRA_OR },
};

let current: Lang = 'en';
let scopeOn = true;

export const isLang = (v: unknown): v is Lang => v === 'en' || v === 'hi' || v === 'or';

/** Pick the language (the UI store calls this and redraws the app). */
export function setLang(l: Lang) {
  current = l;
}

/** Workers and logged-out screens: on. Employer and admin: off (always English). */
export function setLangScope(on: boolean) {
  scopeOn = on;
}

/** The language actually shown right now. */
export const getLang = (): Lang => (scopeOn ? current : 'en');

export function t(text: string, vars?: Record<string, string | number>): string {
  const lang = getLang();
  let out = lang === 'en' ? text : (DICTS[lang][text] ?? text);
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}
