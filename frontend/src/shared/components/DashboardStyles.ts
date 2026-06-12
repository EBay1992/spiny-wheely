import styled from 'styled-components';

/** Minimum gutter from viewport edge on narrow screens. */
export const dashboardSideInset = 'clamp(1rem, 4vw, 2rem)';

/** Single centered column — equal auto margins left and right. */
export const DashboardShell = styled.div`
  box-sizing: border-box;
  width: min(1100px, calc(100% - 2 * ${dashboardSideInset}));
  margin-inline: auto;
  padding-bottom: clamp(1rem, 3vw, 2rem);
`;

export const DashboardMain = styled.main`
  width: 100%;
`;

export const Page = styled.div`
  min-height: 100dvh;
  padding: clamp(1rem, 3vw, 2rem);
  max-width: 1100px;
  margin: 0 auto;
`;

export const PageTitle = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const Grid = styled.div`
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

export const Card = styled.section`
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 1.25rem;
  backdrop-filter: blur(8px);
`;

export const CardTitle = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: #94a3b8;
  }

  span:last-child {
    color: #f8fafc;
    font-weight: 600;
    text-align: right;
  }
`;

export const Label = styled.label`
  display: block;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.35rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(2, 6, 23, 0.6);
  color: #f8fafc;
  font-size: 0.95rem;

  &:focus {
    outline: 2px solid rgba(129, 140, 248, 0.5);
    border-color: #818cf8;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(2, 6, 23, 0.6);
  color: #f8fafc;
  font-size: 0.95rem;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger' }>`
  padding: 0.55rem 1rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ $variant = 'primary' }) =>
    $variant === 'primary'
      ? `background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;`
      : $variant === 'danger'
        ? `background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4);`
        : `background: transparent; color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3);`}
`;

export const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
`;

export const NavBar = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  margin: clamp(1rem, 3vw, 1.5rem) 0 1.25rem;
  padding: 0.85rem 1.25rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
`;

export const NavLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const NavLink = styled.a<{ $active?: boolean }>`
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#fff' : '#94a3b8')};
  background: ${({ $active }) =>
    $active ? 'rgba(99, 102, 241, 0.35)' : 'transparent'};
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(129, 140, 248, 0.5)' : 'transparent')};

  &:hover {
    color: #fff;
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th,
  td {
    padding: 0.6rem 0.5rem;
    text-align: left;
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  th {
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  td {
    color: #e2e8f0;
  }
`;

export const ErrorText = styled.p`
  color: #fca5a5;
  font-size: 0.9rem;
  margin-top: 0.75rem;
`;

export const SuccessText = styled.p`
  color: #86efac;
  font-size: 0.9rem;
  margin-top: 0.75rem;
`;

export const FieldGroup = styled.div`
  margin-bottom: 1rem;
`;

export const Badge = styled.span<{ $live?: boolean }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${({ $live }) =>
    $live ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)'};
  color: ${({ $live }) => ($live ? '#86efac' : '#94a3b8')};
`;
