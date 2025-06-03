// market.js — Funções de compra, revenda e visualização no OpenSea

import { getContrato } from "./contrato.js";

// Substitui pela tua chainId e endereço do contrato
const contractAddress = "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41"; // <- coloca aqui o teu endereço real
const chainName = "mumbai"; // ou "sepolia", "goerli", etc.

export async function verificarDono(tokenId) {
  const contrato = await getContrato();
  try {
    const owner = await contrato.ownerOf(tokenId);
    return owner.toLowerCase();
  } catch (error) {
    return null; // Token ainda não cunhado
  }
}

export async function comprarObra(artwork, userAddress) {
  const contrato = await getContrato();
  const valor = ethers.parseEther(artwork.price.toString());

  try {
    const tx = await contrato.mintComCuradoria(
      artwork.artista,
      artwork.tokenURI,
      { from: userAddress, value: valor }
    );
    console.log("Compra efetuada:", tx);
    return tx;
  } catch (error) {
    console.error("Erro na compra:", error);
    throw error;
  }
}

export async function revenderObra(tokenId, novoProprietario, userAddress) {
  const contrato = await getContrato();
  try {
    const tx = await contrato.safeTransferFrom(
      userAddress,
      novoProprietario,
      tokenId
    );
    console.log("NFT revendido:", tx);
    return tx;
  } catch (error) {
    console.error("Erro na revenda:", error);
    throw error;
  }
}

export function linkOpenSea(tokenId) {
  return `https://testnets.opensea.io/assets/${chainName}/${contractAddress}/${tokenId}`;
}
