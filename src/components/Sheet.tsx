import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface SheetProps {
  labelledBy: string;
  onClose: () => void;
  class?: string;
  variant?: 'sheet' | 'welcome';
  children: ComponentChildren;
}

/**
 * Native modal <dialog>. The browser handles focus containment, Esc and the
 * back gesture; we only open it and report close events.
 */
export function Sheet({
  labelledBy,
  onClose,
  class: className,
  variant = 'sheet',
  children,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
    }
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      class={variant === 'welcome' ? 'welcome' : className ? `sheet ${className}` : 'sheet'}
      aria-labelledby={labelledBy}
      onClose={onClose}
    >
      {children}
    </dialog>
  );
}
