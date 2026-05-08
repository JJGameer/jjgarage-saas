import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const [formData, setFormData] = useState({
    NomeOficina: "",
    Email: "",
    Password: "",
    CodigoAcesso: "",
  });

  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro("");
    setMensagemSucesso("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMensagemSucesso("Registo efetuado com sucesso! A redirecionar...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
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

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Lado Esquerdo: Imagem (Invertido para dar dinâmica face ao login) */}
        <div className="auth-image-section register-image"></div>

        {/* Lado Direito: Formulário */}
        <div className="auth-form-section">
          <h2 className="auth-title">Registar Oficina</h2>
          <p className="auth-subtitle">
            Crie a sua conta para começar a gerir os seus serviços.
          </p>

          {erro && <div className="alert-error">{erro}</div>}
          {mensagemSucesso && (
            <div className="alert-success">{mensagemSucesso}</div>
          )}

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label>Nome da Oficina</label>
              <input
                type="text"
                name="NomeOficina"
                value={formData.NomeOficina}
                onChange={handleChange}
                placeholder="Ex: Auto Repair Lda"
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="oficina@exemplo.com"
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                name="Password"
                value={formData.Password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="input-group">
              <label>Código de Convite</label>
              <input
                type="text"
                name="CodigoAcesso"
                value={formData.CodigoAcesso}
                onChange={handleChange}
                placeholder="Ex: OFICINA-XPT0-2024"
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "A registar..." : "Criar Conta"}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Já tem conta?{" "}
              <span className="text-link" onClick={() => navigate("/login")}>
                Faça login aqui.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
