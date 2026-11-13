import { Linking } from 'react-native';
import { USE_MOCKS } from '../api/client';
import { useUiStore } from '../store/uiStore';
import { telUrl, whatsappUrl } from './format';

/**
 * Open the phone dialer or WhatsApp. With demo data the numbers are made up and could belong
 * to real people, so we show a message instead of dialling.
 */
export function openContact(kind: 'call' | 'whatsapp', phone?: string | null) {
  if (USE_MOCKS) {
    useUiStore.getState().showToast('Demo number. Calling is turned off in the demo.', 'info');
    return;
  }
  const url = kind === 'call' ? telUrl(phone) : whatsappUrl(phone);
  Linking.openURL(url).catch(() =>
    useUiStore.getState().showToast(kind === 'call' ? 'Could not open the phone app.' : 'Could not open WhatsApp.', 'error')
  );
}
