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
              <h4>VIN: {carros.VIN}</h4>
              <h4>Cliente: {donoCarro ? donoCarro.Nome : "Desconhecido"} </h4>
            </div>
          </section>
        </div>
        <div className="columnRight">
          <h2>Histórico de Serviços</h2>
          <section className="sectionRevisions">
            {servicos.length > 0 ? (
              servicos.map((servico) => (
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
            <div className="columnBottom">
              <div>
                <h4>Observações do Mecânico</h4>
                <p>
                  {revisaoSelecionada.Observacao ||
                    "Nenhuma observação foi registada"}
                </p>
              </div>
            </div>
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button className="btnDownload" onClick={descarregarPDF}>
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
    </div>
  );
}

export default VehicleDetails;
