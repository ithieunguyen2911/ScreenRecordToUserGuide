import assert from 'node:assert/strict';
import { desktopHelperService } from '../src/services/DesktopHelperService';

const originalFetch = globalThis.fetch;
const requests: Array<{ url: string; init?: RequestInit }> = [];
globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
  requests.push({ url: String(_input), init });
  if (String(_input).endsWith('/session/start')) {
    return {
      ok: true,
      json: async () => ({ ok: true, isRecording: true, actionCount: 0 }),
    } as Response;
  }

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
          label: 'Click Search',
          elementName: 'Search',
          controlType: 'Button',
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

const started = await desktopHelperService.start({
  fileName: 'Record:bad/name',
  useMicrophone: false,
  saveToLocal: true,
  storageRoot: 'C:\\Users\\HUU HIEU\\Downloads\\Temp',
});
assert.equal(started, true);
const startRequest = requests.find(request => request.url.endsWith('/session/start'));
assert.equal(startRequest?.init?.body, JSON.stringify({
  storageRoot: 'C:\\Users\\HUU HIEU\\Downloads\\Temp',
  recordName: 'Record_bad_name',
}));

const actions = await desktopHelperService.stop();
assert.equal(actions.length, 1);
assert.equal(actions[0].action, 'click');
assert.equal(actions[0].label, 'Click Search');
assert.equal(actions[0].target, 'Search');
assert.equal(actions[0].screenshot, 'data:image/jpeg;base64,abc');
assert.equal(Math.round(actions[0].x), 50);
assert.equal(Math.round(actions[0].y), 50);

globalThis.fetch = originalFetch;

console.log('DesktopHelper tests passed');
