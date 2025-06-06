import { getContrato } from './contrato.js';
import { artworkData } from './main.js';

async function verificarCurador() {
  const status = document.getElementById('admin-status');
  try {
    if (!window.ethereum) {
      status.innerHTML = '<p class="error-message">MetaMask não está disponível.</p>';
      return false;
    }

    const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const user = contas[0];

    const contrato = await getContrato();
    const autorizado = await contrato.isWhitelisted(user);

    if (!autorizado) {
      status.innerHTML = '<p class="error-message">Acesso restrito a curadores autorizados.</p>';
      return false;
    }

    status.innerHTML = `<p class="success-message">Curador autenticado: ${user}</p>`;
    return true;
  } catch (erro) {
    console.error('Erro na verificação de curador:', erro);
    status.innerHTML = `<p class="error-message">Erro: ${erro.message}</p>`;
    return false;
  }
}

async function cunharObrasSuspensas() {
  const log = document.getElementById('log-cunhagem');
  const contrato = await getContrato();

  const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
  const curador = contas[0];

  log.innerHTML = '<p>A iniciar cunhagem...</p>';

  for (const obra of artworkData) {
    try {
      const valor = ethers.parseEther(obra.price.toString());

      const tx = await contrato.mintComCuradoria(
        obra.artista,
        obra.tokenURI,
        { value: valor }
      );

      log.innerHTML += `<p>⏳ Enviada cunhagem de "${obra.title}"... <small>${tx.hash}</small></p>`;
      await tx.wait();

      log.innerHTML += `<p class="success-message">✅ "${obra.title}" cunhada com sucesso.</p>`;
    } catch (erro) {
      console.error(`Erro ao cunhar "${obra.title}":`, erro);
      log.innerHTML += `<p class="error-message">❌ Erro em "${obra.title}": ${erro.message}</p>`;
    }
  }

  log.innerHTML += `<p><strong>✅ Cunhagem completa.</strong></p>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const curadorValido = await verificarCurador();

  const botao = document.getElementById('cunhar-btn');
  if (!curadorValido) {
    botao.disabled = true;
    return;
  }

  botao.addEventListener('click', async () => {
    const confirmar = confirm("Tens a certeza que queres cunhar todas as obras suspensas?");
    if (confirmar) {
      botao.disabled = true;
      await cunharObrasSuspensas();
    }
  });
});
