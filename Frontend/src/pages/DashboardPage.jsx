import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const DashboardPage = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_URL}/servicos/stats/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Erro ao buscar estatísticas");
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month) => {
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div
          className="container"
          style={{ textAlign: "center", padding: "40px" }}
        >
          <p>A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Resumo das atividades e desempenho da sua oficina
        </p>
      </div>

      <div className="dashboard-container">
        {/* Row 1: Estatísticas Principais */}
        <div className="stats-grid">
          <div className="stat-card completed">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 1 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <div className="stat-content">
              <h2 className="stat-number">{stats?.completed || 0}</h2>
              <p className="stat-label">Serviços realizados</p>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <h2 className="stat-number">{stats?.pending || 0}</h2>
              <p className="stat-label">Pendentes</p>
            </div>
          </div>

          <div className="stat-card revenue">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div className="stat-content">
              <h2 className="stat-number">
                €{(stats?.totalCost || 0).toFixed(2)}
              </h2>
              <p className="stat-label">Receita total</p>
            </div>
          </div>
        </div>

        {/* Row 2: Estatísticas do Ano */}
        <div className="year-stats-container">
          <div className="year-stat-card">
            <h3>Este Ano</h3>
            <div className="year-stat-content">
              <div className="year-stat-item">
                <span className="year-stat-label">Serviços Concluídos</span>
                <span className="year-stat-value">
                  {stats?.servicesThisYear || 0}
                </span>
              </div>
              <div className="year-stat-divider"></div>
              <div className="year-stat-item">
                <span className="year-stat-label">Receita Gerada</span>
                <span className="year-stat-value">
                  €{(stats?.costThisYear || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Média */}
          <div className="year-stat-card">
            <h3>Estatísticas</h3>
            <div className="year-stat-content">
              <div className="year-stat-item">
                <span className="year-stat-label">Média por Serviço</span>
                <span className="year-stat-value">
                  €
                  {stats?.servicesThisYear > 0
                    ? (stats.costThisYear / stats.servicesThisYear).toFixed(2)
                    : "0.00"}
                </span>
              </div>
              <div className="year-stat-divider"></div>
              <div className="year-stat-item">
                <span className="year-stat-label">Taxa de Conclusão</span>
                <span className="year-stat-value">
                  {stats?.totalServices > 0
                    ? ((stats.completed / stats.totalServices) * 100).toFixed(1)
                    : "0"}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Gráfico de Serviços por Mês */}
        <div className="chart-container">
          <h3>Serviços Concluídos por Mês</h3>
          <div className="month-chart">
            {Array.from({ length: 12 }, (_, i) => {
              const monthData = stats?.servicesByMonth?.find(
                (m) => m.mes === i + 1,
              );
              const count = monthData?.total || 0;
              const maxCount = Math.max(
                ...(stats?.servicesByMonth?.map((m) => m.total) || [1]),
              );

              return (
                <div key={i} className="month-column">
                  <div className="month-bar-wrapper">
                    <div
                      className="month-bar"
                      style={{
                        height: `${(count / maxCount) * 200}px`,
                      }}
                    ></div>
                    {count > 0 && (
                      <span className="month-bar-label">{count}</span>
                    )}
                  </div>
                  <span className="month-name">{getMonthName(i + 1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
