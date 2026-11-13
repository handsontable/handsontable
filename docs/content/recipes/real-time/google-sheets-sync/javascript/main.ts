import { signIn } from './auth';
import { requestsLastMinute, setAccessToken } from './sheets';
import { startSync } from './sync';
import './styles.css';

const button = document.querySelector<HTMLButtonElement>('#sign-in')!;
const status = document.querySelector('#status')!;
const requests = document.querySelector('#requests')!;

function showStatus(text: string, isError = false) {
  status.textContent = text;
  status.classList.toggle('is-error', isError);

  if (isError) {
    button.hidden = false;
  }
}

let sync: ReturnType<typeof startSync> | null = null;

button.addEventListener('click', async () => {
  try {
    setAccessToken(await signIn());
    button.hidden = true;

    if (sync) {
      sync.resume();
    } else {
      sync = startSync(document.querySelector('#grid')!, showStatus);
    }
  } catch (error) {
    showStatus((error as Error).message, true);
  }
});

setInterval(() => {
  requests.textContent = String(requestsLastMinute());
}, 1000);
