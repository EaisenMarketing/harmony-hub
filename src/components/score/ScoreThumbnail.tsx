import { useEffect, useRef, useState } from 'react';
import { ScoreCanvas } from '@/components/score/ScoreCanvas';
import type { ScoreDoc } from '@/lib/score/model';

/**
 * Vista previa tipo "hoja de papel" (proporción 500x660, como una página real).
 * Renderiza la notación con VexFlow sobre fondo blanco y la escala para encajar.
 */
export const ScoreThumbnail = ({ doc }: { doc: ScoreDoc }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const fit = () => {
      const box = boxRef.current;
      const svg = innerRef.current?.querySelector('svg');
      if (!box || !svg) return;
      const w = svg.getBoundingClientRect().width / (scale || 1);
      if (w > 0) setScale(Math.min(1, (box.clientWidth - 24) / w));
    };
    const id = window.setTimeout(fit, 60);
    window.addEventListener('resize', fit);
    return () => { window.clearTimeout(id); window.removeEventListener('resize', fit); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden bg-white"
      style={{ aspectRatio: '500 / 660', ['--score-ink' as string]: '#1a1a1a' }}
    >
      <div className="absolute inset-0 px-3 pt-4">
        <p className="text-[9px] font-semibold tracking-[0.18em] uppercase text-neutral-500 text-center truncate">
          {doc.title}
        </p>
        <div
          ref={innerRef}
          className="origin-top mt-2 mx-auto w-fit"
          style={{ transform: `scale(${scale})` }}
        >
          <ScoreCanvas doc={doc} measuresPerRow={2} />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

export default ScoreThumbnail;
