import assert from 'node:assert/strict';
import { getStepFocus, normalizeFocus } from '../src/services/ActionFocusService';

assert.deepEqual(normalizeFocus({ x: 95, y: -10, width: 30, height: 12 }), {
  x: 70,
  y: 0,
  width: 30,
  height: 12,
  label: undefined,
});

assert.equal(getStepFocus({
  timestamp: 1,
  title: 'Search',
  description: 'Click search',
  action: 'click',
}, 0).label, 'Click here');

assert.equal(getStepFocus({
  timestamp: 2,
  title: 'Name',
  description: 'Type name',
  action: 'type',
}, 0).label, 'Type here');

console.log('ActionFocus tests passed');
