import React, { useRef } from 'react';
import { CornerDownRight, Plus, Trash2 } from 'lucide-react';
import { ActionFocus } from '../models';

interface FocusEditorProps {
  focus?: ActionFocus;
  onChange: (focus: Partial<ActionFocus>) => void;
  onAdd: () => void;
  onDelete: () => void;
}

type DragMode = 'move' | 'resize';
type LabelDragMode = 'label-move' | 'label-resize';

type DragState = {
  mode: DragMode | LabelDragMode;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startFocus: ActionFocus;
};

const defaultFocus: ActionFocus = {
  x: 42,
  y: 42,
  width: 16,
  height: 10,
  label: 'Click here',
  labelX: 60,
  labelY: 30,
  labelWidth: 18,
};

const toPercent = (value: number, size: number) => (value / Math.max(size, 1)) * 100;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number) => Number(value.toFixed(1));

export default function FocusEditor({ focus, onChange, onAdd, onDelete }: FocusEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  if (!focus) {
    return (
      <div className="absolute inset-0 flex items-end justify-end p-4 pointer-events-none">
        <button
          type="button"
          onClick={onAdd}
          className="pointer-events-auto flex items-center gap-2 rounded-lg bg-black/85 px-3 py-2 text-xs font-black text-white shadow-xl ring-1 ring-white/15 hover:bg-black"
        >
          <Plus className="w-4 h-4 text-orange-400" />
          Add focus
        </button>
      </div>
    );
  }

  const labelWidth = clamp(focus.labelWidth ?? 18, 8, 60);
  const labelX = clamp(focus.labelX ?? focus.x + focus.width + 2, 0, 100 - labelWidth);
  const labelY = clamp(focus.labelY ?? focus.y - 9, 0, 94);

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, mode: DragMode | LabelDragMode) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startFocus: focus,
    };
  };

  const updateDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!drag || !rect || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    const deltaX = toPercent(event.clientX - drag.startClientX, rect.width);
    const deltaY = toPercent(event.clientY - drag.startClientY, rect.height);

    if (drag.mode === 'move') {
      onChange({
        x: round(clamp(drag.startFocus.x + deltaX, 0, 100 - drag.startFocus.width)),
        y: round(clamp(drag.startFocus.y + deltaY, 0, 100 - drag.startFocus.height)),
      });
      return;
    }

    if (drag.mode === 'label-move') {
      const startLabelWidth = drag.startFocus.labelWidth ?? labelWidth;
      onChange({
        labelX: round(clamp((drag.startFocus.labelX ?? labelX) + deltaX, 0, 100 - startLabelWidth)),
        labelY: round(clamp((drag.startFocus.labelY ?? labelY) + deltaY, 0, 94)),
      });
      return;
    }

    if (drag.mode === 'label-resize') {
      onChange({
        labelWidth: round(clamp((drag.startFocus.labelWidth ?? labelWidth) + deltaX, 8, 60)),
      });
      return;
    }

    onChange({
      width: round(clamp(drag.startFocus.width + deltaX, 3, 100 - drag.startFocus.x)),
      height: round(clamp(drag.startFocus.height + deltaY, 3, 100 - drag.startFocus.y)),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none"
      onPointerMove={updateDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="absolute left-0 right-0 top-0 bg-black/45 pointer-events-none" style={{ height: `${focus.y}%` }} />
      <div
        className="absolute left-0 bg-black/45 pointer-events-none"
        style={{ top: `${focus.y}%`, width: `${focus.x}%`, height: `${focus.height}%` }}
      />
      <div
        className="absolute right-0 bg-black/45 pointer-events-none"
        style={{
          top: `${focus.y}%`,
          left: `${focus.x + focus.width}%`,
          height: `${focus.height}%`,
        }}
      />
      <div
        className="absolute left-0 right-0 bottom-0 bg-black/45 pointer-events-none"
        style={{ top: `${focus.y + focus.height}%` }}
      />

      <div
        className="absolute cursor-move rounded-md border-4 border-orange-400 bg-transparent shadow-[0_0_28px_rgba(251,146,60,0.75)]"
        style={{
          left: `${focus.x}%`,
          top: `${focus.y}%`,
          width: `${focus.width}%`,
          height: `${focus.height}%`,
        }}
        onPointerDown={(event) => beginDrag(event, 'move')}
        title="Drag to move focus"
      >
        <div
          className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-orange-500 shadow-lg"
          onPointerDown={(event) => beginDrag(event, 'resize')}
          title="Drag to resize focus"
        />
      </div>

      <div
        className="absolute flex cursor-move items-center gap-2 rounded-lg bg-black/85 px-3 py-2 text-sm font-bold text-white shadow-xl ring-1 ring-white/15"
        style={{ left: `${labelX}%`, top: `${labelY}%`, width: `${labelWidth}%` }}
        onPointerDown={(event) => beginDrag(event, 'label-move')}
        title="Drag to move label"
      >
        <CornerDownRight className="w-4 h-4 text-orange-400" />
        <span className="min-w-0 flex-1 truncate">{focus.label || 'Action'}</span>
        <div
          className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-orange-500 shadow-lg"
          onPointerDown={(event) => beginDrag(event, 'label-resize')}
          title="Drag to resize label"
        />
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="absolute right-3 top-3 rounded-lg bg-black/80 p-2 text-white shadow-lg ring-1 ring-white/15 hover:bg-red-600"
        title="Delete focus"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export { defaultFocus };
