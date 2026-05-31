import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email, Password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.oficina);
        navigate("/");
      } else {
        setErro(data.error);
      }
    } catch (err) {
      console.error("Erro de conexão", err);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSucesso("Email de recuperação enviado! Verifique a sua caixa de entrada.");
        setEmail("");
        setTimeout(() => {
          setIsForgotPassword(false);
          setSucesso("");
        }, 3000);
      } else {
        setErro(data.error || "Erro ao enviar email.");
      }
    } catch (err) {
      console.error("Erro de conexão", err);
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-form-section">
          <h2 className="auth-title">
            {isForgotPassword ? "Recuperar Palavra-passe" : "Bem-vindo de volta"}
          </h2>
          <p className="auth-subtitle">
            {isForgotPassword
              ? "Insira o seu email para receber um link de recuperação."
              : "Insira as suas credenciais para aceder ao sistema."}
          </p>

          {erro && <div className="alert-error">{erro}</div>}
          {sucesso && <div className="alert-success">{sucesso}</div>}

          <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="oficina@exemplo.com"
                required
              />
            </div>

            {!isForgotPassword && (
              <div className="input-group">
                <label>Palavra-passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading
                ? "Aguarde..."
                : isForgotPassword
                  ? "Enviar Email"
                  : "Entrar"}
            </button>
          </form>

          <div className="auth-footer">
            {!isForgotPassword ? (
              <>
                <p>
                  <span
                    className="text-link"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErro("");
                      setPassword("");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    Esqueci-me da palavra-passe
                  </span>
                </p>
                <p>
                  Ainda não tem conta?{" "}
                  <span
                    className="text-link"
                    onClick={() => navigate("/register")}
                    style={{ cursor: "pointer" }}
                  >
                    Registe a sua oficina aqui.
                  </span>
                </p>
              </>
            ) : (
              <p>
                <span
                  className="text-link"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErro("");
                    setEmail("");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Voltar ao Login
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="auth-image-section login-image"></div>
      </div>
    </div>
  );
};

export default Login;
