/**
 * Live chat updates from the backend (WebSocket at <api host>/ws).
 *
 * The connection only says "something changed"; each event refreshes the matching
 * data through React Query, and the backend stays the source of truth.
 * - Drops come back by themselves (1 s, 2 s, 5 s, 10 s, 30 s…), then the chats reload.
 * - In the background the connection is closed to save battery and data; coming back
 *   to the app reconnects and reloads. (Phone push for closed apps comes with Firebase.)
 */
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { API_BASE_URL, USE_MOCKS } from './client';
import { queryKeys } from './keys';
import { storage } from '../lib/storage';

/** Waits before reconnecting: quick at first, then slower. */
const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000];
/** Close codes from the backend that mean "don't try again" (logged out, blocked, admin). */
const NO_RETRY_CODES = [4001, 4003];
/** How long "typing…" stays without a new typing event. */
const TYPING_SHOWN_MS = 4_000;
/** Least time between two "I'm typing" signals we send for one chat. */
const TYPING_SEND_GAP_MS = 2_500;

type LiveEvent =
  | { type: 'ready' }
  | { type: 'message:new'; message: { applicationId: string } }
  | { type: 'chat:read' | 'chat:changed' | 'chat:typing'; applicationId: string }
  | { type: 'messaging:changed'; enabled: boolean };

/** http://host:4000/api/v1 → ws://host:4000/ws (https → wss). */
const LIVE_URL = `${API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/v\d+\/?$/, '')}/ws`;

// ── Small store the screens can watch ──
let connected = false;
/** Chats where the other side is typing right now, each with a timer to clear it. */
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();
const changed = () => {
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Shows "typing…" for this chat, or hides it. */
function setTyping(applicationId: string, typing: boolean) {
  clearTimeout(typingTimers.get(applicationId));
  typingTimers.delete(applicationId);
  if (typing) typingTimers.set(applicationId, setTimeout(() => setTyping(applicationId, false), TYPING_SHOWN_MS));
  changed();
}

let socket: WebSocket | null = null;
const lastTypingSent = new Map<string, number>();

/** Opens the live connection. Returns a function that closes it for good. */
function startLiveChat(qc: QueryClient): () => void {
  let stopped = false;
  let paused = false;
  let attempt = 0;
  let everReady = false;
  /** True while the token is being read, so two quick calls don't open two connections. */
  let connecting = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const refreshChat = (applicationId: string) => {
    void qc.invalidateQueries({ queryKey: queryKeys.messages.threads });
    void qc.invalidateQueries({ queryKey: queryKeys.messages.thread(applicationId) });
  };

  const handle = (event: LiveEvent) => {
    switch (event.type) {
      case 'ready':
        attempt = 0;
        connected = true;
        changed();
        // After a reconnect, load everything that may have arrived meanwhile.
        if (everReady) void qc.invalidateQueries({ queryKey: ['messages'] });
        everReady = true;
        return;
      case 'message:new':
        setTyping(event.message.applicationId, false);
        return refreshChat(event.message.applicationId);
      case 'chat:read':
      case 'chat:changed':
        return refreshChat(event.applicationId);
      case 'chat:typing':
        setTyping(event.applicationId, true);
        return;
      case 'messaging:changed':
        void qc.invalidateQueries({ queryKey: ['messages'] });
    }
  };

  const connect = async () => {
    if (connecting || socket) return;
    connecting = true;
    const token = await storage.getToken().finally(() => {
      connecting = false;
    });
    if (stopped || paused || socket || !token) return;
    const ws = new WebSocket(LIVE_URL);
    socket = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));
    ws.onmessage = (message) => {
      try {
        handle(JSON.parse(String(message.data)) as LiveEvent);
      } catch {
        // Ignore broken events.
      }
    };
    ws.onclose = (close) => {
      if (socket === ws) socket = null;
      connected = false;
      changed();
      if (stopped || paused || NO_RETRY_CODES.includes(close.code)) return;
      const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
      attempt++;
      retryTimer = setTimeout(() => void connect(), delay);
    };
  };

  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      paused = false;
      attempt = 0;
      clearTimeout(retryTimer);
      void connect();
    } else if (state === 'background') {
      paused = true;
      clearTimeout(retryTimer);
      socket?.close();
    }
  });

  void connect();
  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    appState.remove();
    socket?.close();
    socket = null;
    connected = false;
    for (const timer of typingTimers.values()) clearTimeout(timer);
    typingTimers.clear();
    changed();
  };
}

/** Keeps the live connection open while this screen is shown (the logged-in app root). */
export function useLiveChat(enabled = true) {
  const qc = useQueryClient();
  useEffect(() => {
    if (USE_MOCKS || !enabled) return;
    return startLiveChat(qc);
  }, [qc, enabled]);
}

/** Tell the other side "typing…" (sent at most every 2.5 s per chat). */
export function sendTyping(applicationId: string) {
  const now = Date.now();
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (now - (lastTypingSent.get(applicationId) ?? 0) < TYPING_SEND_GAP_MS) return;
  lastTypingSent.set(applicationId, now);
  socket.send(JSON.stringify({ type: 'typing', applicationId }));
}

/** True while the live connection is up (screens can then refresh less often). */
export function useLiveConnected(): boolean {
  return useSyncExternalStore(subscribe, () => connected);
}

/** True while the other side of this chat is typing. */
export function useIsTyping(applicationId: string): boolean {
  return useSyncExternalStore(subscribe, () => typingTimers.has(applicationId));
}
