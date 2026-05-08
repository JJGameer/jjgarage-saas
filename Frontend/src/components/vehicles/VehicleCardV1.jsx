import { useNavigate } from "react-router-dom";
import { getVehicleImage } from "../../utils/vehicleHelpers";

function VehicleCardV1({ dados }) {
  const navigate = useNavigate();
  const imagemFinal = dados.ImagemUrl || "../assets/img/tesla.png";

  const getStatusCard = (status) => {
    switch (status) {
      case "Pendente":
        return "status-pendente";
      case "Em Reparação":
        return "status-reparacao";
      case "À Espera de Peças":
        return "status-pecas";
      case "Concluído":
        return "status-concluido";
      default:
        return "";
    }
  };

  const handleClick = (e) => {
    if (e.target.tagName === "BUTTON") {
      e.preventDefault();
      navigate(`/servicos/editar/${dados.ServicoId}`);
    } else {
      navigate(`/carros/${dados.CarroId}`);
    }
  };

  return (
    <div onClick={handleClick}>
      <div className="cardVehicle">
        <article className="articleVehicle">
          <img src={imagemFinal} alt={`Carro ${dados.Marca} ${dados.Modelo}`} />
          <h2>{dados.MatriculaId}</h2>
          <h3>
            {" "}
            {dados.Marca} {dados.Modelo} - {dados.Motor}
          </h3>
          {dados.Status && (
            <button className={`status-button ${getStatusCard(dados.Status)}`}>
              {dados.Status}
            </button>
          )}
        </article>
      </div>
    </div>
  );
}

export default VehicleCardV1;
