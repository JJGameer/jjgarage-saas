import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormVehicle from "../components/vehicles/FormVehicle";
import { fetchCarrosPorMatricula } from "../services/api";

function EditVehiclePage() {
  const { id } = useParams(); // Vai buscar a matrícula à URL
  const [carro, setCarro] = useState(null);

  useEffect(() => {
    fetchCarrosPorMatricula(id)
      .then((data) => {
        setCarro(Array.isArray(data) ? data[0] : data);
      })
      .catch((err) => console.error("Erro ao carregar veículo", err));
  }, [id]);

  if (!carro) {
    return <div className="loading-state">A carregar dados do veículo...</div>;
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Editar Veículo</h1>
        <p className="page-subtitle">
          Atualize as informações do veículo abaixo.
        </p>
      </div>
      <FormVehicle dadosEdicao={carro} />
    </div>
  );
}

export default EditVehiclePage;
