import assert from 'node:assert/strict';
import { guideEditorService } from '../src/services/GuideEditorService';
import { UserGuide } from '../src/models';

const guide: UserGuide = {
  title: 'Original',
  introduction: 'Intro',
  steps: [
    { timestamp: 0, title: 'One', description: 'First', action: 'click' },
    { timestamp: 1, title: 'Two', description: 'Second', action: 'type' },
  ],
  importantNotes: ['Note 1'],
};

const renamed = guideEditorService.updateGuide(guide, { title: 'Updated' });
assert.equal(renamed.title, 'Updated');
assert.equal(guide.title, 'Original');

const editedStep = guideEditorService.updateStep(guide, 1, { description: 'Changed' });
assert.equal(editedStep.steps[1].description, 'Changed');
assert.equal(guide.steps[1].description, 'Second');

const moved = guideEditorService.moveStep(guide, 1, -1);
assert.equal(moved.steps[0].title, 'Two');

const deleted = guideEditorService.deleteStep(guide, 0);
assert.equal(deleted.steps.length, 1);
assert.equal(deleted.steps[0].title, 'Two');

const noteAdded = guideEditorService.addNote(guide);
assert.equal(noteAdded.importantNotes.length, 2);

console.log('GuideEditor tests passed');
