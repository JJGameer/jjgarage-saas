import VehicleCardV1 from "../components/vehicles/VehicleCardV1.jsx";
import { fetchCarros, fetchCarrosPorStatus } from "../services/api.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function VehiclePage() {
  const [carros, setCarros] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const carrosFiltrados =
    carros && Array.isArray(carros)
      ? carros.filter((carro) => {
          const termoMinusculo = searchTerm.toLowerCase();
          return (
            carro.MatriculaId?.toLowerCase().includes(termoMinusculo) ||
            carro.Modelo?.toLowerCase().includes(termoMinusculo)
          );
        })
      : [];

  useEffect(() => {
    fetchCarros()
      .then((data) => {
        console.log("Os dados foram carregados", data);
        setCarros(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar veículos", err);
      });
  }, []);

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
        <button onClick={() => navigate("/carros/adicionar")}>
          Adicionar Veículo
        </button>
      </div>
      <div className="fleet-grid">
        {carrosFiltrados.length > 0 ? (
          carrosFiltrados.map((carro) => (
            <VehicleCardV1 key={carro.CarroId} dados={carro} />
          ))
        ) : (
          <p>Nenhum veículo encontrado para {searchTerm} </p>
        )}
      </div>
    </div>
  );
}

export default VehiclePage;
