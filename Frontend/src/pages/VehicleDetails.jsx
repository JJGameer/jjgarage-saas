import { useEffect, useState, useRef } from "react";
import {
  fetchCarrosPorMatricula,
  fetchClientes,
  fetchServicosPorMatricula,
} from "../services/api";
import ServiceCard from "../components/vehicles/ServiceCard";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

function VehicleDetails() {
  const { id } = useParams();
  const [carros, setCarros] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [clientes, setClientes] = useState();
  const [modalOpen, setModalOpen] = useState(false);
  const [revisaoSelecionada, setRevisaoSelecionada] = useState(null);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [incluirObservacoes, setIncluirObservacoes] = useState(() => {
    const guardado = localStorage.getItem("pref_incluir_obs");
    return guardado !== null ? JSON.parse(guardado) : true;
  });
  const navigate = useNavigate();
  const modalRef = useRef(null);

  useEffect(() => {
    fetchCarrosPorMatricula(id).then((data) => {
      //se o backend devolver um array [ {carro} ], pegamos no primeiro. Se devolver o objeto direto, usamos direto.
      setCarros(Array.isArray(data) ? data[0] : data);
    });

    fetchServicosPorMatricula(id).then((data) => setServicos(data));
  }, [id]);

  useEffect(() => {
    fetchClientes().then((data) => {
      setClientes(data);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "pref_incluir_obs",
      JSON.stringify(incluirObservacoes),
    );
  }, [incluirObservacoes]);

  const descarregarPDF = useReactToPrint({
    contentRef: modalRef,
    documentTitle: `Fatura_Servico_${revisaoSelecionada?.TipoServico || "Detalhes"}`,
    pageStyle: `
      @page {
        margin: 15mm;
      }
      @media print {
        .fecharBtn, .btnDownload {
          display: none !important;
        }
        
        .print-no-obs {
          display: none !important;
        }
        
        span {
          margin: 0 20px;
        }

        * {
          font-family: system-ui, -apple-system, Arial, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .modalRow {
          display: flex !important;
          flex-direction: row !important;
          gap: 40px !important;
        }
        .columnLeft, .columnRight {
          flex: 1 !important;
        }

        /* --- A MUDANÇA ESTÁ AQUI --- */
        /* Deixa de ser Grid de 2 colunas, passa a ser uma Lista limpa de 1 coluna */
        .lista-artigos {
          display: block !important; 
          max-height: none !important;
          overflow: visible !important;
          padding-left: 20px !important; /* Espaço para os pontos da lista */
          margin: 0 !important;
        }

        /* Estilo individual de cada linha de artigo */
        .lista-artigos li {
          margin-bottom: 10px !important; /* Espaço entre peças */
          padding-bottom: 6px !important; 
          border-bottom: 1px dashed #dddddd !important; /* Linha tracejada de separação estilo fatura */
          page-break-inside: avoid !important; /* Impede que uma peça seja cortada a meio se mudar de página */
          line-height: 1.5 !important;
        }

        /* Remove a linha tracejada do último item para ficar perfeito */
        .lista-artigos li:last-child {
          border-bottom: none !important;
        }

        /* Estilo limpo da fatura global */
        .modalContent {
          max-width: 800px !important;
          margin: 0 auto !important;
          border: 2px solid #eaeaea !important;
          border-radius: 8px !important;
          padding: 30px !important;
          box-shadow: none !important;
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
        }
      }
    `,
  });

  if (!carros || !clientes) {
    return <p>A carregar detalhes do veículo...</p>;
  }

  const abrirModal = (revisao) => {
    setRevisaoSelecionada(revisao);
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setRevisaoSelecionada(null);
  };

  {
    /*COLOCAR ALGO INTERESSANTE CASO DÊ ERRO*/
  }
  const imagemFinal = carros.ImagemUrl || "../assets/img/logo2.png";
  /*Encontrar dono do carro*/
  const donoCarro = clientes.find((c) => c.ClienteId === carros.ClienteId);

  return (
    <div className="container">
      <h1>Detalhes do Veículo</h1>
      <div className="layoutVehicle">
        <div className="columnLeft">
          <section className="sectionDetailsVehicle">
            <figure>
              <img
                src={imagemFinal}
                alt={`Fotografia de ${carros.Marca} ${carros.Modelo}`}
              />
            </figure>
            <div className="detailsVehicle">
              <h2>{carros.MatriculaId}</h2>
              <button
                onClick={() => navigate(`/carros/editar/${carros.MatriculaId}`)}
              >
                Editar
              </button>
            </div>
          </section>
          <section className="sectionDetailsVehicleV2">
            <div className="detailsVehicleV2">
              <h4>Marca: {carros.Marca}</h4>
              <h4>Modelo: {carros.Modelo}</h4>
              <h4>Ano: {carros.Ano}</h4>
              <h4>VIN: {carros.Vin}</h4>
              <h4>Cliente: {donoCarro ? donoCarro.Nome : "Desconhecido"} </h4>
            </div>
          </section>
        </div>
        <div className="columnRight">
          <h2>Histórico de Serviços</h2>
          <section className="sectionRevisions">
            {servicos.length > 0 ? (
              [...servicos]
                .sort(
                  (a, b) => new Date(b.DataServico) - new Date(a.DataServico),
                )
                .map((servico) => (
                  <ServiceCard
                    onClick={() => abrirModal(servico)}
                    key={servico.ServicoId}
                    dados={servico}
                  />
                ))
            ) : (
              <p>Sem serviços registados.</p>
            )}
          </section>
        </div>
      </div>
      {modalOpen && revisaoSelecionada && (
        <div className="modalRevisao" onClick={fecharModal}>
          <div
            className="modalContent"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="fecharBtn" onClick={fecharModal}>
              X
            </button>
            <h2>Detalhes do Serviço - {revisaoSelecionada.TipoServico}</h2>
            <p>
              Cliente: {donoCarro ? donoCarro.Nome : "Desconhecido"}
              <span></span> Veículo: {carros.MatriculaId}
            </p>
            <div className="modalRow">
              <div className="columnLeft">
                <h3>Informações do Serviço</h3>
                <p>
                  Data:{" "}
                  {new Date(revisaoSelecionada.DataServico).toLocaleDateString(
                    "pt-PT",
                  )}
                </p>
                <p>Kilómetros: {revisaoSelecionada.Kilometros} km</p>
                <p>Estado: {revisaoSelecionada.Status}</p>
                <p>
                  <strong>Custo Total: </strong>
                  {revisaoSelecionada.PrecoFinal || "Nenhum preço registado"} €
                </p>
              </div>
              <div className="columnRight">
                <h3>Artigos Incluídos</h3>

                {revisaoSelecionada.Artigos ? (
                  <ul className="lista-artigos">
                    {revisaoSelecionada.Artigos.split("\n").map(
                      (item, index) =>
                        item.trim() !== "" && <li key={index}>{item}</li>,
                    )}
                  </ul>
                ) : (
                  <p>Nenhum artigo registado.</p>
                )}
              </div>
            </div>
            {/* As observações estão agora protegidas pelo modal principal, evitando o erro de "null" */}
            <div
              className={`columnBottom ${!incluirObservacoes ? "print-no-obs" : ""}`}
            >
              <div>
                <h4>Observações do Mecânico</h4>
                <p>
                  {revisaoSelecionada.Observacao ||
                    "Nenhuma observação foi registada"}
                </p>
              </div>
            </div>
            {revisaoSelecionada.Anexos &&
              (() => {
                try {
                  // Faz o parse caso venha como String JSON da BD
                  const listaAnexos =
                    typeof revisaoSelecionada.Anexos === "string"
                      ? JSON.parse(revisaoSelecionada.Anexos)
                      : revisaoSelecionada.Anexos;

                  if (listaAnexos.length > 0) {
                    return (
                      <div className="modalAnexosHistory print-no-media">
                        <h3>Anexos e Registos Visuais</h3>
                        <div className="anexosHistoryGrid">
                          {listaAnexos.map((url, idx) => {
                            const extensao = url.split(".").pop().toLowerCase();
                            const esImagem = [
                              "jpg",
                              "jpeg",
                              "png",
                              "gif",
                              "webp",
                            ].includes(extensao);
                            const esVideo = [
                              "mp4",
                              "webm",
                              "ogg",
                              "mov",
                            ].includes(extensao);
                            const esPdf =
                              url.toLowerCase().endsWith(".pdf") ||
                              /\.pdf(\?|$)/i.test(url.toLowerCase());

                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={idx}
                                className="anexoHistoryCard"
                              >
                                <div className="anexoPreviewBox">
                                  {esImagem ? (
                                    <img
                                      src={url}
                                      alt={`Anexo do serviço ${idx + 1}`}
                                    />
                                  ) : esPdf ? (
                                    <iframe
                                      src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
                                      className="pdf-thumbnail-iframe"
                                      title={`PDF Preview ${idx + 1}`}
                                    />
                                  ) : esVideo ? (
                                    <div className="mediaIconPlaceholder">
                                      🎥
                                    </div>
                                  ) : (
                                    <div className="mediaIconPlaceholder">
                                      📄
                                    </div>
                                  )}
                                </div>
                                <div className="anexoCardFooter">
                                  <span>
                                    {esImagem
                                      ? "Imagem"
                                      : esPdf
                                        ? "PDF"
                                        : esVideo
                                          ? "Vídeo"
                                          : "Documento"}{" "}
                                    {idx + 1}
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error(
                    "Erro ao processar os anexos do serviço selecionado",
                    e,
                  );
                }
                return null;
              })()}
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btnDownload"
                onClick={() => setOptionsModalOpen(true)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Descarregar Fatura (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Opções de Impressão */}
      {optionsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-content">
              <div className="modal-icon info">i</div>
              <h2 className="modal-title">Configurar PDF</h2>
              <p className="modal-message">
                Deseja incluir as observações do mecânico no documento?
              </p>

              <div
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <label
                  className="checkbox-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    fontSize: "1.3rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={incluirObservacoes}
                    onChange={(e) => setIncluirObservacoes(e.target.checked)}
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span>Sim, incluir observações</span>
                </label>
              </div>

              <div className="modal-actions-rightt">
                <button
                  className="btn-cancel"
                  onClick={() => setOptionsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  onClick={() => {
                    setOptionsModalOpen(false);
                    setTimeout(() => descarregarPDF(), 300);
                  }}
                >
                  Gerar Fatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleDetails;
