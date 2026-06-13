const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const getAuthHeadersForm = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.warn("Sessão inválida ou expirada. A limpar credenciais...");
      localStorage.removeItem("token");
      localStorage.removeItem("oficina");
      window.location.href = "/login";
      throw new Error("Sessão expirada");
    }

    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.erro || "Erro na rede ou servidor indisponível.";

    throw new Error(errorMessage);
  }
  return response.json();
};

// Pedidos GET

export const fetchCarros = () =>
  fetch(`${API_BASE_URL}/carros`, { headers: getAuthHeaders() }).then(
    handleResponse,
  );
export const fetchCarrosPorStatus = () =>
  fetch(`${API_BASE_URL}/carros/status`, { headers: getAuthHeaders() }).then(
    handleResponse,
  );
export const fetchClientes = () =>
  fetch(`${API_BASE_URL}/clientes`, { headers: getAuthHeaders() }).then(
    handleResponse,
  );
export const fetchServicos = () =>
  fetch(`${API_BASE_URL}/servicos`, { headers: getAuthHeaders() }).then(
    handleResponse,
  );
export const fetchServicosPorId = (id) =>
  fetch(`${API_BASE_URL}/servicos/editar/${id}`, {
    headers: getAuthHeaders(),
  }).then(handleResponse);
export const fetchServicosPorMatricula = (id) =>
  fetch(`${API_BASE_URL}/servicos/carros/${id}`, {
    headers: getAuthHeaders(),
  }).then(handleResponse);
export const fetchCarrosPorMatricula = (id) =>
  fetch(`${API_BASE_URL}/carros/${id}`, { headers: getAuthHeaders() }).then(
    handleResponse,
  );

// Pedidos POST

export const addCarro = (dados) =>
  fetch(`${API_BASE_URL}/carros/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  }).then(handleResponse);
export const consultarMatricula = async (matriculaId) => {
  const response = await fetch(`${API_BASE_URL}/carros/matricula`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ MatriculaId: matriculaId }),
  });

  if (response.status === 401 || response.status === 403) {
    console.warn("Sessão inválida ou expirada. A limpar credenciais...");
    localStorage.removeItem("token");
    localStorage.removeItem("oficina");
    window.location.href = "/login";
    throw new Error("Sessão expirada");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.erro || "Erro na rede ou servidor indisponível.",
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
export const addServico = (dadosFormData) =>
  fetch(`${API_BASE_URL}/servicos/`, {
    method: "POST",
    headers: getAuthHeadersForm(),
    body: dadosFormData,
  }).then(handleResponse);
export const addCliente = (dados) =>
  fetch(`${API_BASE_URL}/clientes/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  }).then(handleResponse);

// Pedidos PUT

export const updateServico = (id, dadosFormData) => {
  return fetch(`${API_BASE_URL}/servicos/editar/${id}`, {
    method: "PUT",
    headers: getAuthHeadersForm(),
    body: dadosFormData,
  }).then(handleResponse);
};
export const updateCliente = (id, dados) => {
  return fetch(`${API_BASE_URL}/clientes/editar/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  }).then(handleResponse);
};
export const updateCarro = (id, dados) => {
  return fetch(`${API_BASE_URL}/carros/editar/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  }).then(handleResponse);
};

//PEDIDOS DELETE

export const deleteCliente = (id) => {
  return fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  }).then(handleResponse);
};

// Pedidos de Autenticação (Forgot Password e Reset Password)

export const forgotPassword = (email) =>
  fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).then(handleResponse);

export const resetPassword = (token, newPassword) =>
  fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  }).then(handleResponse);

// Fórum de Sugestões

export const fetchSugestoes = (ordenar = "recentes") =>
  fetch(`${API_BASE_URL}/sugestoes?ordenar=${ordenar}`, {
    headers: getAuthHeaders(),
  }).then(handleResponse);

export const addSugestao = (texto) =>
  fetch(`${API_BASE_URL}/sugestoes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ Texto: texto }),
  }).then(handleResponse);

export const votarSugestao = (id, tipo) =>
  fetch(`${API_BASE_URL}/sugestoes/${id}/voto`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ Tipo: tipo }),
  }).then(handleResponse);
