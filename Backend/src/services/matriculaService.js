const axios = require("axios");

const OSCARO_BASE_URL = "https://www.oscaro.pt";
const TIMEOUT_MS = 15000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

const HEADERS_BASE = {
  "User-Agent": USER_AGENT,
  "Accept-Language": "pt-PT,pt;q=0.9",
  Referer: `${OSCARO_BASE_URL}/`,
  Origin: OSCARO_BASE_URL,
  "Sec-Ch-Ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
};

const logRespostaBloqueada = (contexto, resposta) => {
  const corpo =
    typeof resposta.data === "string"
      ? resposta.data.slice(0, 800)
      : JSON.stringify(resposta.data)?.slice(0, 800);

  console.log("[Oscaro] Bloqueio detectado:", {
    contexto,
    status: resposta.status,
    statusText: resposta.statusText,
    server: resposta.headers?.server,
    cfRay: resposta.headers?.["cf-ray"],
    cfMitigated: resposta.headers?.["cf-mitigated"],
    contentType: resposta.headers?.["content-type"],
    corpo,
  });
};

const verificarBloqueioOscaro = (contexto, resposta) => {
  if (resposta.status === 403 || resposta.status === 503) {
    logRespostaBloqueada(contexto, resposta);
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
      "API_UNAVAILABLE",
    );
  }
};

class MatriculaServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "MatriculaServiceError";
    this.code = code;
  }
}

const normalizarMatricula = (matricula) =>
  String(matricula).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const formatarMatricula = (matricula) => {
  const matriculaPura = normalizarMatricula(matricula);

  if (matriculaPura.length === 6) {
    return matriculaPura.match(/.{1,2}/g).join("-");
  }

  return matriculaPura;
};

const MARCAS_CANONICAS = {
  VW: "Volkswagen",
  VOLKSWAGEN: "Volkswagen",
  MERCEDES: "Mercedes",
  MERCEDESBENZ: "Mercedes",
  "MERCEDES-BENZ": "Mercedes",
  ALFAROMEO: "AlfaRomeo",
  "ALFA ROMEO": "AlfaRomeo",
  CITROEN: "Citroen",
  CITROËN: "Citroen",
  BMW: "BMW",
  FIAT: "Fiat",
  FORD: "Ford",
  OPEL: "Opel",
  PEUGEOT: "Peugeot",
  RENAULT: "Renault",
  HONDA: "Honda",
  DACIA: "Dacia",
  HYUNDAI: "Hyundai",
  KIA: "Kia",
  NISSAN: "Nissan",
  SEAT: "Seat",
  TOYOTA: "Toyota",
  VOLVO: "Volvo",
  AUDI: "Audi",
};

const formatarTextoVeiculo = (texto) => {
  if (!texto) {
    return "";
  }

  const limpo = String(texto).trim();
  const chaveAlias = limpo.toUpperCase().replace(/[\s-]/g, "");

  if (MARCAS_CANONICAS[chaveAlias]) {
    return MARCAS_CANONICAS[chaveAlias];
  }

  if (MARCAS_CANONICAS[limpo.toUpperCase()]) {
    return MARCAS_CANONICAS[limpo.toUpperCase()];
  }

  return limpo
    .toLowerCase()
    .split(/\s+/)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
};

const formatarMarca = (marca) => formatarTextoVeiculo(marca);
const formatarModelo = (modelo) => formatarTextoVeiculo(modelo);

const extrairAno = (veiculo, resposta) => {
  const candidatos = [];

  const visitar = (objeto, profundidade = 0) => {
    if (!objeto || typeof objeto !== "object" || profundidade > 8) {
      return;
    }

    for (const [chave, valor] of Object.entries(objeto)) {
      if (/year|ano|immatriculation|registration|first-registration/i.test(chave)) {
        candidatos.push(valor);
      }

      if (valor && typeof valor === "object") {
        visitar(valor, profundidade + 1);
      }
    }
  };

  visitar(veiculo);
  visitar(resposta);

  const anoAtual = new Date().getFullYear() + 1;

  for (const valor of candidatos) {
    if (typeof valor === "number" && valor >= 1950 && valor <= anoAtual) {
      return String(valor);
    }

    if (typeof valor === "string") {
      const matchData = valor.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-]((19|20)\d{2})\b/);
      if (matchData?.[3]) {
        return matchData[3];
      }

      const matchAno = valor.match(/\b((19|20)\d{2})\b/);
      if (matchAno?.[1]) {
        return matchAno[1];
      }
    }
  }

  return "";
};

const extrairMotor = (veiculo) => {
  const complemento = veiculo.labels?.["complement-label"]?.pt?.trim() || "";
  const geracao =
    veiculo.ancestors
      ?.find((item) => item.level === 3)
      ?.labels?.label?.pt?.trim() || "";

  if (!complemento) {
    return "";
  }

  let motor = complemento;

  if (geracao && motor.toUpperCase().startsWith(geracao.toUpperCase())) {
    motor = motor.slice(geracao.length).trim();
  } else {
    motor = motor.replace(/^\([A-Z0-9]+\)\s*/i, "").trim();
  }

  return motor;
};

const criarSessaoOscaro = () => {
  const cookies = new Map();

  const registarCookies = (setCookie) => {
    if (!setCookie) {
      return;
    }

    const lista = Array.isArray(setCookie) ? setCookie : [setCookie];

    for (const item of lista) {
      const par = item.split(";")[0];
      const [nome] = par.split("=");
      cookies.set(nome, par);
    }
  };

  const cliente = axios.create({
    timeout: TIMEOUT_MS,
    validateStatus: () => true,
    headers: HEADERS_BASE,
  });

  cliente.interceptors.response.use((resposta) => {
    registarCookies(resposta.headers["set-cookie"]);
    return resposta;
  });

  const pedido = async (config) =>
    cliente.request({
      ...config,
      headers: {
        ...config.headers,
        ...(cookies.size ? { Cookie: [...cookies.values()].join("; ") } : {}),
      },
    });

  return { pedido, registarCookies };
};

