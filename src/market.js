import { getContrato } from "./contrato.js";
import { verificarRedePolygon, mudarParaPolygon } from "./rede.js";

const contractAddress = "0x3994c906f3242e0e216c53af50381f66c020287c";
const chainName = "matic";

// Verifica quem é o proprietário atual do NFT
export async function verificarDono(tokenId) {
  const contrato = await getContrato();
  try {
    const owner = await contrato.ownerOf(tokenId);
    return owner.toLowerCase();
  } catch (error) {
    return null; // Token ainda não cunhado
  }
}

// Compra primária da obra (mint com curadoria)
export async function comprarObra(artwork, userAddress) {
  const redeOk = await verificarRedePolygon();
  if (!redeOk) {
    const mudar = confirm("Desejas mudar automaticamente para a rede Polygon?");
    if (mudar) await mudarParaPolygon();
    return;
  }

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

// Revenda secundária do NFT para outro utilizador
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

// Estimativa de gás e custo total para mintagem
export async function estimarGasMint(artwork, userAddress) {
  const contrato = await getContrato();
  const valor = ethers.parseEther(artwork.price.toString());

  try {
    const gas = await contrato.mintComCuradoria.estimateGas(
      artwork.artista,
      artwork.tokenURI,
      { from: userAddress, value: valor }
    );

    const provider = new ethers.BrowserProvider(window.ethereum);
    const gasPrice = await provider.getFeeData();
    const custoTotal = gas * gasPrice.gasPrice;

    const totalEth = ethers.formatEther(custoTotal + valor);
    return {
      gas,
      gasPrice: gasPrice.gasPrice,
      totalEmETH: totalEth,
    };
  } catch (error) {
    console.error("Erro ao estimar gás:", error);
    return null;
  }
}

// Gera o link direto para o OpenSea (rede Polygon)
export function linkOpenSea(tokenId) {
  return `https://opensea.io/assets/${chainName}/${contractAddress}/${tokenId}`;
}
