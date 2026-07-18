import '@testing-library/jest-dom/vitest';

// jsdom does not implement HTMLMediaElement playback or URL.createObjectURL.
// Provide lightweight stand-ins so components that touch <audio> or file
// blobs can be rendered and interacted with in tests.

// jsdom's HTMLMediaElement.play/pause exist but are unimplemented stubs
// (play() doesn't return a Promise), so components that call
// `.play().catch(...)` throw. Always override with real Promise-returning
// stand-ins.
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};

if (!('createObjectURL' in URL)) {
  // @ts-expect-error - jsdom doesn't implement this
  URL.createObjectURL = () => 'blob:mock-url';
}
if (!('revokeObjectURL' in URL)) {
  // @ts-expect-error - jsdom doesn't implement this
  URL.revokeObjectURL = () => {};
}

// jsdom throws "Not implemented" for scrollIntoView / matchMedia in some paths
// used transitively by framer-motion / lucide icons.
if (!window.matchMedia) {
  window.matchMedia = () =>
    ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}