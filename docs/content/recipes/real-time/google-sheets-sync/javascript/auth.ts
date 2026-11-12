import { CLIENT_ID } from './config';

// The parts of the Google Identity Services library this app uses. The library loads from
// https://accounts.google.com/gsi/client (see index.html); Google doesn't support self-hosting it.
interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: { type: string }) => void;
          }): TokenClient;
        };
      };
    };
  }
}

// Read and write access to the user's spreadsheets.
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let client: TokenClient | null = null;

// Opens Google's consent popup and resolves with an access token. Call it from a click
// handler: browsers block the popup otherwise. The token is short-lived and there is no
// refresh token in this flow, so when it expires the user signs in again.
export function signIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    const oauth2 = window.google?.accounts.oauth2;

    if (!oauth2) {
      reject(new Error('Google Identity Services has not loaded yet.'));

      return;
    }

    client = oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => (response.error ? reject(new Error(response.error)) : resolve(response.access_token)),
      error_callback: (error) => reject(new Error(`Sign-in failed: ${error.type}`)),
    });
    client.requestAccessToken();
  });
}
