declare module 'vibium/sync' {
  export interface SyncLocator {
    text(): string;
  }

  export interface SyncPage {
    go(url: string): void;
    title(): string;
    find(selector: string): SyncLocator;
  }

  export interface SyncBrowserSession {
    page(): SyncPage;
    stop(): void;
  }

  export const browser: {
    start(
      connectUrl: string,
      options?: {
        headers?: Record<string, string>;
      },
    ): SyncBrowserSession;
  };
}
