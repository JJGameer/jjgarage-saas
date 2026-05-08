import React, { createContext, useState, useEffect, Children } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  //verificar se já existe um token no navegador
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [oficina, setOficina] = useState(
    JSON.parse(localStorage.getItem("oficina")) || null,
  );

  //password certa
  const login = (newToken, dadosOficina) => {
    setToken(newToken);
    setOficina(dadosOficina);
    //guarda na memoria do navegador para nao perder login no F5
    localStorage.setItem("token", newToken);
    localStorage.setItem("oficina", JSON.stringify(dadosOficina));
  };

  const logout = () => {
    setToken(null);
    setOficina(null);
    localStorage.removeItem("token");
    localStorage.removeItem("oficina");
  };

  return (
    <AuthContext.Provider
      value={{ token, oficina, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};
