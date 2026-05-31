import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setTokenValido(true);
    } else {
      setErro("Token não encontrado. Link inválido ou expirado.");
      setTokenValido(false);
    }
  }, [searchParams]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    // Validações
    if (newPassword.length < 8) {
      setErro("A palavra-passe deve ter no mínimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErro("As passwords não coincidem.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso("Palavra-passe alterada com sucesso!");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErro(data.error || "Erro ao redefinir a palavra-passe.");
      }
    } catch (err) {
      console.error("Erro de conexão", err);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValido) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <div className="auth-form-section">
            <h2 className="auth-title">Link Inválido</h2>
            <div className="alert-error">{erro}</div>
            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
              style={{ width: "100%", marginTop: "20px" }}
            >
              Voltar ao Login
            </button>
          </div>
          <div className="auth-image-section login-image"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-form-section">
          <h2 className="auth-title">🔐 Redefinir Palavra-passe</h2>
          <p className="auth-subtitle">
            Crie uma nova palavra-passe segura para a sua conta.
          </p>

          {erro && <div className="alert-error">{erro}</div>}
          {sucesso && <div className="alert-success">{sucesso}</div>}

          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <label>Nova Palavra-passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength="8"
              />
              <small style={{ color: "#666", marginTop: "5px" }}>
                Mínimo 8 caracteres
              </small>
            </div>

            <div className="input-group">
              <label>Confirmar Palavra-passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength="8"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ width: "100%" }}
            >
              {isLoading ? "A processar..." : "Redefinir Palavra-passe"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <span
                className="text-link"
                onClick={() => navigate("/login")}
                style={{ cursor: "pointer" }}
              >
                Voltar ao Login
              </span>
            </p>
          </div>
        </div>

        <div className="auth-image-section login-image"></div>
      </div>
    </div>
  );
};

export default ResetPassword;
