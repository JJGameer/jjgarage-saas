import FormService from "../components/revisions/FormService";

function AddServicePage() {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Novo Serviço</h1>
        <p className="page-subtitle">
          Preencha os dados abaixo para registar um novo serviço no sistema.
        </p>
      </div>
      <FormService />
    </div>
  );
}

export default AddServicePage;
