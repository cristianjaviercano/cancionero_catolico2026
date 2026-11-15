import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { answerConfirm, dismissNotice, getFeedbackState, subscribeFeedback } from '../utils/feedback';

/** Dibuja los avisos breves y la ventana de confirmación de toda la app. Se monta una sola vez. */
export function FeedbackHost() {
  const { notices, confirm } = useSyncExternalStore(subscribeFeedback, getFeedbackState);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Con la pregunta abierta: foco en el botón principal, Escape cancela
  useEffect(() => {
    if (!confirm) return;
    confirmButtonRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') answerConfirm(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirm]);

  return (
    <>
      <div className="feedback-stack print:hidden" aria-live="polite">
        {notices.map(notice => (
          <div key={notice.id} className={`feedback-notice feedback-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
            {notice.kind === 'ok' && <CheckCircle2 size={18} className="feedback-icon" />}
            {notice.kind === 'error' && <AlertCircle size={18} className="feedback-icon" />}
            {notice.kind === 'info' && <Info size={18} className="feedback-icon" />}
            <span className="feedback-message">{notice.message}</span>
            {notice.actionLabel && (
              <button
                type="button"
                className="feedback-action"
                onClick={() => {
                  notice.onAction?.();
                  dismissNotice(notice.id);
                }}
              >
                {notice.actionLabel}
              </button>
            )}
            <button type="button" className="feedback-close" onClick={() => dismissNotice(notice.id)} aria-label="Cerrar aviso">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>

      {confirm && (
        <div className="feedback-overlay print:hidden" onClick={() => answerConfirm(false)}>
          <div
            className="feedback-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-label={confirm.title ?? confirm.message}
            onClick={e => e.stopPropagation()}
          >
            {confirm.title && <h3 className="feedback-dialog-title">{confirm.title}</h3>}
            <p className="feedback-dialog-message">{confirm.message}</p>
            <div className="feedback-dialog-actions">
              <button type="button" className="btn" onClick={() => answerConfirm(false)}>
                {confirm.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                type="button"
                ref={confirmButtonRef}
                className={`btn btn-primary ${confirm.danger ? 'feedback-danger' : ''}`}
                onClick={() => answerConfirm(true)}
              >
                {confirm.confirmLabel ?? 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
