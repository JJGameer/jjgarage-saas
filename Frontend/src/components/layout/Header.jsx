import React, { useContext, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // O segredo para não recarregar a página!
import { AuthContext } from "../../context/AuthContext.jsx";

function Header() {
  const { oficina, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (oficina?.nome) {
      // Se a oficina tiver nome, fica: "Nome da Oficina | AutoGest"
      {
        /*document.title = `${oficina.nome} | JJGarage`;*/
      }
      document.title = `JJGarage | Software de Gestão`;
    } else {
      // Caso contrário, fica só JJGarage
      document.title = "JJGarage | Software de Gestão";
    }
  }, [oficina]);

  return (
    <header className="primaryHeader">
      <div className="columnLeft">
        <img
          onClick={() => navigate("/")}
          src="../assets/img/logo3.png"
          alt="Logo JJAUTOGARAGE"
        />
        {/*
        <h2>
          JJ<span className="logoTitle">GARAGE</span>
        </h2>
        */}
      </div>

      <div className="columnCenter">
        <nav>
          <ul>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Veículos
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/carros/status"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Serviços
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/clientes"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Clientes
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>

      <div className="columnRight">
        <div className="userInfo">
          <img
            src="../assets/img/User.png"
            alt="User"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
          />
          {/* Se quiseres mostrar o nome da oficina ativado:
          {oficina?.nome && <span className="oficinaNome">{oficina.nome}</span>}
          */}
        </div>

        {/* Botão de sair com um ícone SVG bonito em vez de texto solto */}
        <button onClick={logout} className="btnLogout" title="Terminar Sessão">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;
