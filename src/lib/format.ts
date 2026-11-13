import type { PayPeriod } from '../types';
import { getLang, t } from './i18n';

const inr = new Intl.NumberFormat('en-IN');

export const formatNumber = (n: number) => inr.format(n);

export function formatCompact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

/** "₹18,000–22,000 / month" or "₹700 / day (about ₹18,200/month)". */
export function formatPay(min?: number, max?: number, period: PayPeriod = 'month', withMonthly = false) {
  if (!min && !max) return t('Salary not disclosed');
  const range = min && max && min !== max ? `₹${inr.format(min)}–${inr.format(max)}` : `₹${inr.format((min || max)!)}`;
  const base = `${range} / ${t(period === 'day' ? 'day' : 'month')}`;
  if (withMonthly && period === 'day') {
    const monthly = Math.round(((min || max)! * 26) / 100) * 100;
    return `${base} (${t('about ₹{n}/month', { n: inr.format(monthly) })})`;
  }
  return base;
}

const loc = () => `${getLang()}-IN`;

export function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(loc(), {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

/** True if the date is within the last `ms` milliseconds (for "New" labels and filters). */
export function isWithin(iso: string, ms: number): boolean {
  return Date.now() - new Date(iso).getTime() < ms;
}

/** True if the date is later than `ms` milliseconds ago (e.g. an interview not yet over). */
export function isAfterAgo(iso: string, ms: number): boolean {
  return new Date(iso).getTime() > Date.now() - ms;
}

export function timeAgo(iso: string): string {
  try {
    const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diffSec);
    if (abs < 60) return diffSec > 0 ? t('in a moment') : t('just now');

    const minutes = Math.round(abs / 60);
    const hours = Math.round(abs / 3600);
    const days = Math.round(abs / 86400);

    const [n, unit] = days >= 1 ? [days, 'd'] : hours >= 1 ? [hours, 'h'] : [minutes, 'm'];
    if (getLang() === 'en') return diffSec < 0 ? `${n}${unit} ago` : `in ${n}${unit}`;
    // Hindi / Odia: full words (short forms like "3d" don't translate).
    if (unit === 'd' && n === 1) return t(diffSec < 0 ? 'yesterday' : 'tomorrow');
    const word = unit === 'd' ? 'days' : unit === 'h' ? 'hours' : 'minutes';
    return t(diffSec < 0 ? `{n} ${word} ago` : `in {n} ${word}`, { n });
  } catch {
    return 'recently';
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export function greeting() {
  const h = new Date().getHours();
  return t(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
}


/** Last 10 digits of an Indian mobile number, whatever format it was stored in. */
export function phoneDigits(phone?: string | null): string {
  return (phone ?? '').replace(/\D/g, '').slice(-10);
}

/** "+91 98765 43210" */
export function formatPhone(phone?: string | null): string {
  const d = phoneDigits(phone);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : phone ?? '';
}

export const telUrl = (phone?: string | null) => `tel:+91${phoneDigits(phone)}`;
export const whatsappUrl = (phone?: string | null) => `https://wa.me/91${phoneDigits(phone)}`;
