import { useEffect, useState } from 'react';
import { RecoveryNotification, subscribeRecovery } from '../error/errorRecovery';

export function RecoveryBanner(): JSX.Element | null {
  const [n, setN] = useState<RecoveryNotification | null>(null);

  useEffect(() => subscribeRecovery(setN), []);

  if (!n) return null;

  return (
    <div
      className="top-banner"
      role="status"
      aria-live="assertive"
    >
      {n.kind === 'restart_required' ? 'Action needed: ' : ''}
      {n.message}
    </div>
  );
}
