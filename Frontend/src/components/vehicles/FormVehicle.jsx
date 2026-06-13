import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addCarro,
  consultarMatricula,
  fetchClientes,
  updateCarro,
} from "../../services/api";
import { useModal } from "../../context/ModalContext";

function FormVehicle({ dadosEdicao }) {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");
  const [mostrarMarcas, setMostrarMarcas] = useState(false);
  const [mostrarModelos, setMostrarModelos] = useState(false);
  const [mostrarSegmentos, setMostrarSegmentos] = useState(false);
  const [mostrarCores, setMostrarCores] = useState(false);
  const [imagemAtual, setImagemAtual] = useState(0);
  const { showModal, hideModal } = useModal();
  const ultimaMatriculaConsultada = useRef("");
  const dadosAutomaticosMatricula = useRef(false);
  const [marcaModeloBloqueados, setMarcaModeloBloqueados] = useState(false);
  const [isConsultandoMatricula, setIsConsultandoMatricula] = useState(false);
  const [formData, setFormData] = useState({
    MatriculaId: dadosEdicao?.MatriculaId || "",
    Marca: dadosEdicao?.Marca || "",
    Modelo: dadosEdicao?.Modelo || "",
    Ano: dadosEdicao?.Ano || "",
    Vin: dadosEdicao?.Vin || "",
    Cor: dadosEdicao?.Cor || "",
    Motor: dadosEdicao?.Motor || "",
    Segmento: dadosEdicao?.Segmento || "",
    ClienteId: dadosEdicao?.ClienteId || "",
  });
  const imagensCarros = [
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1125&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1536909526839-8f10e29ba80c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1541348263662-e068662d82af?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1000&auto=format&fit=crop",
  ];

  const modelosPorMarca = {
    Audi: ["A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5"],
    BMW: [
      "Série 1",
      "Série 2",
      "Série 3",
      "Série 4",
      "Série 5",
      "X1",
      "X3",
      "X5",
    ],
    Citroen: ["C1", "C3", "C4", "C4 Cactus", "C5 Aircross"],
    Fiat: ["500", "500X", "Panda", "Tipo"],
    Ford: ["Fiesta", "Focus", "Mondeo", "Puma", "Kuga"],
    Mercedes: ["Classe A", "Classe B", "Classe C", "Classe E", "GLA", "GLC"],
    Opel: ["Corsa", "Astra", "Insignia", "Mokka", "Crossland"],
    Peugeot: ["108", "208", "2008", "308", "3008", "508"],
    Renault: ["Clio", "Megane", "Captur", "Kadjar", "Talisman"],
    Volkswagen: ["Up", "Polo", "Golf", "Passat", "Tiguan", "T-Roc"],
    AlfaRomeo: ["MiTo", "Giulietta", "Giulia", "Stelvio"],
    Honda: ["Jazz", "Civic", "HR-V", "CR-V"],
    Dacia: ["Sandero", "Sandero Stepway", "Duster", "Logan"],
    Hyundai: ["i10", "i20", "i30", "Bayon", "Tucson"],
    Kia: ["Picanto", "Rio", "Ceed", "Sportage", "Stonic"],
    Nissan: ["Micra", "Juke", "Qashqai", "X-Trail"],
    Seat: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco"],
    Toyota: ["Aygo", "Yaris", "Corolla", "C-HR", "RAV4"],
    Volvo: ["V40", "V60", "S60", "XC40", "XC60"],
  };

  const segmentosCarros = [
    "Sedan",
    "Carrinha",
    "SUV",
    "Coupé",
    "Cabrio",
    "Monovolume",
  ];

  const coresCarros = [
    "Preto",
    "Branco",
    "Cinzento",
    "Azul",
    "Vermelho",
    "Verde",
    "Amarelo",
    "Laranja",
  ];

  useEffect(() => {
    fetchClientes()
      .then((data) => {
        setClientes(data);
        if (dadosEdicao && dadosEdicao.ClienteId) {
          // Procura na lista de clientes o dono com o ID igual ao do carro
          const dono = data.find((c) => c.ClienteId === dadosEdicao.ClienteId);

          if (dono) {
            // Preenche a caixa de texto exatamente no formato que o teu formulário exige
            setClienteSearch(
              `${dono.Nome} - ${dono.Contacto || "Sem telemóvel"}`,
            );
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar os clientes", err);
      });
  }, []);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setImagemAtual((prevImagem) => (prevImagem + 1) % imagensCarros.length);
    }, 5000);
    //limpa o temporizador quando saímos da página
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!isConsultandoMatricula) {
      return undefined;
    }

    document.body.style.cursor = "wait";

    return () => {
      document.body.style.cursor = "";
    };
  }, [isConsultandoMatricula]);

  const matriculaCompleta = (matricula) =>
    matricula.replace(/-/g, "").length === 6;

  const formatarTextoVeiculo = (texto) => {
    if (!texto) return "";

    return String(texto)
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(" ");
  };

  const encontrarMarcaConhecida = (marca) => {
    if (!marca) return "";

    const marcaFormatada = formatarTextoVeiculo(marca);

    const marcaEncontrada = Object.keys(modelosPorMarca).find(
      (nome) => nome.toLowerCase() === marcaFormatada.toLowerCase(),
    );

    return marcaEncontrada || marcaFormatada;
  };

  const handleMatriculaLookup = async (matriculaFormatada) => {
    if (dadosEdicao || !matriculaCompleta(matriculaFormatada)) {
      return;
    }

    const matriculaPura = matriculaFormatada.replace(/-/g, "").toUpperCase();

    if (ultimaMatriculaConsultada.current === matriculaPura) {
      return;
    }

    ultimaMatriculaConsultada.current = matriculaPura;
    setIsConsultandoMatricula(true);

    try {
      const data = await consultarMatricula(matriculaFormatada);

      if (data?.success) {
        dadosAutomaticosMatricula.current = true;
        setMarcaModeloBloqueados(true);
        setFormData((prev) => ({
          ...prev,
          Marca: encontrarMarcaConhecida(data.Marca) || prev.Marca,
          Modelo: formatarTextoVeiculo(data.Modelo) || prev.Modelo,
          ...(data.Ano ? { Ano: String(data.Ano) } : {}),
          ...(data.Motor ? { Motor: data.Motor } : {}),
        }));
        return;
      }

      dadosAutomaticosMatricula.current = false;
      setMarcaModeloBloqueados(false);
      ultimaMatriculaConsultada.current = "";

      showModal({
        type: "error",
        title: "Consulta indisponível",
        message:
          data?.erro ||
          "Não foi possível obter os dados desta matrícula. Preencha a marca e o modelo manualmente.",
      });
    } catch (error) {
      dadosAutomaticosMatricula.current = false;
      setMarcaModeloBloqueados(false);
      ultimaMatriculaConsultada.current = "";

      showModal({
        type: "error",
        title:
          error.status === 404
            ? "Veículo não encontrado"
            : "Consulta indisponível",
        message:
          error.data?.erro ||
          error.message ||
          "Não foi possível encontrar os dados desta matrícula. Preencha a marca e o modelo manualmente.",
      });
    } finally {
      setIsConsultandoMatricula(false);
    }
  };

  const handleVinLookup = async (Vin) => {
    const VinMaisculo = Vin.toUpperCase();
    if (VinMaisculo.length !== 17) return;

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${Vin}?format=json`,
      );
      const data = await response.json();

      console.log("Dados brutos da API:", data);

      const results = data.Results;
      const marca = results.find((r) => r.Variable === "Make")?.Value;
      const modelo = results.find((r) => r.Variable === "Model")?.Value;
      const ano = results.find((r) => r.Variable === "Model Year")?.Value;

      console.log("Tentativa de extração:", { marca, modelo, ano });

      if (!marca && !modelo) {
        showModal({
          type: "info",
          title: "VIN",
          message: "VIN reconhecido, mas a API não retornou dados específicos.",
        });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        Marca: marca,
        Modelo: modelo,
        Ano: ano,
        Vin: VinMaisculo,
      }));
      console.log("Veículo encontrado:", marca, modelo, ano);
    } catch (err) {
      console.error("Erro ao encontrar Vin", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (marcaModeloBloqueados && (name === "Marca" || name === "Modelo")) {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLoading) return;

    const regrasValidacao = [
      { chave: "MatriculaId", nome: "Matrícula" },
      { chave: "Marca", nome: "Marca" },
      { chave: "Modelo", nome: "Modelo" },
      { chave: "Ano", nome: "Ano" },
      { chave: "Cor", nome: "Cor" },
      { chave: "ClienteId", nome: "Cliente" },
    ];

    for (let regra of regrasValidacao) {
      // Verifica se o campo está vazio, null, ou só tem espaços em branco
      if (
        !formData[regra.chave] ||
        String(formData[regra.chave]).trim() === ""
      ) {
        showModal({
          type: "info",
          title: "Campo Obrigatório",
          message: `Por favor, preencha o campo "${regra.nome}" antes de guardar.`,
        });
        return;
      }
    }

    if (formData.MatriculaId.replace(/-/g, "").length < 6) {
      showModal({
        type: "error",
        title: "Matrícula Inválida",
        message: "A matrícula inserida parece estar incompleta.",
      });
      return;
    }

    showModal({
      type: "loading",
      title: dadosEdicao ? "A atualizar veículo..." : "A criar veículo...",
      message: "Por favor, aguarde enquanto guardamos os dados no sistema.",
    });

    setIsLoading(true);

    const pedidoApi = dadosEdicao
      ? updateCarro(dadosEdicao.MatriculaId, formData)
      : addCarro(formData);

    pedidoApi
      .then(() => {
        showModal({
          type: "success",
          title: dadosEdicao ? "Veículo Atualizado!" : "Veículo Criado!",
          message: dadosEdicao
            ? "As alterações foram guardadas com sucesso."
            : "O veículo foi adicionado com sucesso.",
        });

        setTimeout(() => {
          hideModal();
          navigate("/carros");
        }, 2000);
      })
      .catch((err) => {
        console.error("Erro ao guardar", err);
        const mensagemErro =
          err.response?.data?.erro ||
          err.message ||
          "Ocorreu um problema com o servidor. Tente novamente.";

        showModal({
          type: "error",
          title: "Atenção",
          message: mensagemErro,
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleClienteSearch = (e) => {
    const valorDigitado = e.target.value;
    setClienteSearch(valorDigitado);

    const clienteEncontrado = clientes.find(
      (c) => `${c.Nome} - ${c.Contacto || "Sem telemóvel"}` === valorDigitado,
    );

    if (clienteEncontrado) {
      setFormData((prev) => ({
        ...prev,
        ClienteId: clienteEncontrado.ClienteId,
      }));
    } else {
      setFormData((prev) => ({ ...prev, ClienteId: "" }));
    }
  };

  const handleMatriculaChange = (e) => {
    let valorPuro = e.target.value.replace(/-/g, "").toUpperCase();

    if (valorPuro.length > 6) {
      valorPuro = valorPuro.substring(0, 6);
    }

    const matriculaFormatada = valorPuro.match(/.{1,2}/g)?.join("-") || "";
    const matriculaConsultada = ultimaMatriculaConsultada.current.replace(/-/g, "");
    const deveLimparAutomatico =
      dadosAutomaticosMatricula.current &&
      (valorPuro.length < 6 || valorPuro !== matriculaConsultada);

    if (deveLimparAutomatico) {
      dadosAutomaticosMatricula.current = false;
      setMarcaModeloBloqueados(false);
    }

    if (valorPuro.length < 6) {
      ultimaMatriculaConsultada.current = "";
    }

    setFormData((prev) => ({
      ...prev,
      MatriculaId: matriculaFormatada,
      ...(deveLimparAutomatico ? { Marca: "", Modelo: "", Motor: "" } : {}),
    }));
  };

  const handleMatriculaBlur = (e) => {
    const matriculaFormatada = e.target.value.trim();

    if (matriculaCompleta(matriculaFormatada)) {
      handleMatriculaLookup(matriculaFormatada);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="form-container-card"
    >
      <div className="formVehicle">
        <section className="leftColumn">
          <div className="vehicle-image-wrapper">
            <img
              src={imagensCarros[imagemAtual]}
              alt="Veículo"
              className="vehicle-image"
              style={{
                transition: "opacity 1s ease-in-out",
                opacity: 1,
              }}
            />
            <div className="vehicle-image-badge">Fotografia Aleatória</div>
          </div>

          <div className="input-group">
            <label>Matrícula</label>
            <div
              className={isConsultandoMatricula ? "matricula-lookup-wrapper consultando" : "matricula-lookup-wrapper"}
            >
              <input
                type="text"
                name="MatriculaId"
                value={formData.MatriculaId}
                onChange={handleMatriculaChange}
                onBlur={handleMatriculaBlur}
                maxLength={8}
                placeholder="Ex: AA-00-AA"
                disabled={isConsultandoMatricula}
                aria-busy={isConsultandoMatricula}
              />
            </div>
            {isConsultandoMatricula && (
              <span className="matricula-lookup-hint">
                A consultar matrícula...
              </span>
            )}
          </div>

          <div className="input-group">
            <label>VIN</label>
            <input
              type="text"
              name="Vin"
              maxLength="17"
              value={formData.Vin}
              placeholder="17 Caracteres"
              onChange={(e) => {
                handleChange(e);
                if (e.target.value.length === 17)
                  handleVinLookup(e.target.value);
              }}
            />
          </div>
          <div className="input-group">
            <label>Ano</label>
            <input
              type="number"
              name="Ano"
              value={formData.Ano}
              onChange={handleChange}
              placeholder="Ex: 2010"
            />
          </div>
        </section>
        <section className="rightColumn">
          <div className="input-group custom-dropdown">
            <label>Marca</label>
            <input
              type="text"
              name="Marca"
              value={formData.Marca}
              onChange={handleChange}
              onFocus={() => {
                if (!marcaModeloBloqueados) setMostrarMarcas(true);
              }}
              onBlur={() => setTimeout(() => setMostrarMarcas(false), 200)}
              placeholder="Selecione ou escreva a marca"
              autoComplete="off"
              readOnly={marcaModeloBloqueados}
              style={marcaModeloBloqueados ? { cursor: "not-allowed" } : undefined}
            />
            {mostrarMarcas && !marcaModeloBloqueados && (
              <ul className="dropdown-options">
                {Object.keys(modelosPorMarca)
                  .filter((m) =>
                    m.toLowerCase().includes(formData.Marca.toLowerCase()),
                  ) // Filtra conforme escreves
                  .map((m) => (
                    <li
                      key={m}
                      // Quando clica, atualizamos o state fingindo um evento de input
                      onClick={() =>
                        handleChange({ target: { name: "Marca", value: m } })
                      }
                    >
                      {m}
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="input-group custom-dropdown">
            <label>Modelo</label>
            <input
              type="text"
              name="Modelo"
              value={formData.Modelo}
              onChange={handleChange}
              onFocus={() => {
                if (!marcaModeloBloqueados) setMostrarModelos(true);
              }}
              onBlur={() => setTimeout(() => setMostrarModelos(false), 200)}
              placeholder="Selecione o modelo"
              autoComplete="off"
              disabled={!formData.Marca}
              readOnly={marcaModeloBloqueados}
              style={marcaModeloBloqueados ? { cursor: "not-allowed" } : undefined}
            />

            {mostrarModelos &&
              !marcaModeloBloqueados &&
              modelosPorMarca[formData.Marca] && (
              <ul className="dropdown-options">
                {modelosPorMarca[formData.Marca]
                  .filter((mod) =>
                    mod.toLowerCase().includes(formData.Modelo.toLowerCase()),
                  )
                  .map((mod) => (
                    <li
                      key={mod}
                      onClick={() =>
                        handleChange({ target: { name: "Modelo", value: mod } })
                      }
                    >
                      {mod}
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="input-group custom-dropdown">
            <label>Segmento</label>
            <input
              type="text"
              name="Segmento"
              value={formData.Segmento}
              onChange={handleChange}
              onFocus={() => setMostrarSegmentos(true)}
              onBlur={() => setTimeout(() => setMostrarSegmentos(false), 200)}
              placeholder="Selecione o segmento"
            />
            {mostrarSegmentos && (
              <ul className="dropdown-options">
                {segmentosCarros.map((segmento) => (
                  <li
                    key={segmento}
                    onClick={() =>
                      handleChange({
                        target: { name: "Segmento", value: segmento },
                      })
                    }
                  >
                    {segmento}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="input-group">
            <label>Motor</label>
            <input
              type="text"
              name="Motor"
              value={formData.Motor}
              onChange={handleChange}
              placeholder="Ex: 1.9 TDI"
            />
          </div>
          <div className="input-group custom-dropdown">
            <label>Cor</label>
            <input
              type="text"
              name="Cor"
              value={formData.Cor}
              readOnly
              onFocus={() => setMostrarCores(true)}
              onBlur={() => setTimeout(() => setMostrarCores(false), 200)}
              placeholder="Selecione a cor"
              style={{ cursor: "pointer" }}
            />
            {mostrarCores && (
              <ul className="dropdown-options">
                {coresCarros.map((cor) => (
                  <li
                    key={cor}
                    onClick={() =>
                      handleChange({ target: { name: "Cor", value: cor } })
                    }
                  >
                    {cor}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="input-group">
            <label>Cliente</label>
            <input
              type="text"
              list="clientes-list"
              value={clienteSearch}
              onChange={handleClienteSearch}
              placeholder="Pesquise por nome..."
            />
            <input type="hidden" name="ClienteId" value={formData.ClienteId} />
            <datalist id="clientes-list">
              {clienteSearch.length >= 3 &&
                clientes.map((cliente) => (
                  <option
                    key={cliente.ClienteId}
                    value={`${cliente.Nome} - ${cliente.Contacto || "Sem telemóvel"}`}
                  />
                ))}
            </datalist>
          </div>
          <div className="formVehicleButtons">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/carros")}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading
                ? "A processar..."
                : dadosEdicao
                  ? "Atualizar Veículo"
                  : "Criar Veículo"}
            </button>
          </div>
        </section>
      </div>
    </form>
  );
}
export default FormVehicle;
