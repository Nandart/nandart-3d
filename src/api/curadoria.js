import { getContrato } from '../contrato.js';

async function carregarSubmissoes() {
  const lista = document.getElementById("curadoria-lista");
  if (!lista) return;

  lista.innerHTML = '<p>Carregando submissões...</p>';

  try {
    if (!window.ethereum) throw new Error('Por favor, instale o MetaMask para acessar este recurso');

    const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
    const user = contas[0];
    const contrato = await getContrato();

    let autorizado = false;
    try {
      if (typeof contrato.isWhitelisted === 'function') {
        autorizado = await contrato.isWhitelisted(user);
      } else {
        console.warn('Função isWhitelisted não encontrada no contrato');
        autorizado = true;
      }
    } catch (e) {
      console.error('Erro na verificação de curador:', e);
      autorizado = false;
    }

    if (!autorizado) {
      lista.innerHTML = `<div class="error-message"><p>Acesso restrito a curadores autorizados</p></div>`;
      return;
    }

    const obras = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");

    if (obras.length === 0) {
      lista.innerHTML = `<div class="empty-message"><p>Nenhuma submissão pendente de aprovação</p></div>`;
      return;
    }

    lista.innerHTML = '';
    obras.forEach((obra, index) => {
      const div = document.createElement("div");
      div.className = "submission-card";
      div.innerHTML = `
        <div class="submission-image">
          <img src="${obra.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}" alt="${obra.title}" onerror="this.onerror=null;this.src='/assets/placeholder-artwork.png'">
        </div>
        <div class="submission-details">
          <h3>${obra.title}</h3>
          <p><strong>Artista:</strong> ${obra.artist}</p>
          <p><strong>Ano:</strong> ${obra.year}</p>
          <p><strong>Preço:</strong> ${obra.price} ETH</p>
          <div class="submission-actions">
            <button class="btn-approve" data-index="${index}">Aprovar</button>
            <button class="btn-reject" data-index="${index}">Rejeitar</button>
          </div>
        </div>
      `;
      lista.appendChild(div);
    });

    document.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = e.target.dataset.index;
        const obra = obras[index];
        e.target.disabled = true;
        e.target.textContent = 'Processando...';

        try {
          const valor = ethers.parseEther(obra.price.toString());
          const tx = await contrato.mintComCuradoria(user, obra.tokenURI, { value: valor });
          const receipt = await tx.wait();

          const evento = receipt.logs.find(log => log.fragment?.name === "Transfer");
          const tokenId = evento?.args?.tokenId?.toString();

          if (tokenId) {
            obra.tokenId = parseInt(tokenId);
          }

          obras.splice(index, 1);
          localStorage.setItem("pendingSubmissions", JSON.stringify(obras));
          showNotification('Obra aprovada com sucesso!', 'success');
          carregarSubmissoes();
        } catch (error) {
          console.error('Erro ao aprovar obra:', error);
          e.target.disabled = false;
          e.target.textContent = 'Aprovar';
          showNotification(`Erro: ${error.message}`, 'error');
        }
      });
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        obras.splice(index, 1);
        localStorage.setItem("pendingSubmissions", JSON.stringify(obras));
        showNotification('Obra rejeitada', 'success');
        carregarSubmissoes();
      });
    });

  } catch (error) {
    console.error('Erro no painel de curadoria:', error);
    lista.innerHTML = `<div class="error-message"><p>Erro: ${error.message}</p></div>`;
  }
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

if (document.getElementById("curadoria-lista")) {
  document.addEventListener('DOMContentLoaded', carregarSubmissoes);
}

export { carregarSubmissoes, showNotification };
