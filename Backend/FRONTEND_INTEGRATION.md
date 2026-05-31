// Exemplo de integração com o Frontend (React/Vue/Angular)
// Este arquivo demonstra como chamar os endpoints do backend

// ========== SERVIÇO DE AUTENTICAÇÃO ==========

const API_URL = process.env.REACT_APP_API_URL || "https://jjgarage.pt";

// 1. Solicitar link de recuperação de password
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Erro ao solicitar recuperação de password");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

// 2. Redefinir password com token
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao redefinir password");
    }

    return await response.json();
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};

// ========== COMPONENTE REACT EXEMPLO ==========

/*
import React, { useState } from "react";
import { requestPasswordReset, resetPassword } from "./api";

export function PasswordRecoveryFlow() {
  const [step, setStep] = useState("request"); // "request" | "reset" | "success" | "error"
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Passo 1: Solicitar link de recuperação
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestPasswordReset(email);
      setStep("request-sent");
    } catch (err) {
      setError(err.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Redefinir password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As passwords não coincidem");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("A password deve ter no mínimo 8 caracteres");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setStep("success");
    } catch (err) {
      setError(err.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  // Extrair token da URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setStep("reset");
    }
  }, []);

  return (
    <div className="password-recovery">
      {step === "request" && (
        <form onSubmit={handleForgotPassword}>
          <h2>Esqueci-me da Password</h2>
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "A enviar..." : "Enviar Link de Recuperação"}
          </button>
        </form>
      )}

      {step === "request-sent" && (
        <div className="success-message">
          <p>✅ Link de recuperação enviado!</p>
          <p>Verifique seu email para continuar.</p>
        </div>
      )}

      {step === "reset" && (
        <form onSubmit={handleResetPassword}>
          <h2>Redefinir Password</h2>
          <input
            type="password"
            placeholder="Nova password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmar password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "A atualizar..." : "Atualizar Password"}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="success-message">
          <p>✅ Password atualizada com sucesso!</p>
          <p>Pode agora fazer login com a sua nova password.</p>
          <a href="/login">Ir para Login</a>
        </div>
      )}

      {step === "error" && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setStep("request")}>Tentar Novamente</button>
        </div>
      )}
    </div>
  );
}
*/

// ========== SUGESTÕES DE CSS ==========

/*
.password-recovery {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  font-family: Arial, sans-serif;
}

.password-recovery h2 {
  color: #1a1a1a;
  margin-bottom: 20px;
  text-align: center;
}

.password-recovery input {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.password-recovery button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #1a1a1a 0%, #4a90e2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
}

.password-recovery button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-message,
.error-message {
  padding: 15px;
  border-radius: 5px;
  text-align: center;
  margin: 20px 0;
}

.success-message {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
*/
