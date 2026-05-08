import { use, useEffect, useState } from "react";
import { fetchCarrosPorStatus } from "../services/api";
import VehicleCardV1 from "../components/vehicles/VehicleCardV1";
import { useNavigate } from "react-router-dom";

function ServicePage() {
  const [servicos, setServicos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchCarrosPorStatus()
      .then((data) => {
        console.log("Dados recebidos:", data);
        setServicos(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar veículos por status", err);
      });
  }, []);

  const servicosFiltrados =
    servicos && Array.isArray(servicos)
      ? servicos.filter((servico) => {
          const termoMinusculo = searchTerm.toLowerCase();
          return (
            servico.MatriculaId?.toLowerCase().includes(termoMinusculo) ||
            servico.Modelo?.toLowerCase().includes(termoMinusculo)
          );
        })
      : [];

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container">
      <div className="findVehicle">
        <div className="searchWrapper">
          <input
            type="text"
            placeholder="Faça a pesquisa do veículo que procura"
            value={searchTerm}
            onChange={handleSearch}
          />
          <img src="../assets/img/Search.png" alt="Lupa" />
        </div>
        <button onClick={() => navigate("/servicos/adicionar")}>
          Novo Serviço
        </button>
      </div>
      <div className="fleet-grid">
        {servicosFiltrados.length > 0 ? (
          servicosFiltrados.map((servico) => (
            <VehicleCardV1 key={servico.ServicoId} dados={servico} />
          ))
        ) : (
          <p>Nenhum veículo em reparação de momento.</p>
        )}
      </div>
    </div>
  );
}

export default ServicePage;
