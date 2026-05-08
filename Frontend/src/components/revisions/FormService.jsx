import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addServico, fetchCarros, updateServico } from "../../services/api";
import { useModal } from "../../context/ModalContext";

function FormService({ dadosEdicao }) {
  const navigate = useNavigate();
  const [carros, setCarros] = useState([]);
  const [novoArtigoNome, setNovoArtigoNome] = useState("");
  const [novoArtigoPreco, setNovoArtigoPreco] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showModal, hideModal } = useModal();
  const [listaArtigos, setListaArtigos] = useState(
    dadosEdicao?.Artigos ? dadosEdicao.Artigos.split("\n") : [],
  );
  const [ficheiros, setFicheiros] = useState([]);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    Observacao: dadosEdicao?.Observacao || "",
    Status: dadosEdicao?.Status || "",
    Artigos: dadosEdicao?.Artigos || "",
    TipoServico: dadosEdicao?.TipoServico || "",
    DataServico: dadosEdicao?.DataServico
      ? dadosEdicao.DataServico.split("T")[0]
      : new Date().toISOString().split("T")[0],
    Kilometros: dadosEdicao?.Kilometros || "",
    MatriculaId: dadosEdicao?.MatriculaId || "",
    PrecoFinal: dadosEdicao?.PrecoFinal || "",
  });

  const [anexosAntigos, setAnexosAntigos] = useState(() => {
    if (dadosEdicao?.Anexos) {
      try {
        // Verifica se já é um array ou se precisa de parse (converte string JSON para Array)
        return typeof dadosEdicao.Anexos === "string"
          ? JSON.parse(dadosEdicao.Anexos)
          : dadosEdicao.Anexos;
      } catch (e) {
        console.error("Erro ao ler anexos antigos", e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    fetchCarros()
      .then((data) => {
        setCarros(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar veículos", err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  //função para adicionar artigo à lista
  const adicionarArtigo = () => {
    if (novoArtigoNome.trim() !== "" && novoArtigoPreco.trim() !== "") {
      const artigoFormatado = `${novoArtigoNome.trim()} - ${novoArtigoPreco.trim()}€`;

      setListaArtigos([...listaArtigos, artigoFormatado]);

      setNovoArtigoNome("");
      setNovoArtigoPreco("");
    } else {
      showModal({
        type: "info",
        title: "Atenção",
        message:
          "Por favor, preencha o nome da peça e o preço antes de adicionar.",
      });
    }
  };

  //função para remover artigo da lista
  const removerArtigo = (indexParaRemover) => {
    setListaArtigos(
      listaArtigos.filter((_, index) => index !== indexParaRemover),
    );
  };

  // Função para editar um artigo
  const editarArtigo = (index) => {
    const artigoCompleto = listaArtigos[index];

    // Procura o último " - " para separar corretamente, caso o nome da peça também tenha um traço (ex: "Óleo 10W-40")
    const lastDashIndex = artigoCompleto.lastIndexOf(" - ");

    if (lastDashIndex !== -1) {
      // Extrai o nome e o preço
      const nome = artigoCompleto.substring(0, lastDashIndex).trim();
      let preco = artigoCompleto.substring(lastDashIndex + 3).trim();

      // Retira o símbolo "€" para ficar apenas o número limpo no input
      preco = preco.replace("€", "");

      // Coloca os valores de volta nos inputs
      setNovoArtigoNome(nome);
      setNovoArtigoPreco(preco);

      // Remove da lista (pois agora está "em edição" nas caixas de texto)
      removerArtigo(index);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFicheiros((prev) => [...prev, ...selectedFiles]);
  };

  const removerFicheiro = (indexParaRemover) => {
    setFicheiros(ficheiros.filter((_, index) => index !== indexParaRemover));
  };

  const removerAnexoAntigo = (indexParaRemover) => {
    setAnexosAntigos(
      anexosAntigos.filter((_, index) => index !== indexParaRemover),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLoading) return;

    const regrasValidacao = [
      { chave: "MatriculaId", nome: "Matrícula" },
      { chave: "TipoServico", nome: "Tipo Serviço" },
      { chave: "Status", nome: "Status" },
    ];

    for (let regra of regrasValidacao) {
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

    const carroSelecionado = carros.find(
      (c) => c.MatriculaId === formData.MatriculaId,
    );

    // e for um serviço novo e a matrícula escrita não existir na base de dados
    if (!dadosEdicao?.ServicoId && !carroSelecionado) {
      showModal({
        type: "error",
        title: "Veículo não encontrado",
        message:
          "A matrícula inserida não existe. Por favor, selecione uma matrícula válida da lista.",
      });
      return;
    }

    setIsLoading(true);

    const formDataEnvio = new FormData();
    const idCarroDefinitivo = carroSelecionado
      ? carroSelecionado.CarroId
      : dadosEdicao?.CarroId;

    formDataEnvio.append("CarroId", idCarroDefinitivo);
    formDataEnvio.append("Artigos", listaArtigos.join("\n"));
    formDataEnvio.append("Observacao", formData.Observacao);
    formDataEnvio.append("Status", formData.Status);
    formDataEnvio.append("TipoServico", formData.TipoServico);
    formDataEnvio.append("DataServico", formData.DataServico);
    formDataEnvio.append("Kilometros", formData.Kilometros);
    formDataEnvio.append("PrecoFinal", formData.PrecoFinal);
    formDataEnvio.append("AnexosAntigos", JSON.stringify(anexosAntigos));

    ficheiros.forEach((file) => {
      formDataEnvio.append("ficheiros", file);
    });

    const pedidoApi = dadosEdicao?.ServicoId
      ? updateServico(dadosEdicao.ServicoId, formDataEnvio)
      : addServico(formDataEnvio);

    pedidoApi
      .then(() => {
        showModal({
          type: "success",
          title: dadosEdicao?.ServicoId
            ? "Serviço Atualizado!"
            : "Serviço Criado",
          message: dadosEdicao?.ServicoId
            ? "Serviço atualizado com sucesso!"
            : "O serviço foi criado e associado ao veículo com sucesso!",
        });

        setTimeout(() => {
          hideModal();
          navigate("/carros/status");
        }, 1500);
      })
      .catch((err) => {
        console.error("Erro ao processar serviço", err);
        showModal({
          type: "error",
          title: "Atenção",
          message:
            err.message || "Ocorreu um erro inesperado ao guardar os dados.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="form-container-card formService">
      <div className="formService-layout">
        {/* ================= COLUNA ESQUERDA ================= */}
        <div className="leftColumn">
          <div className="input-group">
            <label>Matrícula</label>
            <input
              type="text"
              name="MatriculaId"
              list="carros-list"
              value={formData.MatriculaId}
              onChange={handleChange}
              placeholder="Pesquise a matrícula..."
            />
            <datalist id="carros-list">
              {carros.map((carro) => (
                <option key={carro.CarroId} value={carro.MatriculaId}>
                  {carro.Marca} {carro.Modelo}
                </option>
              ))}
            </datalist>
          </div>

          <div className="input-group">
            <label>Data</label>
            <input
              type="date"
              name="DataServico"
              value={formData.DataServico}
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Kilómetros</label>
            <input
              type="number"
              step="0.01"
              name="Kilometros"
              value={formData.Kilometros}
              onChange={handleChange}
              placeholder="Ex: 125000"
            />
          </div>

          <div className="input-group artigos-section">
            <label>Artigos / Peças Utilizadas</label>
            <div className="artigos-input-row">
              <input
                type="text"
                className="input-artigo-nome"
                value={novoArtigoNome}
                onChange={(e) => setNovoArtigoNome(e.target.value)}
                placeholder="Ex: Filtro de Óleo"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
              />
              <div className="input-preco-wrapper">
                <input
                  type="number"
                  className="input-artigo-preco"
                  value={novoArtigoPreco}
                  onChange={(e) => setNovoArtigoPreco(e.target.value)}
                  placeholder="56.00"
                  step="0.01" /* Permite cêntimos */
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarArtigo();
                    }
                  }}
                />
                <span className="simbolo-moeda">€</span>
              </div>
              <button
                type="button"
                className="btn-add-artigo"
                onClick={adicionarArtigo}
              >
                +
              </button>
            </div>
            <div className="artigosAcumulados">
              {listaArtigos.map((artigo, index) => (
                <div className="removeArticle" key={index}>
                  <span>{artigo}</span>
                  <div className="artigo-actions">
                    <button
                      type="button"
                      className="btn-edit-artigo"
                      onClick={() => editarArtigo(index)}
                      title="Editar artigo"
                    >
                      <svg
                        width="12px"
                        height="12px"
                        viewBox="0 0 22 22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn-delete-artigo"
                      onClick={() => removerArtigo(index)}
                      title="Remover artigo"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ================= COLUNA DIREITA ================= */}
        <div className="rightColumn">
          <div className="formRow">
            <div className="input-group">
              <label>Tipo Serviço</label>
              <input
                type="text"
                name="TipoServico"
                value={formData.TipoServico}
                onChange={handleChange}
                placeholder="Ex: Revisão Geral"
              />
            </div>

            <div className="input-group">
              <label className="inputStatus">Status</label>
              <select
                name="Status"
                value={formData.Status}
                onChange={handleChange}
                className="select-status"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                <option value="Pendente">Pendente</option>
                <option value="Em Reparação">Em Reparação</option>
                <option value="À Espera de Peças">À Espera de Peças</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Observações</label>
            <textarea
              name="Observacao"
              value={formData.Observacao}
              onChange={handleChange}
              placeholder="Detalhes adicionais sobre o serviço..."
              rows="5"
            ></textarea>
          </div>

          <div
            className="input-group upload-section"
            onClick={() => fileInputRef.current.click()}
          >
            <label>Anexar Ficheiros</label>
            <p>Clique ou Arraste vídeos, fotografias ou ficheiros</p>
            <input
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              ref={fileInputRef}
              className="hidden-file-input"
              onChange={handleFileChange}
            />
          </div>

          {/* Pré-visualização dos Anexos Antigos (Já gravados) */}
          {anexosAntigos.length > 0 && (
            <div className="input-group anexos-preview-group">
              <label className="anexos-preview-label">Anexos Guardados:</label>
              <div className="preview-ficheiros">
                {anexosAntigos.map((url, idx) => (
                  <div key={`old-${idx}`} className="preview-item old-anexo">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="old-anexo-link"
                    >
                      Ver Anexo {idx + 1}
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removerAnexoAntigo(idx);
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pré-visualização dos Novos Ficheiros */}
          {ficheiros.length > 0 && (
            <div className="input-group anexos-preview-group">
              <label className="anexos-preview-label">
                Novos Anexos a Guardar:
              </label>
              <div className="preview-ficheiros">
                {ficheiros.map((file, idx) => (
                  <div key={`new-${idx}`} className="preview-item">
                    <span>{file.name.substring(0, 15)}...</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removerFicheiroNovo(idx);
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-group custo-final-group">
            <label>Custo Final do Serviço (€)</label>
            <input
              type="number"
              step="0.01"
              name="PrecoFinal"
              value={formData.PrecoFinal}
              onChange={handleChange}
              placeholder="Ex: 150.00"
            />
          </div>
          <div className="formVehicleButtons">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/carros/status")}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={isLoading}>
              {isLoading
                ? "A processar..."
                : dadosEdicao?.ServicoId
                  ? "Atualizar Serviço"
                  : "Criar Serviço"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default FormService;
