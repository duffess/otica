import { useSyncExternalStore } from 'react';
import type { FrameId, LensId } from './options';

/** Estado mínimo compartilhado entre a interface (DOM) e a cena 3D. */
export interface State {
  frame: FrameId;
  lens: LensId;
  ready: boolean;
  /** 0 a 1: bytes do modelo já baixados. */
  progress: number;
}

let state: State = { frame: 'champanhe', lens: 'transparente', ready: false, progress: 0 };
const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => pick(state));
}
