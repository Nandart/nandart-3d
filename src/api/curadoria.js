import { getContrato } from '../contrato.js';

// Elementos do DOM
const listaSubmissoes = document.getElementById("curadoria-lista");
const panel = document.getElementById("curation-panel");

// Estilos dinâmicos
const styles = `
  .submission-card {
    background: rgba(30, 30, 30, 0.8);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid rgba(216, 178, 108, 0.3);
    display: flex;
    gap: 15px;
  }
  .submission-image img {
    max-width: 150px;
    border-radius: 4px;
  }
  .submission-details {
    flex: 1;
  }
  .submission-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .btn-approve, .btn-reject {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Playfair Display', serif;
    transition: all 0.2s ease;
  }
  .btn-approve {
    background-color: #4CAF50;
    color: white;
  }
  .btn-reject {
    background-color: #f44336;
    color: white;
  }
  .notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 1000;
    animation: slideIn 0.5s forwards;
  }
  .notification.success {
    background-color: #4CAF50;
    color: white;
  }
  .notification.error {
    background-color: #f44336;
    color: white;
  }
`;

// Adiciona estilos dinâmicos
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

async function carregarSubmissoes() {
  if (!listaSubmissoes) return;

  listaSubmissoes.innerHTML = '<p>Carregando submissões...</p>';

  try {
    // Verifica conexão com MetaMask
    if (!window.ethereum) {
      throw new Error('MetaMask não detectado');
    }

    const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
    const user = contas[0];
    const contrato = await getContrato();

    // Verifica se é curador
    const isCurador = await contrato.isWhitelisted(user);
    if (!isCurador) {
      listaSubmissoes.innerHTML = `
        <div class="error-message">
          <p>Acesso restrito a curadores autorizados</p>
        </div>
      `;
      return;
    }

    // Carrega submissões do localStorage
    const obras = JSON.parse(localStorage.getItem("pendingSubmissions") || "[]");

    if (obras.length === 0) {
      listaSubmissoes.innerHTML = `
        <div class="empty-message">
          <p>Nenhuma submissão pendente de aprovação</p>
        </div>
      `;
      return;
    }

    // Renderiza cada obra
    listaSubmissoes.innerHTML = '';
    obras.forEach((obra, index) => {
      const card = document.createElement('div');
      card.className = 'submission-card';
      card.innerHTML = `
        <div class="submission-image">
          <img src="${obra.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}" 
               alt="${obra.title}"
               onerror="this.onerror=null;this.src='/assets/placeholder-artwork.png'">
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
      listaSubmissoes.appendChild(card);
    });

    // Configura eventos dos botões
    document.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = e.target.dataset.index;
        const obra = obras[index];
        e.target.disabled = true;
        e.target.textContent = 'Processando...';

        try {
          const valor = ethers.parseEther(obra.price.toString());
          const tx = await contrato.mintComCuradoria(
            user,
            obra.tokenURI,
            { value: valor }
          );
          await tx.wait();

          // Remove obra aprovada
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
    listaSubmissoes.innerHTML = `
      <div class="error-message">
        <p>Erro: ${error.message}</p>
      </div>
    `;
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

// Inicializa quando o painel estiver presente
if (panel) {
  document.addEventListener('DOMContentLoaded', carregarSubmissoes);
}
