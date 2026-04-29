import { GuideStep, RecordedAction, UserGuide } from '../models';

type FocusLike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class GuideDeduplicationService {
  private readonly focusTolerance = 2.5;

  dedupeActions(actions: RecordedAction[]): RecordedAction[] {
    const kept: RecordedAction[] = [];

    for (const action of actions) {
      if (!kept.some(previous => this.isDuplicateAction(previous, action))) {
        kept.push(action);
      }
    }

    return kept;
  }

  dedupeGuide(guide: UserGuide): UserGuide {
    const steps: GuideStep[] = [];

    for (const step of guide.steps) {
      if (!steps.some(previous => this.isDuplicateStep(previous, step))) {
        steps.push(step);
      }
    }

    return {
      ...guide,
      steps,
    };
  }

  private isDuplicateAction(previous: RecordedAction, current: RecordedAction): boolean {
    if (previous.action !== current.action) return false;
    if (!this.isNearInTime(previous.timestamp, current.timestamp, previous.action)) return false;
    if (!this.hasSameIntent(previous, current)) return false;
    return this.isNearFocus(previous, current);
  }

  private isDuplicateStep(previous: GuideStep, current: GuideStep): boolean {
    if (previous.action !== current.action) return false;
    if (!this.isNearInTime(previous.timestamp, current.timestamp, previous.action)) return false;

    const sameTitle = this.normalize(previous.title) === this.normalize(current.title);
    const sameDescription = this.normalize(previous.description) === this.normalize(current.description);
    const sameLabel = this.normalize(previous.focus?.label) === this.normalize(current.focus?.label);
    const hasSameText = sameTitle || sameDescription || (Boolean(previous.focus?.label) && sameLabel);

    if (!hasSameText) return false;
    if (previous.focus && current.focus) {
      return this.isNearFocus(previous.focus, current.focus);
    }

    return true;
  }

  private hasSameIntent(previous: RecordedAction, current: RecordedAction): boolean {
    const previousTarget = this.normalize(previous.target);
    const currentTarget = this.normalize(current.target);
    const previousLabel = this.normalize(previous.label);
    const currentLabel = this.normalize(current.label);
    const previousControlType = this.normalize(previous.controlType);
    const currentControlType = this.normalize(current.controlType);

    if (previousTarget && currentTarget && previousTarget === currentTarget) return true;
    if (previousLabel && currentLabel && previousLabel === currentLabel && previousControlType === currentControlType) return true;

    return !previousTarget && !currentTarget && previousControlType === currentControlType;
  }

  private isNearInTime(previousTimestamp: number, currentTimestamp: number, action: string): boolean {
    const delta = Math.abs(currentTimestamp - previousTimestamp);
    const threshold = action === 'type' ? 2 : action === 'scroll' ? 1.2 : 0.9;
    return delta <= threshold;
  }

  private isNearFocus(previous: FocusLike, current: FocusLike): boolean {
    return Math.abs(previous.x - current.x) <= this.focusTolerance
      && Math.abs(previous.y - current.y) <= this.focusTolerance
      && Math.abs(previous.width - current.width) <= this.focusTolerance
      && Math.abs(previous.height - current.height) <= this.focusTolerance;
  }

  private normalize(value?: string): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }
}

export const guideDeduplicationService = new GuideDeduplicationService();
