import { ActionFocus, GuideStep } from '../models';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function normalizeFocus(focus: ActionFocus): ActionFocus {
  const width = clamp(focus.width || 20, 8, 90);
  const height = clamp(focus.height || 12, 8, 90);
  const normalized: ActionFocus = {
    x: clamp(focus.x, 0, 100 - width),
    y: clamp(focus.y, 0, 100 - height),
    width,
    height,
    label: focus.label,
  };

  if (focus.labelX !== undefined) normalized.labelX = focus.labelX;
  if (focus.labelY !== undefined) normalized.labelY = focus.labelY;
  if (focus.labelWidth !== undefined) normalized.labelWidth = focus.labelWidth;

  return normalized;
}

export function getFallbackFocus(step: GuideStep, index: number): ActionFocus {
  const action = step.action.toLowerCase();
  const label = step.focus?.label || getFocusLabel(step);

  if (action.includes('type')) {
    return normalizeFocus({ x: 34, y: 42, width: 34, height: 12, label });
  }

  if (action.includes('scroll')) {
    return normalizeFocus({ x: 86, y: 18, width: 8, height: 62, label });
  }

  if (action.includes('navigate')) {
    return normalizeFocus({ x: 12, y: 10, width: 38, height: 12, label });
  }

  const clickTargets = [
    { x: 50, y: 38 },
    { x: 82, y: 34 },
    { x: 42, y: 54 },
    { x: 64, y: 66 },
  ];
  const target = clickTargets[index % clickTargets.length];
  return normalizeFocus({ ...target, width: 16, height: 12, label });
}

export function getStepFocus(step: GuideStep, index: number): ActionFocus {
  if (step.focus) {
    return normalizeFocus({
      ...step.focus,
      label: step.focus.label || getFocusLabel(step),
    });
  }

  return getFallbackFocus(step, index);
}

export function getFocusLabel(step: GuideStep): string {
  const action = step.action.toLowerCase();

  if (action.includes('type')) return 'Type here';
  if (action.includes('scroll')) return 'Scroll';
  if (action.includes('record')) return 'Start record';
  if (action.includes('review')) return 'Review';
  if (action.includes('export')) return 'Export';
  return 'Click here';
}
