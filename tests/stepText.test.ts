import assert from 'node:assert/strict';
import { stepTextService } from '../src/services/StepTextService';

assert.equal(stepTextService.createDescription({
  timestamp: 1,
  action: 'click',
  label: 'Click Save',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  target: 'Save',
  controlType: 'Button',
}), 'Click vào nút Save.');

assert.equal(stepTextService.createDescription({
  timestamp: 1,
  action: 'type',
  label: 'Type in Search',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  target: 'Search',
  controlType: 'Edit',
}), 'Nhập dữ liệu vào ô nhập liệu Search.');

assert.equal(stepTextService.createDescription({
  timestamp: 1,
  action: 'select',
  label: 'Select Status',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  target: 'Status',
  controlType: 'ComboBox',
}), 'Chọn giá trị trong dropdown Status.');

console.log('StepText tests passed');
