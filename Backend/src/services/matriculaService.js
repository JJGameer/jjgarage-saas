const axios = require("axios");
const cheerio = require("cheerio");

const APL_BASE_URL = "https://www.autopartslogistic.com";
const TIMEOUT_MS = 30000;

const HEADERS_BASE = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
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

const parseRespostaJson = (data) => {
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

const registarErroAPL = (error, resposta) => {
  if (resposta?.data) {
    const corpo =
      typeof resposta.data === "string"
        ? resposta.data.slice(0, 500)
        : JSON.stringify(resposta.data).slice(0, 500);
    console.error("[APL Error]:", error.message, corpo);
    return;
  }

  console.error("[APL Error]:", error.message);
};

const pedidoAPL = async (config) => {
  try {
    return await axios({
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
      ...config,
    });
  } catch (error) {
    registarErroAPL(error);
    throw new MatriculaServiceError(
      "Não foi possível contactar o serviço de consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }
};

const construirCorpoPesquisaMatricula = (matriculaLimpa) =>
  new URLSearchParams({
    id: "23",
    matriculaid: matriculaLimpa,
    manufacturer_name: "",
    fam: "1",
    manufacturer: "0",
    model: "0",
    carid: "0",
    ref: "",
  }).toString();

const pesquisarMatriculaAPL = async (matriculaLimpa, matriculaFormatada) => {
  const response = await pedidoAPL({
    method: "POST",
    url: `${APL_BASE_URL}/home_search_submit.php`,
    data: construirCorpoPesquisaMatricula(matriculaLimpa),
    headers: {
      ...HEADERS_BASE,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${APL_BASE_URL}/`,
      Origin: APL_BASE_URL,
      "X-Requested-With": "XMLHttpRequest",
    },
    responseType: "text",
    transformResponse: [(data) => data],
  });

  if (response.status >= 400) {
    registarErroAPL(
      new Error(`Resposta HTTP ${response.status}`),
      response,
    );
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
      "API_UNAVAILABLE",
    );
  }

  const resultado = parseRespostaJson(response.data);

  if (!resultado) {
    throw new MatriculaServiceError(
      "Não foi possível iniciar a consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }

  if (String(resultado.estado) !== "1" || !resultado.carid) {
    throw new MatriculaServiceError(
      `Não foi encontrada informação para a matrícula ${matriculaFormatada}. Verifique se a matrícula está correta.`,
      "NOT_FOUND",
    );
  }

  return resultado.carid;
};

const extrairAnoDoTitulo = (titulo) => {
  const matchAno = String(titulo).match(/\b((19|20)\d{2})\b/);
  return matchAno?.[1] || "";
};

const extrairDadosDoHtml = ($, html) => {
  const tituloCarro = $("#titulocarro").text().replace(/\s+/g, " ").trim();
  const marcaScript = html.match(/var\s+marca_sel\s*=\s*'([^']+)'/i)?.[1]?.trim();
  const modeloScript = html.match(/var\s+modelo_sel\s*=\s*'([^']+)'/i)?.[1]?.trim();
  const motor = $(".cnt_redBox p").first().text().replace(/\s+/g, " ").trim();

  let marca = marcaScript || "";
  let modelo = modeloScript || "";

  if (!marca && tituloCarro) {
    const partes = tituloCarro.split(/\s+/);
    const ano = extrairAnoDoTitulo(tituloCarro);

    if (ano && partes[partes.length - 1] === ano) {
      partes.pop();
    }

    marca = partes[0] || "";
    modelo = partes.slice(1).join(" ").trim();
  }

  if (!marca && !modelo) {
    return null;
  }

  return {
    marca,
    modelo,
    motor,
    ano: extrairAnoDoTitulo(tituloCarro),
  };
};

const consultarAutoPartsLogistic = async (matriculaLimpa, matriculaFormatada) => {
  const carid = await pesquisarMatriculaAPL(matriculaLimpa, matriculaFormatada);
  const urlResultado = `${APL_BASE_URL}/${carid}`;

  const response = await pedidoAPL({
    method: "GET",
    url: urlResultado,
    headers: {
      ...HEADERS_BASE,
      Referer: `${APL_BASE_URL}/`,
    },
    responseType: "text",
    transformResponse: [(data) => data],
  });

  if (response.status >= 400) {
    registarErroAPL(
      new Error(`Resposta HTTP ${response.status}`),
      response,
    );
    throw new MatriculaServiceError(
      "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
      "API_UNAVAILABLE",
    );
  }

  const html = String(response.data || "");

  if (!html.trim()) {
    throw new MatriculaServiceError(
      "Não foi possível iniciar a consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }

  const $ = cheerio.load(html);
  const dados = extrairDadosDoHtml($, html);

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
  const dados = await consultarAutoPartsLogistic(
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
