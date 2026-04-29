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

const withFocus = guideEditorService.updateStepFocus(guide, 0, {
  x: 10,
  y: 20,
  width: 30,
  height: 12,
  label: 'Save',
});
assert.equal(withFocus.steps[0].focus?.x, 10);
assert.equal(withFocus.steps[0].focus?.label, 'Save');

const resizedFocus = guideEditorService.updateStepFocus(withFocus, 0, { width: 18, height: 9 });
assert.equal(resizedFocus.steps[0].focus?.x, 10);
assert.equal(resizedFocus.steps[0].focus?.width, 18);
assert.equal(resizedFocus.steps[0].focus?.height, 9);

const movedLabel = guideEditorService.updateStepFocus(resizedFocus, 0, {
  labelX: 88,
  labelY: 12,
  labelWidth: 24,
});
assert.equal(movedLabel.steps[0].focus?.labelX, 76);
assert.equal(movedLabel.steps[0].focus?.labelY, 12);
assert.equal(movedLabel.steps[0].focus?.labelWidth, 24);

const withoutFocus = guideEditorService.deleteStepFocus(movedLabel, 0);
assert.equal(withoutFocus.steps[0].focus, undefined);

console.log('GuideEditor tests passed');
