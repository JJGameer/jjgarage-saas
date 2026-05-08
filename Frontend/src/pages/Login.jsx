import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  // Nota: Mudei para 'Login' com letra maiúscula (boa prática no React)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");

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
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-form-section">
          <h2 className="auth-title">Bem-vindo de volta</h2>
          <p className="auth-subtitle">
            Insira as suas credenciais para aceder ao sistema.
          </p>

          {erro && <div className="alert-error">{erro}</div>}

          <form onSubmit={handleLogin}>
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

            <button type="submit" className="btn-primary">
              Entrar
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Ainda não tem conta?{" "}
              <span className="text-link" onClick={() => navigate("/register")}>
                Registe a sua oficina aqui.
              </span>
            </p>
          </div>
        </div>

        {/* Lado Direito: Imagem */}
        <div className="auth-image-section login-image"></div>
      </div>
    </div>
  );
};

export default Login;
