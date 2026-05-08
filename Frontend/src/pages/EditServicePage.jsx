import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchServicosPorId } from "../services/api";
import FormService from "../components/revisions/FormService";

function EditServicePage() {
  const { id } = useParams();
  const [servico, setServicos] = useState(null);

  useEffect(() => {
    fetchServicosPorId(id).then((data) => {
      setServicos(data);
    });
  }, [id]);

  if (!servico) return <p>A carregar dados do serviço...</p>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Editar Serviço</h1>
        <p className="page-subtitle">
          Atualize as informações do serviço abaixo.
        </p>
      </div>
      <FormService key={servico.ServicoId} dadosEdicao={servico} />
    </div>
  );
}

export default EditServicePage;
