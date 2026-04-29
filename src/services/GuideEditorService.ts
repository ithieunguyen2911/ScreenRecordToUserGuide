import { GuideStep, UserGuide } from '../models';

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
}

export const guideEditorService = new GuideEditorService();
