// ============================================================
// TextilSelector – Horizontale Karussell-Auswahl der Textilart
// Design: Clean Sports Studio – sportliche Karten mit Hover-Effekt
// ============================================================

import { textilTemplates } from '../data/templates';
import { TextilType } from '../types';

interface Props {
  selected: TextilType;
  onSelect: (type: TextilType) => void;
}

export default function TextilSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
      {textilTemplates.map((t) => {
        const isActive = t.id === selected;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`
              flex-shrink-0 flex flex-col items-center gap-2 px-5 py-3 rounded-xl
              border-2 transition-all duration-200 cursor-pointer select-none
              ${isActive
                ? 'border-[#0f2b5b] bg-[#0f2b5b] text-white shadow-lg shadow-[#0f2b5b]/20'
                : 'border-[#e2e5ea] bg-white text-[#3a3f4b] hover:border-[#0f2b5b]/40 hover:shadow-md'
              }
            `}
          >
            <span className="text-2xl">{t.icon}</span>
            <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}
