import { Linking } from 'react-native';
import { useUiStore } from '../store/uiStore';
import { telUrl, whatsappUrl } from './format';

/** Opens the phone dialer or WhatsApp. */
export function openContact(kind: 'call' | 'whatsapp', phone?: string | null) {
  const url = kind === 'call' ? telUrl(phone) : whatsappUrl(phone);
  Linking.openURL(url).catch(() =>
    useUiStore.getState().showToast(kind === 'call' ? 'Could not open the phone app.' : 'Could not open WhatsApp.', 'error')
  );
}
