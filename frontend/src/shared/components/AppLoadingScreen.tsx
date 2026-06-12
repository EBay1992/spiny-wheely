import type { CSSProperties } from 'react';

const shellStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '2rem',
  boxSizing: 'border-box',
};

const textStyle: CSSProperties = {
  margin: 0,
  color: '#a5b4fc',
  fontSize: '0.95rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

/** Inline styles so the first paint matches the app before JS/CSS-in-JS loads. */
export function AppLoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={shellStyle} role="status" aria-live="polite">
      <p style={textStyle}>{label}</p>
    </div>
  );
}
