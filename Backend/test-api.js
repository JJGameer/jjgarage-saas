/**
 * Script de teste para JJGarage Backend
 * Uso: node test-api.js
 */

const BASE_URL = "http://127.0.0.1:3001";

// Cores para console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}🧪 ${msg}${colors.reset}`),
};

// Função para fazer requisições
async function makeRequest(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    log.error(`Erro na requisição: ${error.message}`);
    return null;
  }
}

// Função para formatar resposta
function logResponse(testName, response) {
  if (!response) return;

  console.log(`  Status: ${response.status}`);
  console.log(`  Resposta:`, JSON.stringify(response.data, null, 2));

  if (response.ok) {
    log.success(`${testName} passou`);
  } else {
    log.error(`${testName} falhou`);
  }
}

// Testes
async function runTests() {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🧪 TESTES JJGarage Backend`);
  console.log(`URL: ${BASE_URL}`);
  console.log(`${"=".repeat(50)}`);

  // Teste 1: Forgot Password
  log.test("1. POST /auth/forgot-password");
  console.log("  Enviando pedido de recuperação de password...");
  let response = await makeRequest("POST", "/auth/forgot-password", {
    email: "oficina@example.com",
  });
  logResponse("Forgot Password", response);

  // Teste 2: Webhook - Ativação (novo cliente)
  log.test("2. POST /webhooks/whop (membership_activated - novo cliente)");
  console.log("  Enviando evento de ativação de novo cliente...");
  response = await makeRequest("POST", "/webhooks/whop", {
    event: "membership_activated",
    data: {
      email: "novo-cliente@example.com",
      id: "membership_123",
    },
  });
  logResponse("Webhook Ativação", response);

  // Teste 3: Webhook - Ativação (cliente existente - reativação)
  log.test("3. POST /webhooks/whop (membership_activated - reativação)");
  console.log("  Enviando evento de reativação (cliente existente)...");
  response = await makeRequest("POST", "/webhooks/whop", {
    event: "membership_activated",
    data: {
      email: "novo-cliente@example.com",
      id: "membership_456",
    },
  });
  logResponse("Webhook Reativação", response);

  // Teste 4: Webhook - Desativação (cancelamento)
  log.test("4. POST /webhooks/whop (membership_deactivated)");
  console.log("  Enviando evento de cancelamento...");
  response = await makeRequest("POST", "/webhooks/whop", {
    event: "membership_deactivated",
    data: {
      email: "novo-cliente@example.com",
      id: "membership_123",
    },
  });
  logResponse("Webhook Desativação", response);

  // Teste 5: Login com subscrição suspensa
  log.test("5. POST /auth/login (subscrição suspensa)");
  console.log("  Tentando fazer login com subscrição suspensa...");
  response = await makeRequest("POST", "/auth/login", {
    Email: "novo-cliente@example.com",
    Password: "senha123",
  });
  if (response && response.status === 403) {
    log.success("Login bloqueado corretamente (subscrição suspensa)");
  } else {
    log.error(`Login não bloqueado como esperado. Status: ${response?.status}`);
  }
  logResponse("Login Bloqueado", response);

  // Teste 6: Webhook - Evento desconhecido
  log.test("6. POST /webhooks/whop (evento desconhecido)");
  console.log("  Enviando evento desconhecido...");
  response = await makeRequest("POST", "/webhooks/whop", {
    event: "unknown_event",
    data: {
      email: "teste@example.com",
    },
  });
  logResponse("Evento Desconhecido", response);

  // Teste 7: Webhook sem email
  log.test("7. POST /webhooks/whop (sem email)");
  console.log("  Enviando webhook sem email no payload...");
  response = await makeRequest("POST", "/webhooks/whop", {
    event: "membership_activated",
    data: {},
  });
  if (response && response.status === 400) {
    log.success("Validação de email funcionando corretamente");
  }
  logResponse("Validação Email", response);

  // Resumo
  console.log(`\n${"=".repeat(50)}`);
  log.info("Testes concluídos!");
  log.info("Verifique os logs do servidor para mais detalhes.");
  console.log(`${"=".repeat(50)}\n`);
}

// Executar testes
runTests().catch((error) => {
  log.error(`Erro ao executar testes: ${error.message}`);
  process.exit(1);
});
