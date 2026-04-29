import assert from 'node:assert/strict';
import { createFallbackGuide } from '../src/services/FallbackGuideService';

const guide = createFallbackGuide('Desktop_App_Demo', 12, [
  {
    timestamp: 2,
    action: 'click',
    label: 'Click here',
    x: 20,
    y: 30,
    width: 10,
    height: 8,
    target: 'Lưu',
    controlType: 'Button',
  },
]);

assert.equal(guide.title, 'Desktop_App_Demo');
assert.equal(guide.steps.length, 1);
assert.equal(guide.steps[0].action, 'click');
assert.equal(guide.steps[0].title, 'Click nút Lưu');
assert.equal(guide.steps[0].description, 'Click vào nút Lưu.');
assert.equal(guide.steps[0].focus?.x, 20);
assert.deepEqual(guide.importantNotes, []);
assert.equal(guide.introduction.includes('GEMINI_API_KEY'), false);

const emptyGuide = createFallbackGuide('No_Actions', 5);
assert.equal(emptyGuide.steps.length, 3);
assert.equal(emptyGuide.steps.some(step => step.focus), false);
assert.equal(emptyGuide.steps.every(step => step.screenshot === undefined), true);

const longGuide = createFallbackGuide('Long_Record', 30);
assert.equal(longGuide.steps.length, 8);
assert.equal(longGuide.steps[0].timestamp, 0);
assert.equal(longGuide.steps.at(-1)?.timestamp, 26.3);

console.log('FallbackGuide tests passed');
