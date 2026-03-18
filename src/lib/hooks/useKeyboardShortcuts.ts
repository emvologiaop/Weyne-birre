import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutOptions {
  onNewTransaction?: () => void;
  onNewTransfer?: () => void;
}

export function useKeyboardShortcuts({ onNewTransaction, onNewTransfer }: ShortcutOptions = {}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      // Navigation shortcuts (no modifier)
      if (!mod && !e.altKey) {
        switch (key) {
          case 'g': navigate('/'); break;           // G = Go to dashboard
          case 't': navigate('/transactions'); break; // T = Transactions
          case 'a': navigate('/accounts'); break;    // A = Accounts
          case 'b': navigate('/budgets'); break;     // B = Budgets
          case 's': navigate('/subscriptions'); break; // S = Subscriptions
          case 'r': navigate('/reports'); break;     // R = Reports
          case 'i': navigate('/bank-import'); break; // I = Import
          case 'w': navigate('/net-worth'); break;   // W = Worth (net worth)
          // 'n' is handled by QuickAddWidget itself
        }
      }

      // Transfer shortcut: Shift+T
      if (e.shiftKey && key === 't' && onNewTransfer) {
        e.preventDefault();
        onNewTransfer();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, onNewTransaction, onNewTransfer]);
}
