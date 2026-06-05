import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addServico, fetchCarros, updateServico } from "../../services/api";
import { useModal } from "../../context/ModalContext";

function FormService({ dadosEdicao }) {
  const navigate = useNavigate();
  const [carros, setCarros] = useState([]);
  const [novoArtigoNome, setNovoArtigoNome] = useState("");
  const [novoArtigoPreco, setNovoArtigoPreco] = useState("");
  const [novoArtigoQuantidade, setNovoArtigoQuantidade] = useState(1);
  const [novoArtigoOferta, setNovoArtigoOferta] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showModal, hideModal } = useModal();
  const [listaArtigos, setListaArtigos] = useState(
    dadosEdicao?.Artigos ? dadosEdicao.Artigos.split("\n") : [],
  );
  const [ficheiros, setFicheiros] = useState([]);
  const [erroAnexos, setErroAnexos] = useState("");
  const fileInputRef = useRef(null);

  const MAX_ANEXOS = 20;

  const validarAnexos = (oldCount, newCount) => {
    const total = oldCount + newCount;
    if (total > MAX_ANEXOS) {
      setErroAnexos(
        "Limite de 20 anexos excedido. Por favor, remova alguns ficheiros para conseguir guardar.",
      );
      return false;
    }

    setErroAnexos("");
    return true;
  };

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
    validarAnexos(anexosAntigos.length, ficheiros.length);
  }, [anexosAntigos.length, ficheiros.length]);

  useEffect(() => {
    fetchCarros()
      .then((data) => {
        setCarros(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar veículos", err);
      });
  }, []);

  useEffect(() => {
    const total = listaArtigos.reduce((acc, artigo) => {
      try {
        const partes = artigo.split(" - ");
        const partePrecoFinal = partes[1].trim();

        // 🌟 SE FOR OFERTA, não soma nada ao custo total (soma 0)
        if (partePrecoFinal.includes("OFERTA")) {
          return acc + 0;
        }

        // Se for um artigo normal, calcula o preço como já fazias
        const valorLinha = parseFloat(partePrecoFinal.replace("€", ""));
        return acc + valorLinha;
      } catch (e) {
        return acc;
      }
    }, 0);

    setFormData((prev) => ({ ...prev, PrecoFinal: total.toFixed(2) }));
  }, [listaArtigos]);

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
      const precoNum = parseFloat(novoArtigoPreco);
      const qtdNum = parseFloat(novoArtigoQuantidade);

      // 🌟 Se for oferta, o fim da string passa a ser "OFERTA", caso contrário calcula o subtotal
      const sufixoPrecoFinal = novoArtigoOferta
        ? "OFERTA"
        : `${(precoNum * qtdNum).toFixed(2)}€`;

      const artigoFormatado = `${qtdNum} x ${novoArtigoNome.trim()} (${precoNum.toFixed(2)}€/un ) - ${sufixoPrecoFinal}`;

      setListaArtigos([...listaArtigos, artigoFormatado]);

      // Reset aos campos
      setNovoArtigoNome("");
      setNovoArtigoPreco("");
      setNovoArtigoQuantidade(1);
      setNovoArtigoOferta(false);
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

    try {
      const [qtdPart, resto] = artigoCompleto.split(" x ");
      const [detalhesArtigo, precoPart] = resto.split(" - ");

      // 🌟 Deteta se era uma oferta olhando para o fim da string
      const esOferta = precoPart.trim() === "OFERTA";

      // Isola o nome eliminando os parênteses do preço unitário
      const indexParentese = detalhesArtigo.indexOf(" (");
      const nomeLimpo =
        indexParentese !== -1
          ? detalhesArtigo.substring(0, indexParentese).trim()
          : detalhesArtigo.trim();

      // Recupera o preço original que estava guardado dentro dos parênteses (ex: 17.00)
      const precoUnitarioRaw = detalhesArtigo.match(/\(([^)]+)€\/un/);
      const preco = precoUnitarioRaw ? precoUnitarioRaw[1].trim() : "0.00";

      setNovoArtigoQuantidade(parseFloat(qtdPart));
      setNovoArtigoNome(nomeLimpo);
      setNovoArtigoPreco(preco); // 🌟 Devolve o preço original (17.00) ao input, mesmo sendo oferta!
      setNovoArtigoOferta(esOferta);

      removerArtigo(index);
    } catch (error) {
      console.error("Erro ao editar o artigo:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFicheiros((prev) => [...prev, ...selectedFiles]);
  };

  const removerFicheiro = (indexParaRemover) => {
    setFicheiros((prev) =>
      prev.filter((_, index) => index !== indexParaRemover),
    );
  };

  const removerAnexoAntigo = (indexParaRemover) => {
    setAnexosAntigos((prev) =>
      prev.filter((_, index) => index !== indexParaRemover),
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

    if (erroAnexos) {
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
              disabled={!!dadosEdicao?.ServicoId}
              className={dadosEdicao?.ServicoId ? "input-bloqueado" : ""}
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

          <div className="input-group">
            <label>Artigos / Peças Utilizadas</label>
            <div className="artigos-input-row">
              <input
                type="number"
                className="input-artigo-qtd"
                value={novoArtigoQuantidade}
                onChange={(e) => setNovoArtigoQuantidade(e.target.value)}
                placeholder="Qtd"
                min="1"
              />
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
                  onChange={(e) => {
                    const val = e.target.value;
                    // Se o valor for menor que zero (copiado/colado por exemplo), força a ficar vazio ou zero
                    if (parseFloat(val) < 0) {
                      setNovoArtigoPreco("");
                    } else {
                      setNovoArtigoPreco(val);
                    }
                  }}
                  placeholder="56.00"
                  step="0.01"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e" || e.key === "E") {
                      e.preventDefault();
                    }

                    // Mantém a tua lógica original para adicionar com o Enter
                    if (e.key === "Enter") {
                      e.preventDefault();
                      adicionarArtigo();
                    }
                  }}
                />
                <span className="simbolo-moeda">€</span>
              </div>
              <div>
                <label
                  className={`btn-toggle-oferta ${novoArtigoOferta ? "is-active" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={novoArtigoOferta}
                    onChange={(e) => setNovoArtigoOferta(e.target.checked)}
                  />
                  Oferta
                </label>
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
                    {/*link temporário para permitir abrir a foto antes de enviar */}
                    <a
                      href={URL.createObjectURL(file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="new-anexo-link"
                    >
                      {file.name.substring(0, 15)}...
                    </a>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removerFicheiro(idx);
                      }}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Custo Final do Serviço</label>
            <div className="input-preco-wrapper-2">
              <input
                type="number"
                step="0.01"
                name="PrecoFinal"
                value={formData.PrecoFinal}
                onChange={handleChange}
                placeholder="Ex: 150.00"
                disabled
              />
            </div>
          </div>
          {erroAnexos && <div className="alert-error">{erroAnexos}</div>}
          <div className="formVehicleButtons">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/carros/status")}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading || Boolean(erroAnexos)}
            >
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
