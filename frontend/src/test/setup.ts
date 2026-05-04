import '@testing-library/jest-dom/vitest';

class RsObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = RsObserver;
