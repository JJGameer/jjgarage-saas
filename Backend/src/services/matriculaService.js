const axios = require("axios");

const FV_URL =
  "https://fv-fo-prod-pt.azurewebsites.net/askquote/searchvehicle";
const TIMEOUT_MS = 15000;

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
  TESLA: "Tesla",
};

// Matches valid Roman numerals (I through MMMMCMXCIX)
const NUMERAL_ROMANO =
  /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i;

const formatarTextoVeiculo = (texto) => {
  if (!texto) return "";

  const limpo = String(texto).trim();
  const chaveAlias = limpo.toUpperCase().replace(/[\s-]/g, "");

  if (MARCAS_CANONICAS[chaveAlias]) return MARCAS_CANONICAS[chaveAlias];
  if (MARCAS_CANONICAS[limpo.toUpperCase()]) return MARCAS_CANONICAS[limpo.toUpperCase()];

  return limpo
    .toLowerCase()
    .split(/\s+/)
    .map((p) =>
      NUMERAL_ROMANO.test(p) ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1),
    )
    .join(" ");
};

// Remove trailing TecDoc type IDs (e.g. "…143cv (105) 24405" → "…143cv (105)")
const limparMotor = (motor) => {
  if (!motor) return "";
  return motor.replace(/\s+[\d,]+\s*$/, "").trim();
};

const consultarFeuVert = async (matriculaFormatada) => {
  try {
    const response = await axios({
      method: "POST",
      url: FV_URL,
      data: { immatriculation: matriculaFormatada },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        Accept: "application/json",
        Referer: "https://fv-fo-prod-pt.azurewebsites.net/",
      },
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
    });

    if (response.status >= 500) {
      console.error("[FeuVert Error]: HTTP", response.status);
      throw new MatriculaServiceError(
        "O serviço de consulta de matrículas está temporariamente indisponível. Tente novamente mais tarde.",
        "API_UNAVAILABLE",
      );
    }

    const resultado =
      typeof response.data === "object"
        ? response.data
        : JSON.parse(response.data);

    if (!resultado?.foundVhc) {
      throw new MatriculaServiceError(
        `Não foi encontrada informação para a matrícula ${matriculaFormatada}. Verifique se a matrícula está correta.`,
        "NOT_FOUND",
      );
    }

    return resultado.foundVhc;
  } catch (error) {
    if (error instanceof MatriculaServiceError) throw error;
    console.error("[FeuVert Error]:", error.message);
    throw new MatriculaServiceError(
      "Não foi possível contactar o serviço de consulta de matrículas. Tente novamente.",
      "API_UNAVAILABLE",
    );
  }
};

exports.consultarMatricula = async (matricula) => {
  const matriculaNormalizada = normalizarMatricula(matricula);

  if (matriculaNormalizada.length < 6) {
    throw new MatriculaServiceError("A matrícula indicada não é válida.", "INVALID");
  }

  const matriculaFormatada = formatarMatricula(matriculaNormalizada);
  const veiculo = await consultarFeuVert(matriculaFormatada);

  const motor = limparMotor(veiculo.moteur);

  return {
    MatriculaId: matriculaFormatada,
    Marca: formatarTextoVeiculo(veiculo.marque),
    Modelo: formatarTextoVeiculo(veiculo.modele),
    ...(motor ? { Motor: motor } : {}),
  };
};

exports.MatriculaServiceError = MatriculaServiceError;
