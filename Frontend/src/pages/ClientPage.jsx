import { useState, useEffect } from "react";
import {
  addCliente,
  fetchClientes,
  updateCliente,
  deleteCliente,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import { useModal } from "../context/ModalContext";

function ClientPage() {
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null);
  const navigate = useNavigate();
  const { showModal, hideModal } = useModal();
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [clienteParaEliminar, setClienteParaEliminar] = useState(null);
  const clientesPorPagina = 8;

  const [formData, setFormData] = useState({
    Nome: "",
    Contacto: "",
    Morada: "",
  });

  useEffect(() => {
    fetchClientes()
      .then((data) => {
        console.log("Os dados foram carregados", data);
        setClientes(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar clientes", err);
      });
  }, []);

  {
    /*
    OTIMIZAR HANDLECHANGE PARA COLOCAR no utils
  */
  }
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPaginaAtual(1);
  };

  const fecharModal = () => {
    setShowClientModal(false);
  };

  const handleNovoCliente = () => {
    setIdEdicao(null);
    setFormData({
      Nome: "",
      Contacto: "",
      Morada: "",
    });
    setShowClientModal(true);
  };

  const handleEditarCliente = (cliente) => {
    setIdEdicao(cliente.ClienteId);
    setFormData({
      Nome: cliente.Nome,
      Contacto: cliente.Contacto,
      Morada: cliente.Morada,
    });
    setShowClientModal(true);
  };

  const confirmarEliminacao = () => {
    if (!clienteParaEliminar) return;

    deleteCliente(clienteParaEliminar.ClienteId)
      .then(() => {
        showModal({
          type: "success",
          title: "Cliente Eliminado",
          message: "O cliente foi removido da sua base de dados com sucesso.",
        });
        setClienteParaEliminar(null);
        fetchClientes().then((data) => {
          setClientes(data);
          setPaginaAtual(1);
        });
      })
      .catch((err) => {
        showModal({
          type: "error",
          title: "Não foi possível eliminar",
          message: err.message,
        });
        setClienteParaEliminar(null);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (idEdicao) {
      updateCliente(idEdicao, formData)
        .then(() => {
          showModal({
            type: "success",
            title: "Cliente Atualizado",
            message: "Os dados do seu cliente foram atualizados corretamente.",
          });
          fecharModal();
          fetchClientes().then((data) => setClientes(data));
        })
        .catch((err) => {
          console.error("Erro ao atualizar", err);
          showModal({
            type: "error",
            title: "Erro ao atualizar os clientes",
            message:
              "Verifique se os dados do seu cliente foram atualizados corretamente.",
          });
        });
    } else {
      addCliente(formData)
        .then(() => {
          showModal({
            type: "success",
            title: "Cliente Criado",
            message: "O seu cliente foi inserido corretamente.",
          });
          fecharModal();
          fetchClientes().then((data) => setClientes(data));
        })
        .catch((err) => {
          console.error("Erro ao criar", err);
          showModal({
            type: "error",
            title: "Erro ao criar o cliente",
            message:
              "Verifique se os dados do seu cliente foram inseridos corretamente.",
          });
        });
    }
  };

  const clientesFiltrados =
    clientes && Array.isArray(clientes)
      ? clientes.filter((cliente) => {
          const termoPesquisa = searchTerm.toLowerCase();
          const nomeInclui =
            cliente.Nome?.toLowerCase().includes(termoPesquisa);
          const contactoInclui =
            cliente.Contacto?.toLowerCase().includes(termoPesquisa);
          return nomeInclui || contactoInclui;
        })
      : [];
  // --- LÓGICA DE PAGINAÇÃO ---
  // Calcula o total de páginas
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  // Descobre onde começa e acaba o corte no array
  const indiceUltimoCliente = paginaAtual * clientesPorPagina;
  const indicePrimeiroCliente = indiceUltimoCliente - clientesPorPagina;

  // Os clientes que vão realmente aparecer na tabela
  const clientesAtuais = clientesFiltrados.slice(
    indicePrimeiroCliente,
    indiceUltimoCliente,
  );

  // Funções para os botões de navegação
  const paginaAnterior = () => setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const paginaSeguinte = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
  const irParaPagina = (numero) => setPaginaAtual(numero);

  return (
    <div className="container">
      <header>
        <h1>Clientes</h1>
        <p>Gerenciamento e pesquisas dos seus clientes</p>
      </header>
      <div className="clientActions">
        <div className="searchWrapperClient">
          <svg
            className="searchIcon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button onClick={handleNovoCliente}>Novo Cliente</button>
      </div>
      <div className="tableContainer">
        <table className="clientTable">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Veículos</th>
              <th>Contacto</th>
              <th>Morada</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientesAtuais.map((cliente) => (
              <tr key={cliente.ClienteId}>
                <td>{cliente.Nome}</td>
                <td>
                  {cliente.Matriculas ? (
                    <div className="matriculas-badges">
                      {cliente.Matriculas.split(", ").map((item, index) => {
                        // Separamos o ID da Matrícula
                        const [carroId, matriculaTexto] = item.split(":");

                        return (
                          <span
                            key={index}
                            className="badge-matricula"
                            onClick={() => navigate(`/carros/${carroId}`)}
                          >
                            {matriculaTexto}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span>Sem veículos</span>
                  )}
                </td>
                <td>{cliente.Contacto}</td>
                <td>{cliente.Morada}</td>
                <td className="buttonsClient">
                  <svg
                    onClick={() => handleEditarCliente(cliente)}
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 10L14 6M2.49997 21.5L5.88434 21.124C6.29783 21.078 6.50457 21.055 6.69782 20.9925C6.86926 20.937 7.03242 20.8586 7.18286 20.7594C7.35242 20.6475 7.49951 20.5005 7.7937 20.2063L21 7C22.1046 5.89543 22.1046 4.10457 21 3C19.8954 1.89543 18.1046 1.89543 17 3L3.7937 16.2063C3.49952 16.5005 3.35242 16.6475 3.24061 16.8171C3.1414 16.9676 3.06298 17.1307 3.00748 17.3022C2.94493 17.4954 2.92195 17.7021 2.87601 18.1156L2.49997 21.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <svg
                    onClick={() => setClienteParaEliminar(cliente)}
                    className="icon-delete"
                    width="15px"
                    height="15px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11.5V16.5M14 11.5V16.5M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="pagination-info">
          A mostrar {Math.min(indiceUltimoCliente, clientesFiltrados.length)} de{" "}
          {clientesFiltrados.length} clientes
        </span>

        {totalPaginas > 1 && (
          <div className="pagination-controls">
            <button
              className={`page-btn ${paginaAtual === 1 ? "disabled" : ""}`}
              onClick={paginaAnterior}
              disabled={paginaAtual === 1}
            >
              Anterior
            </button>
            {/* Cria os botões com os números das páginas automaticamente */}
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
              (numero) => (
                <button
                  key={numero}
                  className={`page-btn ${paginaAtual === numero ? "active" : ""}`}
                  onClick={() => irParaPagina(numero)}
                >
                  {numero}
                </button>
              ),
            )}

            <button
              className={`page-btn ${paginaAtual === totalPaginas ? "disabled" : ""}`}
              onClick={paginaSeguinte}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima
            </button>
          </div>
        )}
      </div>
      {showClientModal && (
        <div className="modalOverlay" onClick={fecharModal}>
          <div className="modalAddClient" onClick={(e) => e.stopPropagation()}>
            <div className="headerModal">
              <div>
                <img src="../assets/img/modal.png" alt="Ilustração" />
              </div>
              <h2>Novo Cliente</h2>
              <p>Preencha os dados para criar um novo cliente.</p>
              <div className="blue-line"></div>
              <form onSubmit={handleSubmit}>
                <div className="formSection">
                  <div className="formSectionTitle">
                    <span>Dados Pessoais</span>
                  </div>
                  <div className="formRow">
                    <div className="formRowGroup">
                      <label>Nome Completo</label>
                      <input
                        type="text"
                        name="Nome"
                        value={formData.Nome}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="formRowGroup">
                    <label>Contacto Telefónico</label>
                    <input
                      type="tel"
                      name="Contacto"
                      value={formData.Contacto}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="formSection">
                  <div className="formSectionTitle">
                    <span>Endereço</span>
                  </div>
                  <div className="formSectionFullWidth">
                    <label>Morada Completa</label>
                    <div>
                      <input
                        type="text"
                        name="Morada"
                        value={formData.Morada}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={fecharModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-save">
                    Guardar Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {clienteParaEliminar && (
        <div
          className="modalOverlay"
          onClick={() => setClienteParaEliminar(null)}
        >
          <div
            className="modalConfirmation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="icon-warning-wrapper">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2>Eliminar Cliente</h2>
            <p>
              Tem a certeza que deseja eliminar o cliente{" "}
              <strong>{clienteParaEliminar.Nome}</strong>?
            </p>
            <p className="warning-text">Esta ação é irreversível.</p>

            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setClienteParaEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-delete"
                onClick={confirmarEliminacao}
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientPage;
