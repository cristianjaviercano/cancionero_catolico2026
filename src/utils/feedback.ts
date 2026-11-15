// Avisos y confirmaciones dentro de la app (reemplazan a alert() y confirm() del navegador).
// Se usan desde cualquier parte: notify('Guardado'), await askConfirm({ message: '¿Borrar?' }).
// Los dibuja <FeedbackHost />, montado una sola vez en App.

export type NoticeKind = 'ok' | 'error' | 'info';

export interface Notice {
  id: number;
  message: string;
  kind: NoticeKind;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmRequest {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Acción que borra o reemplaza algo: el botón de confirmar va en rojo */
  danger?: boolean;
}

interface FeedbackState {
  notices: Notice[];
  confirm: (ConfirmRequest & { resolve: (accepted: boolean) => void }) | null;
}

let state: FeedbackState = { notices: [], confirm: null };
const listeners = new Set<() => void>();
let nextId = 1;

function setState(next: FeedbackState) {
  state = next;
  listeners.forEach(listener => listener());
}

export function subscribeFeedback(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFeedbackState(): FeedbackState {
  return state;
}

export function dismissNotice(id: number) {
  setState({ ...state, notices: state.notices.filter(n => n.id !== id) });
}

interface NotifyOptions {
  kind?: NoticeKind;
  actionLabel?: string;
  onAction?: () => void;
  /** Milisegundos en pantalla. Por defecto 4 s (7 s si trae un botón de acción) */
  duration?: number;
}

export function notify(message: string, options: NotifyOptions = {}) {
  const id = nextId++;
  const notice: Notice = {
    id,
    message,
    kind: options.kind ?? 'ok',
    actionLabel: options.actionLabel,
    onAction: options.onAction,
  };
  // Máximo tres a la vez: el más antiguo sale
  setState({ ...state, notices: [...state.notices, notice].slice(-3) });
  window.setTimeout(() => dismissNotice(id), options.duration ?? (options.actionLabel ? 7000 : 4000));
}

export function notifyError(message: string) {
  notify(message, { kind: 'error', duration: 6000 });
}

export function askConfirm(request: ConfirmRequest): Promise<boolean> {
  return new Promise(resolve => {
    // Si ya había una pregunta abierta, se da por cancelada
    state.confirm?.resolve(false);
    setState({ ...state, confirm: { ...request, resolve } });
  });
}

export function answerConfirm(accepted: boolean) {
  const pending = state.confirm;
  if (!pending) return;
  setState({ ...state, confirm: null });
  pending.resolve(accepted);
}
