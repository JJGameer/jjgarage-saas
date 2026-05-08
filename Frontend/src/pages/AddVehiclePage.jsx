import FormVehicle from "../components/vehicles/FormVehicle";

function AddVehiclePage() {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Adicionar Veículo</h1>
        <p className="page-subtitle">
          Preencha os dados abaixo para registar um novo veículo no sistema.
        </p>
      </div>
      <FormVehicle />
    </div>
  );
}

export default AddVehiclePage;
