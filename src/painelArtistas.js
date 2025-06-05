import { getContrato } from "./contrato.js";
import { verificarDono } from "./market.js";

// Endereço da galeria (para verificar se ainda é dona do NFT)
const enderecoGaleria = "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41";

export async function carregarEstadoDasObras(artworkData) {
  const contrato = await getContrato();

  for (let i = 0; i < artworkData.length; i++) {
    const obra = artworkData[i];
    const tokenId = i;

    try {
      const dono = await contrato.ownerOf(tokenId);
      const estado = dono.toLowerCase() === enderecoGaleria.toLowerCase()
        ? "Disponível na galeria"
        : `Colecionada por: ${dono}`;

      const elementoEstado = document.querySelector(`#estado-obra-${tokenId}`);
      if (elementoEstado) {
        elementoEstado.textContent = estado;
      }

      const botaoComprar = document.querySelector(`#comprar-obra-${tokenId}`);
      if (botaoComprar) {
        botaoComprar.style.display = dono.toLowerCase() === enderecoGaleria.toLowerCase()
          ? "inline-block"
          : "none";
      }
    } catch (error) {
      console.warn(`Obra ${tokenId} ainda não cunhada.`);
    }
  }
}