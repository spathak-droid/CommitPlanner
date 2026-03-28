import React from 'react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<Props> = ({
  open,
  title,
  message,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  icon = 'help_outline',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const confirmColors = variant === 'danger'
    ? 'bg-error text-on-error hover:bg-error/90'
    : 'bg-tertiary text-on-tertiary hover:bg-tertiary/90';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-[1.5rem] bg-surface-lowest p-6 shadow-[0px_24px_48px_rgba(27,27,30,0.2)] ring-1 ring-outline-variant/10 animate-in">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-error-container' : 'bg-tertiary-container'}`}>
            <span className={`material-symbols-outlined text-xl ${variant === 'danger' ? 'text-error' : 'text-tertiary'}`}>{icon}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-on-surface">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full border border-outline-variant/20 bg-white text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 ${confirmColors}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
