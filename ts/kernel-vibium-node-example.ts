import { Kernel } from '@onkernel/sdk';
import { browser, type SyncBrowserSession } from 'vibium/sync';

type KernelBrowserRawResponse = {
  session_id?: string;
  webdriver_ws_url?: string;
  browser_live_view_url?: string | null;
  cdp_ws_url?: string;
  [key: string]: unknown;
};

function maskWebSocketURL(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return '<unparseable webdriver url>';
  }
}

function assertString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`expected ${fieldName} to be a non-empty string`);
  }
  return value;
}

async function main(): Promise<void> {
  const kernel = new Kernel();

  let sessionID: string | undefined;
  let bro: SyncBrowserSession | undefined;

  try {
    // TODO: replace raw response parsing once the published SDK exposes webdriver_ws_url.
    const response = await kernel.browsers.create().asResponse();

    const rawBrowser = (await response.json()) as KernelBrowserRawResponse;
    sessionID = assertString(rawBrowser.session_id, 'session_id');
    const webdriverWsURL = assertString(rawBrowser.webdriver_ws_url, 'webdriver_ws_url');

    console.log(`created Kernel browser session ${sessionID}`);
    console.log(`using BiDi endpoint ${maskWebSocketURL(webdriverWsURL)}`);

    bro = browser.start(webdriverWsURL);
    const page = bro.page();

    page.go('https://example.com');
    const title = page.title();
    const h1 = page.find('h1').text();

    console.log(`page title: ${title}`);
    console.log(`h1 text: ${h1}`);

    if (title !== 'Example Domain') {
      throw new Error(`expected title "Example Domain", got "${title}"`);
    }

    if (h1 !== 'Example Domain') {
      throw new Error(`expected h1 "Example Domain", got "${h1}"`);
    }

    console.log('TypeScript example completed successfully');
  } finally {
    if (bro) {
      bro.stop();
    }

    if (sessionID) {
      await kernel.browsers.deleteByID(sessionID);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
