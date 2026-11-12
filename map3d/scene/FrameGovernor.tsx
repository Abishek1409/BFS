// Frame loop control: no frames while the tab is hidden (Req 17.3),
// 10 fps on demand in Billing_Focus (Req 17.4), continuous otherwise.
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import type { ViewMode } from '../lib/types.ts';

const BILLING_FRAME_MS = 100;

export function FrameGovernor({ view, visible }: { view: ViewMode; visible: boolean }) {
  const setFrameloop = useThree(s => s.setFrameloop);
  const invalidate = useThree(s => s.invalidate);

  useEffect(() => {
    if (!visible) {
      setFrameloop('never');
      return;
    }
    if (view === 'billing_focus') {
      setFrameloop('demand');
      invalidate();
      const id = setInterval(() => invalidate(), BILLING_FRAME_MS);
      return () => clearInterval(id);
    }
    setFrameloop('always');
  }, [visible, view, setFrameloop, invalidate]);

  return null;
}
