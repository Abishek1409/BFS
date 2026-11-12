// Error boundary around the lazy Map_Scene. On a render error or a failed chunk load
// it reports to LiveMapApp, which switches to the ListView with "Retry 3D" (Req 2.4, 16.5).
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; onError(): void; }
interface State { failed: boolean; }

export class SceneBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(err: unknown): void {
    console.error('[live-map] scene failed', err);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
