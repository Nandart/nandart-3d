// contrato.js
// Instância do contrato inteligente com ethers.js

import { ethers } from "ethers";

// ⬇️ Substitui por **todo o teu ABI copiado do Remix**
const contractABI = [ 
  /* ... ABI do contrato ... */ 
  
];

// ⬇️ Substitui pelo endereço real do contrato já deployado
const contractAddress = "0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41";

export async function getContrato() {
  if (!window.ethereum) {
    throw new Error("MetaMask não está disponível");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contrato = new ethers.Contract(contractAddress, contractABI, signer);

  return contrato;
}
