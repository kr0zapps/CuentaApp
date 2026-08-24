import { create } from 'zustand';

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  onConfirm: () => void;
  showConfirm: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
  hideConfirm: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  isDestructive: false,
  onConfirm: () => {},
  
  showConfirm: (options) => {
    set({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      isDestructive: options.isDestructive || false,
      onConfirm: options.onConfirm,
    });
  },
  
  hideConfirm: () => set({ visible: false }),
}));
