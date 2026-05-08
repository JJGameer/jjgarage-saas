import React from "react";
import { useModal } from "../../context/ModalContext"; // Ajusta o caminho

const GlobalModal = () => {
  const { modal, hideModal } = useModal();

  if (!modal.isOpen) return null;

  // Se o tipo não for "loading", ao clicar no fundo escuro ele fecha.
  // Se for "loading", bloqueia tudo e não faz nada!
  const handleOverlayClick = () => {
    if (modal.type !== "loading") hideModal();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      {/* O e.stopPropagation() impede que clicar dentro da caixa feche o modal */}
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* === ESTADO DE LOADING === */}
        {modal.type === "loading" && (
          <div className="modal-content loading-content">
            <div className="spinner"></div>
            <h3 className="modal-title">{modal.title || "A processar..."}</h3>
            <p className="modal-message">{modal.message}</p>
          </div>
        )}

        {/* === ESTADO DE INFORMAÇÃO / SUCESSO / ERRO === */}
        {(modal.type === "info" ||
          modal.type === "success" ||
          modal.type === "error") && (
          <div className="modal-content">
            <div className={`modal-icon ${modal.type}`}>
              {modal.type === "success"
                ? "✓"
                : modal.type === "error"
                  ? "✕"
                  : "i"}
            </div>
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-message">{modal.message}</p>
            <div className="modal-actions-center">
              <button className="btn-primary" onClick={hideModal}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* === ESTADO DE CONFIRMAÇÃO === */}
        {modal.type === "confirm" && (
          <div className="modal-content">
            <h3 className="modal-title">{modal.title}</h3>
            <p className="modal-message">{modal.message}</p>
            <div className="modal-actions-right">
              <button className="btn-cancel" onClick={hideModal}>
                {modal.cancelText || "Cancelar"}
              </button>
              <button
                className="btn-submit" // Reaproveita as tuas cores
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  hideModal(); // Fecha depois de confirmar
                }}
              >
                {modal.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalModal;
