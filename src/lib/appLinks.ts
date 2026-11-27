import { useCallback } from 'react';
import { useLinkTo } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';

/**
 * The backend points to screens with the dashboard's web addresses
 * (e.g. /worker/applications/<id>, /employer/messages?c=<id>). This turns them into the
 * app's own paths (the `linking` config in RootNavigator), so bell items, phone
 * notifications and home cards open the same screen as on the web.
 *
 * Returns null for a link of another role or one the app has no screen for.
 */
export function appPathFor(link: string | undefined, role: Role | null): string | null {
  if (!link || !role || !link.startsWith(`/${role}`)) return null;
  const [path = '', query = ''] = link.split('?');
  const chat = query.match(/(?:^|&)c=([\w-]+)/)?.[1];
  let m: RegExpMatchArray | null;

  if (role === 'worker') {
    if ((m = path.match(/^\/worker\/applications\/([\w-]+)$/))) return `/application/${m[1]}`;
    if ((m = path.match(/^\/worker\/jobs\/([\w-]+)$/))) return `/job/${m[1]}`;
    if (path === '/worker/messages') return chat ? `/chat/${chat}` : '/messages';
    if ((m = path.match(/^\/worker\/(applications|profile|saved|companies)$/))) return `/${m[1]}`;
    if (path === '/worker' || path === '/worker/home') return '/home';
    return null;
  }

  if (role === 'employer') {
    if ((m = path.match(/^\/employer\/jobs\/([\w-]+)\/edit$/))) return `/employer/post-job/${m[1]}`;
    if ((m = path.match(/^\/employer\/jobs\/([\w-]+)$/))) return `/employer/job/${m[1]}`;
    if (path === '/employer/messages') return chat ? `/employer/chat/${chat}` : '/employer/messages';
    if (/^\/employer(\/(jobs|candidates|company))?$/.test(path)) return path;
    return null;
  }

  if (/^\/admin(\/(verifications|reports|users|jobs))?$/.test(path)) return path;
  return null;
}

/** Opens a backend link in the app (bell items, notifications, home cards). Unknown links do nothing. */
export function useOpenLink() {
  const linkTo = useLinkTo();
  const role = useAuthStore((s) => s.role);
  return useCallback(
    (link: string | undefined) => {
      const path = appPathFor(link, role);
      if (!path) return;
      try {
        linkTo(path);
      } catch {
        // A screen this version of the app doesn't have: stay where we are.
      }
    },
    [linkTo, role],
  );
}
