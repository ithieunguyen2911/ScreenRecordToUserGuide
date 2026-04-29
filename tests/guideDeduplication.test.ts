import assert from 'node:assert/strict';
import { guideDeduplicationService } from '../src/services/GuideDeduplicationService';
import { RecordedAction, UserGuide } from '../src/models';

const duplicateClickActions: RecordedAction[] = [
  {
    timestamp: 1,
    action: 'click',
    label: 'Click Save',
    target: 'Save',
    controlType: 'Button',
    x: 20,
    y: 30,
    width: 8,
    height: 6,
  },
  {
    timestamp: 1.3,
    action: 'click',
    label: 'Click Save',
    target: 'Save',
    controlType: 'Button',
    x: 20.8,
    y: 30.7,
    width: 8,
    height: 6,
  },
  {
    timestamp: 4,
    action: 'click',
    label: 'Click Save',
    target: 'Save',
    controlType: 'Button',
    x: 20,
    y: 30,
    width: 8,
    height: 6,
  },
];

const dedupedActions = guideDeduplicationService.dedupeActions(duplicateClickActions);
assert.equal(dedupedActions.length, 2);
assert.equal(dedupedActions[0].timestamp, 1);
assert.equal(dedupedActions[1].timestamp, 4);

const guide: UserGuide = {
  title: 'Guide',
  introduction: 'Intro',
  steps: [
    {
      timestamp: 2,
      title: 'Click nut Save',
      description: 'Click vao nut Save.',
      action: 'click',
      focus: { x: 40, y: 50, width: 10, height: 8, label: 'Save' },
    },
    {
      timestamp: 2.4,
      title: 'Click nut Save',
      description: 'Click vao nut Save.',
      action: 'click',
      focus: { x: 41, y: 50.5, width: 10, height: 8, label: 'Save' },
    },
    {
      timestamp: 5,
      title: 'Nhap vao o Search',
      description: 'Nhap du lieu vao o Search.',
      action: 'type',
      focus: { x: 10, y: 12, width: 20, height: 5, label: 'Search' },
    },
  ],
  importantNotes: [],
};

const dedupedGuide = guideDeduplicationService.dedupeGuide(guide);
assert.equal(dedupedGuide.steps.length, 2);
assert.equal(dedupedGuide.steps[0].title, 'Click nut Save');
assert.equal(dedupedGuide.steps[1].title, 'Nhap vao o Search');

console.log('GuideDeduplication tests passed');
