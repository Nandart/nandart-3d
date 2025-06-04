// market.js — Funções de compra, revenda e ligação ao OpenSea na Polygon

import { getContrato } from "./contrato.js";
import { verificarRedePolygon, mudarParaPolygon } from "./rede.js";


// Endereço real do contrato na Polygon (Mainnet)
const contractAddress = "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41";
const chainName = "matic"; // Para gerar o link do OpenSea na Mainnet

// ChainId da rede Polygon (Matic Mainnet)
const CHAIN_ID_HEX = "0x89"; // hexadecimal de 137

// Verifica se o utilizador está na rede Polygon


// Verifica quem é o proprietário atual do NFT
export async function verificarDono(tokenId) {
  const contrato = await getContrato();
  try {
    const owner = await contrato.ownerOf(tokenId);
    return owner.toLowerCase();
  } catch (err
