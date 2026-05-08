import React, { createContext, useState, useContext } from "react";

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info", // Pode ser: 'info', 'confirm', 'loading', 'success', 'error'
    title: "",
    message: "",
    onConfirm: null, // Função a executar se clicar em "Sim"
    confirmText: "Confirmar",
    cancelText: "Cancelar",
  });

  const showModal = (options) => {
    setModal({ ...modal, isOpen: true, ...options });
  };

  const hideModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  return (
    <ModalContext.Provider value={{ modal, showModal, hideModal }}>
      {children}
    </ModalContext.Provider>
  );
};

// Hook personalizado para ser super fácil de usar noutros ficheiros!
export const useModal = () => useContext(ModalContext);
