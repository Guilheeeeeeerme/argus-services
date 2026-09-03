declare global {
  interface Window {
    ARGUS_TRIAGE_CONFIG?: { apiUrl: string; websocketUrl: string };
  }
}

const runtimeConfig = window.ARGUS_TRIAGE_CONFIG;
export const API = runtimeConfig?.apiUrl ?? import.meta.env.VITE_ADMIN_API ?? 'https://api.development.argus.com';
export const WS = runtimeConfig?.websocketUrl ?? import.meta.env.VITE_WS_API ?? 'wss://development.argus.com:3002';

export type Session = { tenant_id: string | null; role: string };

export function redirectToLogin() {
  window.location.assign(`https://app.development.argus.com/?returnTo=${encodeURIComponent(window.location.href)}`);
}
