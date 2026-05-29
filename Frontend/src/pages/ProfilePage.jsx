import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const ProfilePage = () => {
  const { oficina, token, logout } = useContext(AuthContext);
  const { showModal } = useModal();
  const navigate = useNavigate();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const passwordsMatch =
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword;

  const passwordsMismatch =
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword !== passwordData.confirmPassword;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showModal({
        type: "error",
        title: "Erro",
        message: "As palavras-passe não coincidem.",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showModal({
        type: "error",
        title: "Erro",
        message: "A nova palavra-passe deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/update-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showModal({
          type: "success",
          title: "Sucesso",
          message: "Palavra-passe atualizada com sucesso!",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        showModal({
          type: "error",
          title: "Erro",
          message: data.error || "Erro ao atualizar palavra-passe.",
        });
      }
    } catch (err) {
      console.error("Erro:", err);
      showModal({
        type: "error",
        title: "Erro de Conexão",
        message: "Erro ao conectar com o servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Meu Perfil</h1>
        <p className="page-subtitle">Gerencie os dados da sua oficina</p>
      </div>

      <div className="profile-container">
        {/* Secção de Informações da Oficina */}
        <div className="profile-card">
          <div className="profile-header">
            <img
              src="../assets/img/User.png"
              alt="Oficina"
              className="profile-avatar"
            />
            <div className="profile-info">
              <h2>{oficina?.nome || "Oficina"}</h2>
              <p className="profile-email">
                {oficina?.email || "Email não disponível"}
              </p>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <label>Nome da Oficina</label>
              <p>{oficina?.nome || "Não informado"}</p>
            </div>
            <div className="detail-item">
              <label>Email</label>
              <p>{oficina?.email || "Não informado"}</p>
            </div>
          </div>
        </div>

        {/* Secção de Mudança de Palavra-passe */}
        <div className="password-card">
          <h3>Alterar Palavra-passe</h3>
          <p className="password-subtitle">
            Para sua segurança, altere sua palavra-passe regularmente
          </p>

          <form onSubmit={handleUpdatePassword}>
            <div className="input-group">
              <label>Palavra-passe Atual</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua palavra-passe atual"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility("current")}
                  title={showPasswords.current ? "Ocultar" : "Mostrar"}
                >
                  {showPasswords.current ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Nova Palavra-passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Digite sua nova palavra-passe"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility("new")}
                  title={showPasswords.new ? "Ocultar" : "Mostrar"}
                >
                  {showPasswords.new ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Confirmar Nova Palavra-passe</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirme sua nova palavra-passe"
                  required
                  className={
                    passwordData.confirmPassword
                      ? passwordsMatch
                        ? "password-match"
                        : "password-mismatch"
                      : ""
                  }
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility("confirm")}
                  title={showPasswords.confirm ? "Ocultar" : "Mostrar"}
                >
                  {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {passwordsMismatch && (
                <span className="password-feedback error">
                  ✕ As palavras-passe não coincidem
                </span>
              )}
              {passwordsMatch && (
                <span className="password-feedback success">
                  ✓ As palavras-passe coincidem
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={
                loading || passwordsMismatch || !passwordData.newPassword
              }
            >
              {loading ? "Atualizando..." : "Atualizar Palavra-passe"}
            </button>
          </form>
        </div>

        {/* Botão de Sair */}
        <div className="profile-actions">
          <button onClick={logout} className="btn-danger">
            Terminar Sessão
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
