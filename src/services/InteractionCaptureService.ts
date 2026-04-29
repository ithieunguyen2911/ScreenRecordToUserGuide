import { RecordedAction } from '../models';

export class InteractionCaptureService {
  private actions: RecordedAction[] = [];
  private startedAt = 0;
  private targetElement: HTMLElement | null = null;
  private listeners: Array<() => void> = [];

  start(targetElement: HTMLElement | null): void {
    this.stop();
    this.actions = [];
    this.startedAt = Date.now();
    this.targetElement = targetElement;

    const clickHandler = (event: MouseEvent) => {
      this.recordPointerAction(event, 'click', 'Click here');
    };
    const wheelHandler = (event: WheelEvent) => {
      this.recordPointerAction(event, 'scroll', 'Scroll');
    };
    const keydownHandler = (event: KeyboardEvent) => {
      if (!this.isTypingKey(event)) return;
      const focus = this.getElementFocus(document.activeElement);
      if (!focus) return;

      this.actions.push({
        timestamp: this.elapsedSeconds(),
        action: 'type',
        label: 'Type here',
        ...focus,
        target: this.describeElement(document.activeElement),
      });
    };

    document.addEventListener('click', clickHandler, true);
    document.addEventListener('wheel', wheelHandler, true);
    document.addEventListener('keydown', keydownHandler, true);

    this.listeners = [
      () => document.removeEventListener('click', clickHandler, true),
      () => document.removeEventListener('wheel', wheelHandler, true),
      () => document.removeEventListener('keydown', keydownHandler, true),
    ];
  }

  stop(): RecordedAction[] {
    this.listeners.forEach(remove => remove());
    this.listeners = [];
    const actions = [...this.actions];
    this.targetElement = null;
    return actions;
  }

  private recordPointerAction(event: MouseEvent, action: 'click' | 'scroll', label: string): void {
    const focus = this.getPointFocus(event.clientX, event.clientY);
    if (!focus) return;

    this.actions.push({
      timestamp: this.elapsedSeconds(),
      action,
      label,
      ...focus,
      target: this.describeElement(event.target),
    });
  }

  private getPointFocus(clientX: number, clientY: number) {
    const rect = this.targetElement?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, x - 4),
      y: Math.max(0, y - 4),
      width: 8,
      height: 8,
    };
  }

  private getElementFocus(element: Element | null) {
    const rect = this.targetElement?.getBoundingClientRect();
    if (!rect || !element || !(element instanceof HTMLElement)) return null;

    const elementRect = element.getBoundingClientRect();
    if (
      elementRect.right < rect.left ||
      elementRect.left > rect.right ||
      elementRect.bottom < rect.top ||
      elementRect.top > rect.bottom
    ) {
      return null;
    }

    return {
      x: ((elementRect.left - rect.left) / rect.width) * 100,
      y: ((elementRect.top - rect.top) / rect.height) * 100,
      width: (elementRect.width / rect.width) * 100,
      height: (elementRect.height / rect.height) * 100,
    };
  }

  private elapsedSeconds() {
    return Math.max(0, Number(((Date.now() - this.startedAt) / 1000).toFixed(1)));
  }

  private isTypingKey(event: KeyboardEvent) {
    return event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Enter';
  }

  private describeElement(target: EventTarget | Element | null) {
    if (!(target instanceof HTMLElement)) return undefined;
    const label = target.getAttribute('aria-label') || target.getAttribute('placeholder') || target.innerText;
    if (!label) return target.tagName.toLowerCase();
    return label.trim().replace(/\s+/g, ' ').slice(0, 80);
  }
}

export const interactionCaptureService = new InteractionCaptureService();
