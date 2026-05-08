import { Link } from "react-router-dom";

function ServiceCard({ dados, onClick }) {
  const dataFormatada = new Date(dados.DataServico).toLocaleDateString("pt-PT");

  return (
    <div className="cardService" onClick={onClick}>
      <img src="../assets/img/Security.png" alt="logoSecurity" />
      <div className="articleCardService">
        <h3>{dados.TipoServico}</h3>
        <h4>{dataFormatada}</h4>
      </div>
    </div>
  );
}

export default ServiceCard;
