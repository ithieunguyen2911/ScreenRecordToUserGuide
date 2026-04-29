import { RecordedAction, UserGuide } from '../models';
import { stepTextService } from './StepTextService';

function createTimelineSteps(durationSeconds: number) {
  const duration = Math.max(1, Math.round(durationSeconds));
  const stepCount = Math.min(12, Math.max(3, Math.ceil(duration / 4)));
  const interval = duration / stepCount;

  return Array.from({ length: stepCount }, (_, index) => {
    const timestamp = Number(Math.min(Math.max(duration - 0.1, 0), index * interval).toFixed(1));
    return {
      timestamp,
      title: `Man hinh thao tac ${index + 1}`,
      description: 'Xem lai man hinh tai thoi diem nay va chinh sua mo ta thanh thao tac thuc te truoc khi xuat tai lieu.',
      action: 'review',
    };
  });
}

export function createFallbackGuide(fileName: string, durationSeconds: number, actions: RecordedAction[] = []): UserGuide {
  const steps = actions.length > 0
    ? actions.map((action, index) => ({
        timestamp: action.timestamp,
        title: stepTextService.createTitle(action, index),
        description: stepTextService.createDescription(action),
        action: action.action,
        focus: {
          x: action.x,
          y: action.y,
          width: action.width,
          height: action.height,
          label: action.label,
        },
        screenshot: action.screenshot,
      }))
    : createTimelineSteps(durationSeconds);

  return {
    title: fileName || 'Screen recording guide',
    introduction: 'User guide duoc tao tu man hinh da record. Ban co the chinh sua tung buoc, mo ta va tieu de truoc khi xuat tai lieu.',
    steps,
    importantNotes: [],
  };
}
