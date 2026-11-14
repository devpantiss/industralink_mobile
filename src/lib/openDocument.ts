import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';

/** Why a document could not be opened, so the screen can say something useful. */
export class OpenDocumentError extends Error {
  constructor(public reason: 'missing' | 'no-app' | 'failed', cause?: unknown) {
    super(reason);
    if (cause) console.warn('[openDocument]', reason, cause);
  }
}

/** The message to show for an open failure. */
export function openErrorText(e: unknown): string {
  const reason = e instanceof OpenDocumentError ? e.reason : 'failed';
  if (reason === 'missing') return 'This file is no longer on this phone. Delete it and upload it again.';
  if (reason === 'no-app') return 'No app on this phone can open this file. Install a PDF viewer or Google Drive.';
  return 'This file cannot be opened right now. Check your internet and try again.';
}

/** Android FLAG_GRANT_READ_URI_PERMISSION, so the viewer app may read our file. */
const GRANT_READ = 1;

const guessMime = (url: string) => {
  const ext = url.split('?')[0]!.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return undefined;
};

/**
 * Opens a document (PDF or image) wherever the phone can show it.
 * - Web links open in the in-app browser. Android's browser downloads PDFs instead of showing
 *   them, so PDFs there go through Google's document viewer.
 * - Files on the phone (just picked) open in a viewer app on Android (Drive, any PDF app),
 *   and in the share sheet on iOS (Quick Look preview, "Open in", Files, Books).
 * Throws when nothing can open it, so the caller can show a message.
 */
export async function openDocument(url: string, mimeType?: string, title?: string): Promise<void> {
  const type = mimeType || guessMime(url);
  const isPdf = type === 'application/pdf';

  if (/^https?:\/\//i.test(url)) {
    const target =
      Platform.OS === 'android' && isPdf
        ? `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`
        : url;
    try {
      await WebBrowser.openBrowserAsync(target, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN });
    } catch (e) {
      // No in-app browser available: hand the link to the phone instead.
      try {
        await Linking.openURL(url);
      } catch {
        throw new OpenDocumentError('failed', e);
      }
    }
    return;
  }

  // A file on this phone (picked earlier). Expo Go keeps picked files in its cache, which the
  // phone may clear, so check it is still there.
  if (url.startsWith('file://')) {
    let exists = false;
    try {
      exists = new File(url).exists;
    } catch {
      exists = false;
    }
    if (!exists) throw new OpenDocumentError('missing');
  }

  let lastError: unknown;
  if (Platform.OS === 'android') {
    try {
      const data = url.startsWith('content://') ? url : new File(url).contentUri;
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data, flags: GRANT_READ, type: type ?? '*/*' });
      return;
    } catch (e) {
      // No app for this file type: fall through to the share sheet.
      lastError = e;
    }
  }

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(url, { mimeType: type, UTI: isPdf ? 'com.adobe.pdf' : undefined, dialogTitle: title });
      return;
    }
  } catch (e) {
    lastError = e;
  }
  throw new OpenDocumentError('no-app', lastError);
}

/**
 * Copies a just-picked file out of the temporary cache into the app's own storage, so it can
 * still be opened later. Returns the new location (or the original one if copying fails).
 */
export function keepPickedFile(uri: string, name: string): string {
  try {
    const dir = new Directory(Paths.document, 'uploads');
    if (!dir.exists) dir.create({ intermediates: true });
    const safe = `${Date.now()}-${name.replace(/[^\w.-]+/g, '_')}`;
    const dest = new File(dir, safe);
    new File(uri).copy(dest);
    return dest.uri;
  } catch (e) {
    console.warn('[keepPickedFile]', e);
    return uri;
  }
}
