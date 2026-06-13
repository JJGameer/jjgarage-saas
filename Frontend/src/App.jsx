import Header from "./components/layout/Header.jsx";
import VehiclePage from "./pages/VehiclePage.jsx";
import AddVehiclePage from "./pages/AddVehiclePage.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import AddServicePage from "./pages/AddServicePage.jsx";
import ServicePage from "./pages/ServicePage.jsx";
import EditServicePage from "./pages/EditServicePage.jsx";
import ClientPage from "./pages/ClientPage.jsx";
import GlobalModal from "./components/layout/GlobalModal.jsx";
import EditVehiclePage from "./pages/EditVehiclePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import WhatsAppButton from "./components/layout/WhatsAppButton.jsx";
import ForumSugestoesWidget from "./components/layout/ForumSugestoesWidget.jsx";
import LandingPage from "./pages/LandingPage.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import React, { useContext } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";
import { SpeedInsights } from "@vercel/speed-insights/react";

const RotaProtegida = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
};

const RootRouteHandler = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Se o utilizador já estiver autenticado, vai direto para a Dashboard interna
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se for um visitante público, mostra a Landing Page de vendas
  return <LandingPage onNavigateToLogin={() => navigate("/login")} />;
};

const FloatingSupport = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? <ForumSugestoesWidget /> : <WhatsAppButton />;
};

function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <GlobalModal />
        <FloatingSupport />
        <Routes>
          {/* Rota Raiz Inteligente (Pública ou Redirecionamento) */}
          <Route path="/" element={<RootRouteHandler />} />

          {/*Rotas Públicas de Autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/*Rotas privadas com Segurança */}
          <Route
            path="/dashboard"
            element={
              <RotaProtegida>
                <DashboardPage />
              </RotaProtegida>
            }
          />
          <Route
            path="/carros"
            element={
              <RotaProtegida>
                <VehiclePage />
              </RotaProtegida>
            }
          />
          <Route
            path="/clientes"
            element={
              <RotaProtegida>
                <ClientPage />
              </RotaProtegida>
            }
          />
          <Route
            path="/carros/adicionar"
            element={
              <RotaProtegida>
                <AddVehiclePage />
              </RotaProtegida>
            }
          />
          <Route
            path="/carros/:id"
            element={
              <RotaProtegida>
                <VehicleDetails />
              </RotaProtegida>
            }
          />
          <Route
            path="/carros/status"
            element={
              <RotaProtegida>
                <ServicePage />
              </RotaProtegida>
            }
          />
          <Route
            path="/servicos/adicionar"
            element={
              <RotaProtegida>
                <AddServicePage />
              </RotaProtegida>
            }
          />
          <Route
            path="/servicos/editar/:id"
            element={
              <RotaProtegida>
                <EditServicePage />
              </RotaProtegida>
            }
          />
          <Route
            path="/carros/editar/:id"
            element={
              <RotaProtegida>
                <EditVehiclePage />
              </RotaProtegida>
            }
          />
          <Route
            path="/profile"
            element={
              <RotaProtegida>
                <ProfilePage />
              </RotaProtegida>
            }
          />
        </Routes>
        <SpeedInsights />
      </ModalProvider>
    </AuthProvider>
  );
}

export default App;
