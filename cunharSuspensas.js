
import { getContrato } from '../contrato.js';
import { obrasSuspensas } from '../main.js';

const artworkData = obrasSuspensas;

async function cunharObrasSuspensas() {
  const contrato = await getContrato();
  const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
  const curador = contas[0];

  const enderecoCurador = await contrato.curador();
  if (curador.toLowerCase() !== enderecoCurador.toLowerCase()) {
    console.error("❌ Apenas o curador pode cunhar estas obras.");
    alert("Apenas o curador pode cunhar estas obras.");
    return;
  }

  if (!confirm("Desejas cunhar todas as obras suspensas?")) return;

  for (const obra of artworkData) {
    try {
      const valor = ethers.parseEther(obra.price.toString());
      const tx = await contrato.mintComCuradoria(
        obra.artista,
        obra.tokenURI,
        { value: valor }
      );
      console.log(`🛠️ A cunhar "${obra.title}"... TX: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Cunhagem da obra "${obra.title}" concluída com sucesso.`);
    } catch (erro) {
      console.error(`❌ Erro ao cunhar "${obra.title}":`, erro);
    }
  }
}

// Tornar a função acessível no escopo global
window.cunharObrasSuspensas = cunharObrasSuspensas;
