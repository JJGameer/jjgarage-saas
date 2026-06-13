import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuthContext } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

const EMPTY_MONTHLY_STATS = [
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
].map((name) => ({
  name,
  receitaTotal: 0,
  receitaMaoDeObra: 0,
  totalServicos: 0,
  totalClientes: 0,
}));

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatInteger = (value) =>
  new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 0,
  }).format(value);

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bi-tooltip">
      <p className="bi-tooltip-label">{label}</p>
      <p className="bi-tooltip-value">{formatter(payload[0].value)}</p>
    </div>
  );
};

const CHARTS = [
  {
    title: "Receita Total",
    dataKey: "receitaTotal",
    color: "#3b82f6",
    formatter: formatCurrency,
    isCurrency: true,
  },
  {
    title: "Ganho em Mão de Obra",
    dataKey: "receitaMaoDeObra",
    color: "#10b981",
    formatter: formatCurrency,
    isCurrency: true,
  },
  {
    title: "Serviços Concluídos",
    dataKey: "totalServicos",
    color: "#8b5cf6",
    formatter: formatInteger,
    isCurrency: false,
  },
  {
    title: "Novos Clientes Registados",
    dataKey: "totalClientes",
    color: "#f97316",
    formatter: formatInteger,
    isCurrency: false,
  },
];

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

  const chartData = useMemo(() => {
    if (stats?.monthlyStats?.length === 12) {
      return stats.monthlyStats;
    }

    return EMPTY_MONTHLY_STATS;
  }, [stats?.monthlyStats]);

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
        <div className="stats-grid">
          <div className="stat-card completed">
            <div className="stat-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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

          <div className="year-stat-card">
            <h3>Estatísticas</h3>
            <div className="year-stat-content">
              <div className="year-stat-item">
                <span className="year-stat-label">Total de Peças</span>
                <span className="year-stat-value">
                  €{(stats?.totalPecas || 0).toFixed(2)}
                </span>
              </div>
              <div className="year-stat-divider"></div>
              <div className="year-stat-item">
                <span className="year-stat-label">Total Mão de Obra</span>
                <span className="year-stat-value">
                  €{(stats?.totalMaoDeObra || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bi-charts-grid">
          {CHARTS.map((chart) => (
            <div key={chart.dataKey} className="bi-chart-card">
              <h3 className="bi-chart-title">{chart.title}</h3>
              <div className="bi-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      width={48}
                      tickFormatter={(value) =>
                        chart.isCurrency
                          ? `${Math.round(value)}€`
                          : formatInteger(value)
                      }
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                      content={
                        <ChartTooltip formatter={chart.formatter} />
                      }
                    />
                    <Bar
                      dataKey={chart.dataKey}
                      fill={chart.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
