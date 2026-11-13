import { t } from './i18n';

/** Indian mobile numbers are 10 digits and start with 6 to 9. */
export const isValidPhone = (p: string) => /^[6-9]\d{9}$/.test(p);

const MESSAGES: Record<string, string> = {
  WRONG_OTP: 'That code is not right. Check the SMS and try again.',
  BLOCKED: 'This account has been blocked. Contact help if you think this is a mistake.',
  JOB_CLOSED: 'This job is no longer open.',
  ALREADY_APPLIED: 'You have already applied for this job.',
  PROFILE_INCOMPLETE: 'Complete your profile before applying.',
  NOT_VERIFIED: 'Your company must be approved before you can do this.',
  NO_DOCUMENTS: 'Upload at least one document first.',
  LOCKED: 'This cannot be changed any more.',
  ALREADY_DONE: 'This was already done.',
  NOT_FOUND: 'We could not find this. It may have been removed.',
  INVALID_CREDENTIALS: 'Email or password is not correct.',
  EXISTS: 'An account with these details already exists.',
};

/** Turns a failed request into one plain sentence for a toast. */
export function errorText(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { code?: string; message?: string } | undefined;
  if (e?.code && MESSAGES[e.code]) return t(MESSAGES[e.code]!);
  if (e?.message && !/network|timeout|axios|status code/i.test(e.message)) return e.message;
  if (e?.message && /network|timeout/i.test(e.message)) return t('No connection. Check your internet and try again.');
  return t(fallback);
}
