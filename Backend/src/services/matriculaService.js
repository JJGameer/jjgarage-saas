const axios = require("axios");
const cheerio = require("cheerio");

const SCRAPER_API_BASE = "http://api.scraperapi.com/";
const TIMEOUT_MS = 60000;

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

const parseRespostaScraper = (data) => {
  if (data && typeof data === "object") {
    return data;
  }

  if (typeof data !== "string" || !data.trim()) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const registarErroScraperApi = (error, resposta) => {
  if (resposta?.data) {
    const corpo =
      typeof resposta.data === "string"
        ? resposta.data.slice(0, 500)
        : JSON.stringify(resposta.data).slice(0, 500);
    console.error("[ScraperAPI Error]:", error.message, corpo);
    return;
  }

  console.error("[ScraperAPI Error]:", error.message);
};

const pedidoScraperApi = async (urlOscaro, opcoes = {}) => {
  const apiKey = process.env.SCRAPER_API_KEY;

  if (!apiKey) {
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas não está configurado. Contacte o administrador.",
      "API_UNAVAILABLE",
    );
  }

  const urlOscaroCodificado = encodeURIComponent(urlOscaro);
  let scraperUrl = `${SCRAPER_API_BASE}?key=${apiKey}&url=${urlOscaroCodificado}`;

  if (opcoes.sessionNumber) {
    scraperUrl += `&session_number=${opcoes.sessionNumber}`;
  }

  if (opcoes.keepHeaders) {
    scraperUrl += "&keep_headers=true";
  }

  try {
    const response = await axios.get(scraperUrl, {
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
      responseType: "text",
      headers: opcoes.headers || {},
    });

    const corpoJson = parseRespostaScraper(response.data);

    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 429 ||
      response.status === 500 ||
      response.status === 503
    ) {
      const mensagemErro =
        corpoJson?.error ||
        corpoJson?.message ||
        `Resposta ScraperAPI HTTP ${response.status}`;

      registarErroScraperApi(new Error(mensagemErro), response);

      throw new MatriculaServiceError(
        "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
        "API_UNAVAILABLE",
      );
    }

    return response;
  } catch (error) {
    if (error instanceof MatriculaServiceError) {
      throw error;
    }

    registarErroScraperApi(error);
    throw new MatriculaServiceError(
      "Não foi possível contactar o serviço de consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }
};

const extrairVeiculoDoJson = (html) => {
  const jsonDireto = parseRespostaScraper(html);

  if (jsonDireto?.vehicles?.[0]) {
    return extrairDadosVeiculo(jsonDireto.vehicles[0], jsonDireto);
  }

  const matchVehicles = html.match(/"vehicles"\s*:\s*(\[[\s\S]*?\])\s*,\s*"/);
  if (matchVehicles) {
    try {
      const veiculos = JSON.parse(matchVehicles[1]);
      if (veiculos[0]) {
        return extrairDadosVeiculo(veiculos[0], { vehicles: veiculos });
      }
    } catch {
      // Ignorar JSON inválido embutido no HTML.
    }
  }

  return null;
};

const extrairDadosDoHtml = ($, html) => {
  const dadosJson = extrairVeiculoDoJson(html);
  if (dadosJson?.marca || dadosJson?.modelo) {
    return dadosJson;
  }

  const seletoresVeiculo = [
    ".vehicle-selector__vehicle-name",
    ".vehicle-selector__name",
    ".garage-vehicle__title",
    ".selected-vehicle__name",
    "[data-testid='vehicle-name']",
    "[data-vehicle-name]",
    ".vehicle-identification__vehicle-name",
  ];

  let rotuloCompleto = "";

  for (const seletor of seletoresVeiculo) {
    const texto = $(seletor).first().text().replace(/\s+/g, " ").trim();
    if (texto && !/identificar o meu veículo/i.test(texto)) {
      rotuloCompleto = texto;
      break;
    }
  }

  if (!rotuloCompleto) {
    const metaDescricao = $('meta[property="og:description"]').attr("content") || "";
    if (metaDescricao && !/oscaro/i.test(metaDescricao)) {
      rotuloCompleto = metaDescricao.trim();
    }
  }

  if (!rotuloCompleto) {
    return null;
  }

  const partes = rotuloCompleto.split(/\s+/);
  const marca = partes[0] || "";
  const modelo = partes.slice(1).join(" ").trim();

  return {
    marca,
    modelo,
    motor: "",
    ano: "",
  };
};

const consultarOscaroApiViaScraper = async (matriculaLimpa) => {
  const sessionNumber = Date.now();

  await pedidoScraperApi("https://www.oscaro.pt/", { sessionNumber });

  const respostaInit = await pedidoScraperApi(
    "https://www.oscaro.pt/xhr/init-client",
    { sessionNumber },
  );

  const initData = parseRespostaScraper(respostaInit.data);
  const csrfToken = initData?.["csrf-token"] || initData?.csrf_token;

  if (!csrfToken) {
    return null;
  }

  const respostaApi = await pedidoScraperApi(
    `https://www.oscaro.pt/xhr/dionysos-search/pt/pt?plate=${matriculaLimpa}`,
    {
      sessionNumber,
      keepHeaders: true,
      headers: {
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.oscaro.pt/",
        "X-Requested-With": "XMLHttpRequest",
        "x-csrf-token": csrfToken,
      },
    },
  );

  const apiData = parseRespostaScraper(respostaApi.data);

  if (!apiData?.vehicles?.[0]) {
    return null;
  }

  return extrairDadosVeiculo(apiData.vehicles[0], apiData);
};

const consultarOscaro = async (matriculaLimpa, matriculaFormatada) => {
  if (!process.env.SCRAPER_API_KEY) {
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas não está configurado. Contacte o administrador.",
      "API_UNAVAILABLE",
    );
  }

  const urlOscaro = `https://www.oscaro.pt/search?q=${matriculaLimpa}`;
  const urlOscaroCodificado = encodeURIComponent(urlOscaro);
  const scraperUrl = `http://api.scraperapi.com/?key=${process.env.SCRAPER_API_KEY}&url=${urlOscaroCodificado}`;

  let response;

  try {
    response = await axios.get(scraperUrl, {
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
      responseType: "text",
    });
  } catch (error) {
    console.error("[ScraperAPI Error]:", error.message);
    throw new MatriculaServiceError(
      "Não foi possível contactar o serviço de consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }

  if (
    response.status === 401 ||
    response.status === 403 ||
    response.status === 429 ||
    response.status === 500 ||
    response.status === 503
  ) {
    const corpoJson = parseRespostaScraper(response.data);
    const mensagemErro =
      corpoJson?.error ||
      corpoJson?.message ||
      `Resposta ScraperAPI HTTP ${response.status}`;

    console.error("[ScraperAPI Error]:", mensagemErro);
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
      "API_UNAVAILABLE",
    );
  }

  const html = String(response.data || "");
  const $ = cheerio.load(html);
  let dados = extrairDadosDoHtml($, html);

  if (!dados?.marca && !dados?.modelo) {
    dados = await consultarOscaroApiViaScraper(matriculaLimpa);
  }

  if (!dados?.marca && !dados?.modelo) {
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
