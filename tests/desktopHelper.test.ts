import assert from 'node:assert/strict';
import { desktopHelperService } from '../src/services/DesktopHelperService';

const originalFetch = globalThis.fetch;
globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.method === 'POST') {
    return {
      ok: true,
      json: async () => ([
        {
          timestamp: 2.4,
          type: 'click',
          screenX: 960,
          screenY: 540,
          width: 90,
          height: 70,
          screenLeft: 0,
          screenTop: 0,
          screenWidth: 1920,
          screenHeight: 1080,
          label: 'Click here',
          screenshot: 'data:image/jpeg;base64,abc',
          capturedAt: new Date().toISOString(),
        },
      ]),
    } as Response;
  }

  return {
    ok: true,
    json: async () => ({ ok: true, isRecording: false, actionCount: 0 }),
  } as Response;
};

const status = await desktopHelperService.getStatus();
assert.equal(status?.ok, true);

const actions = await desktopHelperService.stop();
assert.equal(actions.length, 1);
assert.equal(actions[0].action, 'click');
assert.equal(actions[0].screenshot, 'data:image/jpeg;base64,abc');
assert.equal(Math.round(actions[0].x), 48);
assert.equal(Math.round(actions[0].y), 47);

globalThis.fetch = originalFetch;

console.log('DesktopHelper tests passed');
