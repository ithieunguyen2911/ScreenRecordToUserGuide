import assert from 'node:assert/strict';
import { ExportService } from '../src/services/ExportService';
import { UserGuide } from '../src/models';

const guide: UserGuide = {
  title: 'Record test',
  introduction: 'Intro',
  steps: [
    {
      timestamp: 1.2,
      title: 'Click Save',
      description: 'Click vao nut Save.',
      action: 'click',
      screenshot: 'data:image/jpeg;base64,test-image',
      focus: {
        x: 20,
        y: 30,
        width: 10,
        height: 8,
        label: 'Save',
      },
    },
  ],
  importantNotes: [],
};

const service = new ExportService();
const html = service.buildWordHtml(guide);

assert.match(html, /@page WordSection1/);
assert.match(html, /\.word-body \{ width: 6\.25in; max-width: 6\.25in; \}/);
assert.match(html, /\.guide-image\s*\{[\s\S]*width: 6\.25in;[\s\S]*height: auto;/);
assert.match(html, /<div class="guide-image-frame">/);
assert.match(html, /<img class="guide-image"/);
assert.match(html, /width="600"/);
assert.match(html, /style="width: 450pt; max-width: 450pt; height: auto;/);
assert.doesNotMatch(html, /<strong>Action:<\/strong>/);
assert.doesNotMatch(html, /<strong>Time:<\/strong>/);
assert.doesNotMatch(html, /<strong>Focus:<\/strong>/);
assert.doesNotMatch(html, /style="width:\s*100%/);

const globalForTest = globalThis as unknown as {
  Image?: unknown;
  document?: unknown;
};
const originalImage = globalForTest.Image;
const originalDocument = globalForTest.document;

globalForTest.Image = class MockImage {
  naturalWidth = 2400;
  naturalHeight = 1600;
  onload?: () => void;
  onerror?: () => void;

  set src(_: string) {
    setTimeout(() => this.onload?.(), 0);
  }
};

let fillRectCalls = 0;
let strokeRectCalls = 0;
let fillTextCalls = 0;

globalForTest.document = {
  createElement: (tagName: string) => {
    assert.equal(tagName, 'canvas');
    return {
      width: 0,
      height: 0,
      getContext: () => ({
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textBaseline: '',
        drawImage: () => undefined,
        save: () => undefined,
        restore: () => undefined,
        fillRect: () => {
          fillRectCalls += 1;
        },
        strokeRect: () => {
          strokeRectCalls += 1;
        },
        beginPath: () => undefined,
        moveTo: () => undefined,
        lineTo: () => undefined,
        quadraticCurveTo: () => undefined,
        closePath: () => undefined,
        fill: () => undefined,
        fillText: () => {
          fillTextCalls += 1;
        },
      }),
      toDataURL: (mimeType: string) => {
        assert.equal(mimeType, 'image/png');
        return 'data:image/png;base64,resized-image';
      },
    };
  },
};

const resizedGuide = await service.prepareGuideForWord(guide);
assert.equal(resizedGuide.steps[0].screenshot, 'data:image/png;base64,resized-image');

const focusGuide = await service.prepareGuideForWord(guide, { includeFocusOverlay: true });
assert.equal(focusGuide.steps[0].screenshot, 'data:image/png;base64,resized-image');
assert.equal(fillRectCalls >= 4, true);
assert.equal(strokeRectCalls >= 1, true);
assert.equal(fillTextCalls >= 1, true);

globalForTest.Image = originalImage;
globalForTest.document = originalDocument;

console.log('Export Word tests passed');
