import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

// Configurações iniciais e verificação de dependências
console.log('🎨 A iniciar a galeria 3D NANdART...');

if (!THREE || !gsap || !ethers) {
  const errorMsg = document.createElement('div');
  errorMsg.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: #111; color: #ff6b6b;
    display: flex; justify-content: center; align-items: center;
    font-family: Arial, sans-serif; text-align: center;
    z-index: 10000; padding: 20px;
  `;
  errorMsg.innerHTML = `
    <div>
      <h2>Erro crítico</h2>
      <p>Bibliotecas essenciais não foram carregadas.</p>
      <p>Verifica a ligação à internet e recarrega a página.</p>
    </div>
  `;
  document.body.appendChild(errorMsg);
  throw new Error('❌ Bibliotecas essenciais em falta');
}

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Configurações responsivas
const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 18, cameraY: 7.2, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 19.5, cameraY: 7.6, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 21, cameraY: 8.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 22, cameraY: 8.4, textSize: 0.55 }
};

function getViewportLevel() {
  const width = window.innerWidth;
  if (width < 480) return 'XS';
  if (width < 768) return 'SM';
  if (width < 1024) return 'MD';
  return 'LG';
}

// Estado da aplicação
let config = configMap[getViewportLevel()];
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;
let walletAddress = null;

// Elementos do DOM
const overlay = document.getElementById('overlay');
const infoPanel = document.getElementById('info-panel');
const modalElements = {
  titulo: document.getElementById('obra-titulo'),
  artista: document.getElementById('obra-artista'),
  ano: document.getElementById('obra-ano'),
  descricao: document.getElementById('obra-descricao'),
  preco: document.getElementById('obra-preco'),
  botao: document.getElementById('obra-buy')
};

// Inicialização do Three.js
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  powerPreference: 'high-performance',
  failIfMajorPerformanceCaveat: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.8;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);

// Funções de configuração da cena
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 6.5);
  camera.lookAt(0, 6.5, -config.wallDistance + 0.4);
  camera.updateProjectionMatrix();
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);
}

function createFloor() {
  const floorGeometry = new THREE.PlaneGeometry(80, 80);
  const floorMirror = new Reflector(floorGeometry, {
    clipBias: 0.003,
    textureWidth: window.innerWidth * window.devicePixelRatio,
    textureHeight: window.innerHeight * window.devicePixelRatio,
    color: 0x111111
  });
  floorMirror.rotation.x = -Math.PI / 2;
  floorMirror.position.y = -0.03;
  floorMirror.receiveShadow = true;
  scene.add(floorMirror);
}

function createWalls() {
  const paredeGeoFundo = new THREE.PlaneGeometry(42, 32);
  const paredeGeoLateral = new THREE.PlaneGeometry(34, 30);
  
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    'assets/antracite-realista.jpg',
    (textura) => {
      const paredeMaterial = new THREE.MeshStandardMaterial({
        map: textura,
        color: 0xffffff,
        emissive: 0x111111,
        emissiveIntensity: 0.2,
        roughness: 0.58,
        metalness: 0.18
      });

      const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
      paredeFundo.position.set(0, 14.6, -config.wallDistance - 5.2);
      paredeFundo.receiveShadow = true;
      scene.add(paredeFundo);

      const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
      paredeEsquerda.position.set(-16.7, 14.5, -config.wallDistance / 2);
      paredeEsquerda.rotation.y = Math.PI / 2;
      paredeEsquerda.receiveShadow = true;
      scene.add(paredeEsquerda);

      const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
      paredeDireita.position.set(16.7, 14.5, -config.wallDistance / 2);
      paredeDireita.rotation.y = -Math.PI / 2;
      paredeDireita.receiveShadow = true;
      scene.add(paredeDireita);
    },
    undefined,
    () => {
      console.warn('⚠️ Falha ao carregar a textura antracite. Aplicar cor fallback.');
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        emissive: 0x111111,
        emissiveIntensity: 0.2,
        roughness: 0.58,
        metalness: 0.18
      });
      
      const paredeFundo = new THREE.Mesh(paredeGeoFundo, fallbackMaterial);
      paredeFundo.position.set(0, 14.6, -config.wallDistance - 5.2);
      scene.add(paredeFundo);

      const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, fallbackMaterial);
      paredeEsquerda.position.set(-16.7, 14.5, -config.wallDistance / 2);
      paredeEsquerda.rotation.y = Math.PI / 2;
      scene.add(paredeEsquerda);

      const paredeDireita = new THREE.Mesh(paredeGeoLateral, fallbackMaterial);
      paredeDireita.position.set(16.7, 14.5, -config.wallDistance / 2);
      paredeDireita.rotation.y = -Math.PI / 2;
      scene.add(paredeDireita);
    }
  );
}

function createMoldings() {
  const frisoMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a5c21,
    metalness: 1,
    roughness: 0.08,
    emissive: 0x2f1b08,
    emissiveIntensity: 0.33
  });

  function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
    const friso = new THREE.Mesh(
      new THREE.BoxGeometry(largura, altura, 0.02),
      frisoMaterial
    );
    friso.position.set(x, y, z);
    friso.rotation.y = rotY;
    scene.add(friso);
  }

  function criarFrisoDuploVertical(x, y, z, altura, lado) {
    const offset = lado === 'esquerda' ? -0.4 : 0.4;
    const externo = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, altura, 0.02),
      frisoMaterial
    );
    externo.position.set(x, y, z);
    externo.rotation.y = lado === 'esquerda' ? Math.PI / 2 : -Math.PI / 2;
    scene.add(externo);

    const interno = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, altura - 0.4, 0.02),
      frisoMaterial
    );
    interno.position.set(x + offset, y, z + 0.01);
    interno.rotation.y = externo.rotation.y;
    scene.add(interno);
  }

  criarFrisoLinha(0, 1.6, -config.wallDistance - 5.18, 42);
  criarFrisoLinha(0, 2.2, -config.wallDistance - 5.18, 42);
  criarFrisoLinha(-16.7, 1.6, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
  criarFrisoLinha(-16.7, 2.2, -config.wallDistance / 2, 30, 0.06, Math.PI / 2);
  criarFrisoLinha(16.7, 1.6, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
  criarFrisoLinha(16.7, 2.2, -config.wallDistance / 2, 30, 0.06, -Math.PI / 2);
  criarFrisoDuploVertical(-16.7, 14.5, -config.wallDistance / 2, 7.5, 'esquerda');
  criarFrisoDuploVertical(16.7, 14.5, -config.wallDistance / 2, 7.5, 'direita');
}

// Dados das obras de arte
const dadosObras = [
  { id: 'obra1', titulo: 'Obra 1', artista: 'Artista A', ano: '2024', descricao: 'Descrição da Obra 1.', preco: '0.5', imagem: 'assets/obras/obra1.jpg' },
  { id: 'obra2', titulo: 'Obra 2', artista: 'Artista B', ano: '2023', descricao: 'Descrição da Obra 2.', preco: '0.6', imagem: 'assets/obras/obra2.jpg' },
  { id: 'obra3', titulo: 'Obra 3', artista: 'Artista C', ano: '2025', descricao: 'Descrição da Obra 3.', preco: '0.45', imagem: 'assets/obras/obra3.jpg' },
  { id: 'obra4', titulo: 'Obra 4', artista: 'Artista D', ano: '2022', descricao: 'Descrição da Obra 4.', preco: '0.55', imagem: 'assets/obras/obra4.jpg' },
  { id: 'obra5', titulo: 'Obra 5', artista: 'Artista E', ano: '2021', descricao: 'Descrição da Obra 5.', preco: '0.65', imagem: 'assets/obras/obra5.jpg' },
  { id: 'obra6', titulo: 'Obra 6', artista: 'Artista F', ano: '2021', descricao: 'Descrição da Obra 6.', preco: '0.42', imagem: 'assets/obras/obra6.jpg' },
  { id: 'obra7', titulo: 'Obra 7', artista: 'Artista G', ano: '2020', descricao: 'Descrição da Obra 7.', preco: '0.48', imagem: 'assets/obras/obra7.jpg' },
  { id: 'obra8', titulo: 'Obra 8', artista: 'Artista H', ano: '2020', descricao: 'Descrição da Obra 8.', preco: '0.58', imagem: 'assets/obras/obra8.jpg' }
];

// Criação e animação das obras
function criarObrasNormais() {
  const raio = config.circleRadius;
  const tamanho = config.obraSize;
  const textureLoader = new THREE.TextureLoader();

  dadosObras.forEach((dados, i) => {
    textureLoader.load(dados.imagem, (texture) => {
      const obra = new THREE.Mesh(
        new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.2,
          metalness: 0.1,
          side: THREE.DoubleSide,
          transparent: true
        })
      );

      const angulo = (i / dadosObras.length) * Math.PI * 2;
      obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
      obra.lookAt(0, 4.2, 0);
      obra.castShadow = obra.receiveShadow = true;
      obra.userData = { dados, index: i };
      scene.add(obra);
      obrasNormais.push(obra);
    });
  });
}

const velocidadeObras = 0.07;

function animarObrasCirculares(delta) {
  const velocidadeReal = obraDestacada ? velocidadeObras * 0.15 : velocidadeObras;
  anguloAtual += velocidadeReal * delta;
  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    if (obra !== obraDestacada) {
      const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
      obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
      obra.lookAt(0, 4.2, 0);
    }
  });
}

// Interação com as obras
function setupObraInteractions() {
  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (obraDestacada) return;

    const mouse = new THREE.Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(obrasNormais, false);

    if (intersects.length > 0) {
      const obraClicada = intersects[0].object;
      destacarObra(obraClicada);
    }
  });

  window.addEventListener('pointerdown', (e) => {
    if (!obraDestacada || (infoPanel && !infoPanel.contains(e.target))) {
      fecharObraDestacada();
    }
  });
}

function destacarObra(obra) {
  if (obraDestacada) return;
  
  obraDestacada = obra;
  ambienteDesacelerado = true;
  const dados = obra.userData.dados;

  gsap.to(obra.position, { x: 0, y: 6.5, z: 0, duration: 1.1, ease: 'power2.inOut' });
  gsap.to(obra.scale, { x: 2, y: 2, z: 2, duration: 0.9, ease: 'power2.out' });

  setTimeout(() => {
    if (!overlay || !infoPanel) {
      console.error('❌ Elementos do modal não encontrados.');
      return;
    }

    overlay.style.display = 'block';
    infoPanel.style.display = 'block';
    
    modalElements.titulo.textContent = dados.titulo;
    modalElements.artista.textContent = dados.artista;
    modalElements.ano.textContent = dados.ano;
    modalElements.descricao.textContent = dados.descricao || 'Obra em destaque na galeria NANdART.';
    modalElements.preco.textContent = `${dados.preco} ETH`;
  }, 1100);
}

function fecharObraDestacada() {
  if (!obraDestacada) return;

  const obra = obraDestacada;
  const indexOriginal = obra.userData.index;
  const angulo = (indexOriginal / obrasNormais.length) * Math.PI * 2;

  gsap.to(obra.position, {
    x: Math.cos(angulo) * config.circleRadius,
    y: 4.2,
    z: Math.sin(angulo) * config.circleRadius,
    duration: 1.2, 
    ease: 'power2.inOut',
    onComplete: () => {
      if (overlay) overlay.style.display = 'none';
      if (infoPanel) infoPanel.style.display = 'none';
      obraDestacada = null;
      ambienteDesacelerado = false;
    }
  });

  gsap.to(obra.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'power2.out' });
}

// Integração com MetaMask
function setupWalletIntegration() {
  const walletBtn = document.createElement('button');
  walletBtn.textContent = 'Connect Wallet';
  walletBtn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:250;padding:10px;background:#d8b26c;border:none;border-radius:6px;';
  document.body.appendChild(walletBtn);

  async function atualizarEstadoCarteira() {
    if (walletAddress) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const saldo = await provider.getBalance(walletAddress);
        const eth = ethers.formatEther(saldo);
        walletBtn.textContent = `Disconnect (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} | ${parseFloat(eth).toFixed(4)} ETH)`;
      } catch (err) {
        console.error('Erro ao obter saldo:', err);
        walletBtn.textContent = `Connected (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)})`;
      }
    } else {
      walletBtn.textContent = 'Connect Wallet';
    }
  }

  async function conectarCarteira() {
    try {
      if (!window.ethereum) {
        alert('MetaMask não está instalada. Por favor, instala-a para continuar.');
        return;
      }
      
      const contas = await window.ethereum.request({ method: 'eth_requestAccounts' });
      walletAddress = contas[0];
      localStorage.setItem('walletConnected', 'true');
      await atualizarEstadoCarteira();
    } catch (erro) {
      console.error('❌ Erro ao ligar carteira:', erro);
      alert('Não foi possível ligar a carteira. Tenta novamente.');
    }
  }

  function desligarCarteira() {
    walletAddress = null;
    localStorage.removeItem('walletConnected');
    atualizarEstadoCarteira();
  }

  walletBtn.addEventListener('click', () => {
    if (walletAddress) {
      desligarCarteira();
    } else {
      conectarCarteira();
    }
  });

  // Verificar conexão persistente ao carregar
  window.addEventListener('load', async () => {
    if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
      try {
        const contas = await window.ethereum.request({ method: 'eth_accounts' });
        if (contas.length > 0) {
          walletAddress = contas[0];
          await atualizarEstadoCarteira();
        } else {
          localStorage.removeItem('walletConnected');
          walletAddress = null;
          atualizarEstadoCarteira();
        }
      } catch (err) {
        console.error('❌ Erro ao verificar ligação persistente da carteira:', err);
        localStorage.removeItem('walletConnected');
      }
    }
  });

  // Configurar botão de compra
  if (modalElements.botao) {
    modalElements.botao.addEventListener('click', async () => {
      const dados = obraDestacada?.userData?.dados;
      if (!dados || !dados.preco || !dados.titulo) {
        alert('Erro: dados da obra não encontrados.');
        return;
      }
      
      if (!window.ethereum) {
        alert('MetaMask não está instalada. Por favor, instala-a para continuares.');
        return;
      }
      
      if (!walletAddress) {
        alert('Por favor, conecta a tua carteira primeiro.');
        return;
      }

      try {
        modalElements.botao.disabled = true;
        modalElements.botao.textContent = 'A processar...';
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const tx = await signer.sendTransaction({
          to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
          value: ethers.parseEther(dados.preco)
        });
        
        alert(`🧾 Transacção enviada!\n\nHash:\n${tx.hash}`);
        await tx.wait();
        alert('🎉 Compra confirmada! Obrigado por apoiar a arte digital.');
        fecharObraDestacada();
      } catch (err) {
        console.error('❌ Erro na compra:', err);
        alert('⚠️ Ocorreu um erro durante a compra. Verifica a carteira e tenta novamente.');
      } finally {
        modalElements.botao.disabled = false;
        modalElements.botao.textContent = 'Buy';
      }
    });
  }
}

// UI adicional
function setupUI() {
  // Ícone de informação
  const iconInfo = document.createElement('img');
  iconInfo.src = '/assets/icons/info.png';
  iconInfo.style.cssText = 'position: absolute; top: 40px; left: 40px; z-index: 300;';
  document.body.appendChild(iconInfo);

  // Ícone de menu
  const iconMenu = document.createElement('img');
  iconMenu.src = '/assets/icons/horizontes.png';
  iconMenu.style.cssText = 'position: absolute; top: 40px; left: 100px; z-index: 300;';
  document.body.appendChild(iconMenu);
}

// Função de animação principal
function animate() {
  requestAnimationFrame(animate);
  const delta = relogio.getDelta();
  animarObrasCirculares(delta);
  renderer.render(scene, camera);
}

// Inicialização da galeria
function iniciarGaleria() {
  if (window._galeriaIniciada) {
    console.warn('⚠️ A galeria já foi iniciada. Ignorando nova inicialização.');
    return;
  }
  
  window._galeriaIniciada = true;
  
  updateCamera();
  setupLights();
  createFloor();
  createWalls();
  createMoldings();
  criarObrasNormais();
  setupObraInteractions();
  setupWalletIntegration();
  setupUI();
  
  animate();
  
  console.log('%c🎨 Galeria 3D NANdART inicializada com sucesso!', 'color:#d8b26c;font-size:16px;');
}

// Event listeners
window.addEventListener('DOMContentLoaded', iniciarGaleria);
window.addEventListener('resize', () => {
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});

window.addEventListener('beforeunload', () => {
  console.log('A encerrar a galeria NANdART e a limpar recursos...');
  renderer.dispose();
});
