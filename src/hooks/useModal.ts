import { useState, useCallback } from 'react';
import { ModalType } from '../components/common/Modal';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = useCallback((
    title: string,
    message: string,
    type: ModalType = 'info',
    options?: {
      confirmText?: string;
      cancelText?: string;
      showCancel?: boolean;
      onConfirm?: () => void;
    }
  ) => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      showCancel: options?.showCancel,
      onConfirm: options?.onConfirm
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showModal(title, message, 'success');
  }, [showModal]);

  const showError = useCallback((title: string, message: string) => {
    showModal(title, message, 'error');
  }, [showModal]);

  const showWarning = useCallback((title: string, message: string) => {
    showModal(title, message, 'warning');
  }, [showModal]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    showModal(title, message, 'confirm', {
      showCancel: true,
      onConfirm,
      confirmText: options?.confirmText || 'Yes',
      cancelText: options?.cancelText || 'No'
    });
  }, [showModal]);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showInfo = useCallback((title: string, message: string) => {
    showModal(title, message, 'info');
  }, [showModal]);

  return {
    modalState,
    showModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    closeModal
  };
};