const obterCsrfToken = async (pedido) => {
  const resposta = await pedido({
    method: "GET",
    url: `${OSCARO_BASE_URL}/xhr/init-client`,
    headers: {
      Accept: "application/json, text/plain, */*",
      Referer: `${OSCARO_BASE_URL}/`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  verificarBloqueioOscaro("init-client", resposta);

  if (resposta.status >= 500) {
    logRespostaBloqueada("init-client", resposta);
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
      "API_UNAVAILABLE",
    );
  }

  const token =
    resposta.data?.["csrf-token"] || resposta.data?.csrf_token || "";

  if (!token) {
    logRespostaBloqueada("init-client-sem-csrf", resposta);
    throw new MatriculaServiceError(
      "Não foi possível iniciar a consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }

  return token;
};

const extrairDadosVeiculo = (veiculo, resposta) => {
  const marca =
    veiculo.ancestors
      ?.find((item) => item.level === 1)
      ?.labels?.label?.pt?.trim() || "";

  const serie =
    veiculo.ancestors
      ?.find((item) => item.level === 2)
      ?.labels?.label?.pt?.trim() || "";

  const geracao =
    veiculo.ancestors
      ?.find((item) => item.level === 3)
      ?.labels?.label?.pt?.trim() || "";

  let modelo = serie;

  if (geracao && !modelo.includes(geracao)) {
    modelo = `${modelo} ${geracao}`.trim();
  }

  if (!modelo) {
    const rotuloBase = veiculo.labels?.["core-label"]?.pt?.trim() || "";

    if (rotuloBase && marca && rotuloBase.toUpperCase().startsWith(marca.toUpperCase())) {
      modelo = rotuloBase.slice(marca.length).trim();
    } else {
      modelo = rotuloBase;
    }
  }

  return {
    marca,
    modelo,
    motor: extrairMotor(veiculo),
    ano: extrairAno(veiculo, resposta),
  };
};

const consultarOscaro = async (matriculaLimpa, matriculaFormatada) => {
  const { pedido } = criarSessaoOscaro();
  let resposta;

  try {
    const paginaInicial = await pedido({
      method: "GET",
      url: `${OSCARO_BASE_URL}/`,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        Referer: `${OSCARO_BASE_URL}/`,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    verificarBloqueioOscaro("homepage", paginaInicial);

    const csrfToken = await obterCsrfToken(pedido);

    resposta = await pedido({
      method: "GET",
      url: `${OSCARO_BASE_URL}/xhr/dionysos-search/pt/pt`,
      params: { plate: matriculaLimpa },
      headers: {
        Accept: "application/json, text/plain, */*",
        Referer: `${OSCARO_BASE_URL}/`,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
        "x-csrf-token": csrfToken,
      },
    });

    verificarBloqueioOscaro("dionysos-search", resposta);
  } catch (error) {
    if (error instanceof MatriculaServiceError) {
      throw error;
    }

    throw new MatriculaServiceError(
      "Não foi possível contactar o serviço de consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }

  if (resposta.status === 204 || resposta.status === 404) {
    throw new MatriculaServiceError(
      `Não foi encontrada informação para a matrícula ${matriculaFormatada}. Verifique se a matrícula está correta.`,
      "NOT_FOUND",
    );
  }

  if (resposta.status === 400) {
    throw new MatriculaServiceError(
      `Não foi encontrada informação para a matrícula ${matriculaFormatada}. Verifique se a matrícula está correta.`,
      "NOT_FOUND",
    );
  }

  if (resposta.status >= 500) {
    logRespostaBloqueada("dionysos-search", resposta);
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
      "API_UNAVAILABLE",
    );
  }

  const veiculos = resposta.data?.vehicles;

  if (!Array.isArray(veiculos) || veiculos.length === 0) {
    throw new MatriculaServiceError(
      `Não foi encontrada informação para a matrícula ${matriculaFormatada}. Verifique se a matrícula está correta.`,
      "NOT_FOUND",
    );
  }

  const dados = extrairDadosVeiculo(veiculos[0], resposta.data);

  if (!dados.marca && !dados.modelo) {
    throw new MatriculaServiceError(
      `Não foi encontrada informação para a matrícula ${matriculaFormatada}. Verifique se a matrícula está correta.`,
      "NOT_FOUND",
    );
  }

  return dados;
};

exports.consultarMatricula = async (matricula) => {
  const matriculaNormalizada = normalizarMatricula(matricula);

  if (matriculaNormalizada.length < 6) {
    throw new MatriculaServiceError(
      "A matrícula indicada não é válida.",
      "INVALID",
    );
  }

  const matriculaFormatada = formatarMatricula(matriculaNormalizada);
  const dados = await consultarOscaro(
    matriculaNormalizada,
    matriculaFormatada,
  );

  return {
    MatriculaId: matriculaFormatada,
    Marca: formatarMarca(dados.marca),
    Modelo: formatarModelo(dados.modelo),
    ...(dados.motor ? { Motor: dados.motor } : {}),
    ...(dados.ano ? { Ano: dados.ano } : {}),
  };
};

exports.MatriculaServiceError = MatriculaServiceError;
