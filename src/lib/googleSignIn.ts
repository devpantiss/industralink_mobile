import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { t } from './i18n';

/**
 * "Sign in with Google" on the phone: Android's Credential Manager one-tap sheet
 * (react-native-nitro-google-signin). The app only gets Google's ID token; the backend
 * checks it (POST /auth/google) and logs in or creates the account.
 *
 * The web client ID tells Google who the token is for (our backend). Not secret.
 * Android only for now; never in Expo Go (it has no native Google code).
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const googleSupported = Platform.OS === 'android' && !isRunningInExpoGo() && WEB_CLIENT_ID.length > 0;

type Lib = typeof import('react-native-nitro-google-signin');

/** Loaded on first use, so Expo Go and iPhone builds never touch the native module. */
let lib: Promise<Lib> | null = null;
function google(): Promise<Lib> {
  lib ??= import('react-native-nitro-google-signin').then((loaded) => {
    loaded.GoogleOneTapSignIn.configure({ webClientId: WEB_CLIENT_ID });
    return loaded;
  });
  return lib;
}

/**
 * Shows Google's account sheet and returns the ID token, or null if the person closed it.
 * 1. one tap with an account used here before; 2. all Google accounts on the phone;
 * 3. Google's full sign-in screen (e.g. to add an account).
 * Throws an Error with a plain message for everything else.
 */
export async function getGoogleIdToken(): Promise<string | null> {
  if (!googleSupported) throw new Error(t('Google sign-in is not available on this phone yet.'));
  const { GoogleOneTapSignIn, isSuccessResponse, isNoSavedCredentialFoundResponse, isCancelledResponse, isErrorWithCode, statusCodes } =
    await google();
  try {
    await GoogleOneTapSignIn.checkPlayServices();
    let response = await GoogleOneTapSignIn.signIn();
    if (isNoSavedCredentialFoundResponse(response)) response = await GoogleOneTapSignIn.createAccount();
    if (isNoSavedCredentialFoundResponse(response)) response = await GoogleOneTapSignIn.presentExplicitSignIn();

    if (isSuccessResponse(response)) return response.data.idToken;
    if (isCancelledResponse(response)) return null;
    return null; // still no account: the person backed out of Google's screen
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return null;
    throw new Error(googleErrorText(error, isErrorWithCode, statusCodes));
  }
}

function googleErrorText(error: unknown, isErrorWithCode: Lib['isErrorWithCode'], statusCodes: Lib['statusCodes']): string {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return t('Update Google Play services on this phone, then try again.');
      case statusCodes.DEVELOPER_ERROR:
        // Wrong SHA-1 / package / client ID in Google Cloud. Only the team can fix it.
        return t('Google sign-in is not set up correctly yet. Please use email for now.');
    }
  }
  return t('Google sign-in did not work. Check your internet and try again.');
}

/**
 * At logout: the next "Sign in with Google" asks which account again
 * (shared phones). Never fails logout.
 */
export async function forgetGoogle(): Promise<void> {
  if (!googleSupported) return;
  try {
    await (await google()).GoogleOneTapSignIn.signOut();
  } catch {
    // Logging out of the app matters more than Google's local state.
  }
}
