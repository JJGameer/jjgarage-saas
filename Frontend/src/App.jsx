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
import WhatsAppButton from "./components/layout/WhatsAppButton.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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
function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <GlobalModal />
        <WhatsAppButton />
        <Routes>
          {/*Rotas Públicas sem Segurança */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/*Rotas privadas com Segurança */}
          <Route
            path="/"
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
