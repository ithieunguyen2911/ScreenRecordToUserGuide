import { ActionFocus, GuideStep, UserGuide } from '../models';

export class GuideEditorService {
  updateGuide(guide: UserGuide, changes: Partial<Pick<UserGuide, 'title' | 'introduction' | 'importantNotes'>>): UserGuide {
    return {
      ...guide,
      ...changes,
      importantNotes: changes.importantNotes ?? guide.importantNotes,
    };
  }

  updateStep(guide: UserGuide, index: number, changes: Partial<GuideStep>): UserGuide {
    return {
      ...guide,
      steps: guide.steps.map((step, stepIndex) => (
        stepIndex === index ? { ...step, ...changes } : step
      )),
    };
  }

  updateStepFocus(guide: UserGuide, index: number, changes: Partial<ActionFocus>): UserGuide {
    const currentFocus = guide.steps[index]?.focus ?? {
      x: 42,
      y: 42,
      width: 16,
      height: 10,
      label: 'Click here',
    };

    const nextFocus = this.clampFocus({
      ...currentFocus,
      ...changes,
    });

    return this.updateStep(guide, index, { focus: nextFocus });
  }

  deleteStepFocus(guide: UserGuide, index: number): UserGuide {
    return {
      ...guide,
      steps: guide.steps.map((step, stepIndex) => {
        if (stepIndex !== index) return step;
        const { focus: _focus, ...stepWithoutFocus } = step;
        return stepWithoutFocus;
      }),
    };
  }

  deleteStep(guide: UserGuide, index: number): UserGuide {
    return {
      ...guide,
      steps: guide.steps.filter((_, stepIndex) => stepIndex !== index),
    };
  }

  moveStep(guide: UserGuide, index: number, direction: -1 | 1): UserGuide {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= guide.steps.length) return guide;

    const steps = [...guide.steps];
    const [step] = steps.splice(index, 1);
    steps.splice(targetIndex, 0, step);

    return {
      ...guide,
      steps,
    };
  }

  updateNote(guide: UserGuide, index: number, value: string): UserGuide {
    return {
      ...guide,
      importantNotes: guide.importantNotes.map((note, noteIndex) => (
        noteIndex === index ? value : note
      )),
    };
  }

  addNote(guide: UserGuide): UserGuide {
    return {
      ...guide,
      importantNotes: [...guide.importantNotes, 'New note'],
    };
  }

  deleteNote(guide: UserGuide, index: number): UserGuide {
    return {
      ...guide,
      importantNotes: guide.importantNotes.filter((_, noteIndex) => noteIndex !== index),
    };
  }

  private clampFocus(focus: ActionFocus): ActionFocus {
    const width = this.clamp(focus.width, 3, 100);
    const height = this.clamp(focus.height, 3, 100);
    const x = this.clamp(focus.x, 0, 100 - width);
    const y = this.clamp(focus.y, 0, 100 - height);
    const labelWidth = this.clamp(focus.labelWidth ?? 18, 8, 60);
    const labelX = this.clamp(focus.labelX ?? Math.min(x + width + 2, 100 - labelWidth), 0, 100 - labelWidth);
    const labelY = this.clamp(focus.labelY ?? Math.max(y - 9, 4), 0, 94);

    return {
      ...focus,
      x,
      y,
      width,
      height,
      labelX,
      labelY,
      labelWidth,
    };
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }
}

export const guideEditorService = new GuideEditorService();
