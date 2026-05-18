import { forwardRef } from 'react';

export interface SongAnalysisData {
  songTitle: string;
  artist: string;
  key: string;
  tempo: string;
  timeSignature: string;
  chords: string[];
  structure: {
    section: string;
    chords: string[];
    bars: number;
  }[];
  progression: {
    name: string;
    numerals: string;
    description: string;
  };
  difficulty: string;
  tips: string[];
  similarSongs: string[];
}

interface ChordSheetProps {
  analysis: SongAnalysisData;
}

/**
 * Hoja de acordes imprimible. Diseñada para capturarse con html2canvas
 * y exportarse a PDF o PNG. Usa colores fijos (no tokens HSL) y fuentes
 * de sistema para garantizar que html2canvas la renderice de forma fiable.
 */
export const ChordSheet = forwardRef<HTMLDivElement, ChordSheetProps>(
  ({ analysis }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '794px', // A4 a 96 DPI
          padding: '40px',
          background: '#ffffff',
          color: '#0f172a',
          fontFamily:
            "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '14px',
          lineHeight: 1.5,
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: '3px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              color: '#64748b',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Acorde Live · Hoja de acordes
          </div>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              margin: 0,
              color: '#0f172a',
            }}
          >
            {analysis.songTitle}
          </h1>
          <div
            style={{
              fontSize: '18px',
              color: '#475569',
              marginTop: '4px',
            }}
          >
            {analysis.artist}
          </div>
        </div>

        {/* Metadata */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {[
            { label: 'Tonalidad', value: analysis.key },
            { label: 'Tempo', value: analysis.tempo },
            { label: 'Compás', value: analysis.timeSignature },
            { label: 'Dificultad', value: analysis.difficulty },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '2px',
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Acordes utilizados */}
        <Section title="Acordes utilizados">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {analysis.chords.map((chord, i) => (
              <span
                key={i}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  fontFamily: "'Courier New', monospace",
                  fontWeight: 700,
                  fontSize: '16px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                }}
              >
                {chord}
              </span>
            ))}
          </div>
        </Section>

        {/* Progresión */}
        <Section title="Progresión armónica">
          <div style={{ marginBottom: '6px' }}>
            <span
              style={{
                background: '#10b981',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '13px',
                marginRight: '10px',
              }}
            >
              {analysis.progression.name}
            </span>
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: '18px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              {analysis.progression.numerals}
            </span>
          </div>
          <p style={{ color: '#475569', margin: '6px 0 0' }}>
            {analysis.progression.description}
          </p>
        </Section>

        {/* Estructura */}
        <Section title="Estructura de la canción">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analysis.structure.map((section, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr 90px',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: i % 2 === 0 ? '#f8fafc' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: '#0f172a',
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {section.section}
                </div>
                <div
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  {section.chords.map((c, j) => (
                    <span key={j}>
                      {c}
                      {j < section.chords.length - 1 && (
                        <span style={{ color: '#94a3b8' }}>  →  </span>
                      )}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  {section.bars} comp.
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Tips */}
        {analysis.tips?.length > 0 && (
          <Section title="Consejos para tocarla">
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#334155' }}>
              {analysis.tips.map((tip, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  {tip}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Canciones similares */}
        {analysis.similarSongs?.length > 0 && (
          <Section title="Canciones con progresión similar">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {analysis.similarSongs.map((song, i) => (
                <span
                  key={i}
                  style={{
                    background: '#e2e8f0',
                    color: '#0f172a',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                >
                  {song}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '12px',
            borderTop: '1px solid #e2e8f0',
            fontSize: '11px',
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          Generado con Acorde Live · Analizador de canciones IA
        </div>
      </div>
    );
  },
);

ChordSheet.displayName = 'ChordSheet';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: '22px' }}>
    <h2
      style={{
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: '#64748b',
        margin: '0 0 10px',
        fontWeight: 700,
      }}
    >
      {title}
    </h2>
    {children}
  </div>
);
