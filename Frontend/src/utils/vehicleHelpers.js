export const getVehicleImage = (marca, modelo) => {
  const marcaLimpa = marca?.toLowerCase().trim() || "generic";
  const modeloLimpo = modelo?.split(" ")[0].toLowerCase() || "default";

  const caminhos = {
    audi: {
      a4: "../assets/img/audi-a4.png",
      a5: "../assets/img/audi-a5.png",
      default: "../assets/img/audi.png",
    },
    volkswagen: {
      golf6: "../assets/img/golf-vii.png",
    },
    tesla: {
      default: "../assets/img/tesla.png",
    },
    bmw: {
      default: "../assets/img/bmw.png",
    },
  };

  const imagem =
    caminhos[marcaLimpa]?.[modeloLimpo] ||
    caminhos[marcaLimpa]?.default ||
    "../assets/img/logo2.png";
  {
    /*Arranjar uma imagem default*/
  }

  return imagem;
};
