// rede.js — verificação e mudança automática para Polygon Mainnet

const CHAIN_ID_HEX = "0x89"; // Polygon Mainnet
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
    } else {
      console.error("Erro ao mudar de rede:", switchError);
    }
  }
}
