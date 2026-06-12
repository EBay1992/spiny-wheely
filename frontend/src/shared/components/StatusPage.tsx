import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Page } from './DashboardStyles';

export const StatusShell = styled(Page)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  box-sizing: border-box;
`;

export const StatusCard = styled.section`
  width: min(480px, 100%);
  padding: clamp(1.5rem, 4vw, 2rem);
  border-radius: 16px;
  text-align: center;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.22);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
`;

export const StatusCode = styled.p`
  margin: 0 0 0.5rem;
  font-size: clamp(2.5rem, 8vw, 3.5rem);
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const StatusTitle = styled.h1`
  margin: 0 0 0.75rem;
  font-size: clamp(1.25rem, 4vw, 1.6rem);
  font-weight: 700;
  color: #f8fafc;
`;

export const StatusMessage = styled.p`
  margin: 0 0 1.5rem;
  color: #94a3b8;
  line-height: 1.55;
  font-size: 0.95rem;
`;

export const StatusActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
`;

interface StatusLinkButtonProps {
  to: string;
  children: ReactNode;
  $variant?: 'primary' | 'ghost';
}

export function StatusLinkButton({
  to,
  children,
  $variant = 'primary',
}: StatusLinkButtonProps) {
  return (
    <Button as={Link} to={to} $variant={$variant}>
      {children}
    </Button>
  );
}

interface StatusPageProps {
  code: string;
  title: string;
  message: string;
  children?: ReactNode;
}

export function StatusPage({ code, title, message, children }: StatusPageProps) {
  return (
    <StatusShell>
      <StatusCard role="alert">
        <StatusCode>{code}</StatusCode>
        <StatusTitle>{title}</StatusTitle>
        <StatusMessage>{message}</StatusMessage>
        {children ? <StatusActions>{children}</StatusActions> : null}
      </StatusCard>
    </StatusShell>
  );
}
