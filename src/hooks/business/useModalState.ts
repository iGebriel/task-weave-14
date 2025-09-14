import { useState, useCallback } from 'react';

/**
 * Generic modal state management hook
 * Handles opening, closing, and data passing for modal dialogs
 */
export const useModalState = <T = any>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData || null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  };
};

/**
 * Hook for managing multiple modal states
 * Useful for components that need to manage several different modals
 */
export const useModalStates = <T extends Record<string, any>>(modalNames: (keyof T)[]) => {
  type ModalStates = Record<keyof T, { 
    isOpen: boolean; 
    data: T[keyof T] | null;
    open: (data?: T[keyof T]) => void;
    close: () => void;
    toggle: () => void;
  }>;

  const [states, setStates] = useState<Record<keyof T, boolean>>(() => {
    const initialState = {} as Record<keyof T, boolean>;
    modalNames.forEach(name => {
      initialState[name] = false;
    });
    return initialState;
  });

  const [data, setData] = useState<Record<keyof T, T[keyof T] | null>>(() => {
    const initialData = {} as Record<keyof T, T[keyof T] | null>;
    modalNames.forEach(name => {
      initialData[name] = null;
    });
    return initialData;
  });

  const createModalHandlers = (modalName: keyof T) => ({
    isOpen: states[modalName],
    data: data[modalName],
    open: (modalData?: T[keyof T]) => {
      setData(prev => ({ ...prev, [modalName]: modalData || null }));
      setStates(prev => ({ ...prev, [modalName]: true }));
    },
    close: () => {
      setStates(prev => ({ ...prev, [modalName]: false }));
      setData(prev => ({ ...prev, [modalName]: null }));
    },
    toggle: () => {
      const currentState = states[modalName];
      if (currentState) {
        setStates(prev => ({ ...prev, [modalName]: false }));
        setData(prev => ({ ...prev, [modalName]: null }));
      } else {
        setStates(prev => ({ ...prev, [modalName]: true }));
      }
    },
  });

  const modalStates = modalNames.reduce((acc, modalName) => {
    acc[modalName] = createModalHandlers(modalName);
    return acc;
  }, {} as ModalStates);

  const closeAll = useCallback(() => {
    const closedStates = {} as Record<keyof T, boolean>;
    const nullData = {} as Record<keyof T, T[keyof T] | null>;
    modalNames.forEach(name => {
      closedStates[name] = false;
      nullData[name] = null;
    });
    setStates(closedStates);
    setData(nullData);
  }, [modalNames]);

  const isAnyOpen = Object.values(states).some(Boolean);

  return {
    ...modalStates,
    closeAll,
    isAnyOpen,
  };
};
