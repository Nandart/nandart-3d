// market.js — Funções de compra, revenda e ligação ao OpenSea na Polygon

import { getContrato } from "./contrato.js";

// Endereço real do contrato na Polygon (Mainnet)
const contractAddress = "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41";
const chainName = "matic"; // Para gerar o link do OpenSea na Mainnet

// ChainId da rede Polygon (Matic Mainnet)
const CHAIN_ID_HEX = "0x89"; // hexadecimal de 137

// Verifica se o utilizador está na rede Polygon
export async function verificarRedePolygon() {
  if (!window.ethereum) {
    alert("MetaMask não está instalada!");
    return false;
  }

  const chainIdAtual = await window.ethereum.request({ method: "eth_chainId" });

  if (chainIdAtual !== CHAIN_ID_HEX) {
    alert("Estás na rede errada. Por favor, muda para a rede Polygon (Matic).");
    return false;
  }

  return true;
}

// Permite mudar automaticamente para a rede Polygon (caso não esteja)
export async function mudarParaPolygon() {
  if (!window.ethereum) {
    alert("MetaMask não está instalada!");
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (switchError) {
    // Se a rede ainda não estiver adicionada
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAIN_ID_HEX,
            chainName: "Polygon Mainnet",
            nativeCurrency: {
              name: "MATIC",
              symbol: "MATIC",
              decimals: 18,
            },
            rpcUrls: ["https://polygon-rpc.com/"],
            blockExplorerUrls: ["https://polygonscan.com/"],
          }],
        });
      } catch (addError) {
        console.error("Erro ao adicionar a rede Polygon:", addError);
      }
    }
  }
}

// Verifica quem é o proprietário atual do NFT
export async function verificarDono(tokenId) {
  const contrato = await getContrato();
  try {
    const owner = await contrato.ownerOf(tokenId);
    return owner.toLowerCase();
  } catch (err
