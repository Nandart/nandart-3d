import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

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

let config;
let obraDestacada = null;
let ambienteDesacelerado = false;
const obrasNormais = [];
const relogio = new THREE.Clock();
let anguloAtual = 0;

let overlay = document.getElementById('overlay');
let infoPanel = document.getElementById('info-panel');
const modalElements = {
  titulo: document.getElementById('obra-titulo'),
  artista: document.getElementById('obra-artista'),
  ano: document.getElementById('obra-ano'),
  descricao: document.getElementById('obra-descricao'),
  preco: document.getElementById('obra-preco'),
  botao: document.getElementById('obra-buy')
};

// ==================== BLOCO 2 — VIEWPORT, CONFIGURAÇÕES E RENDERER ====================
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

config = configMap[getViewportLevel()];

let loadedResources = 0;
const totalResources = 10;
function updateLoadingProgress() {
  loadedResources++;
  if (loadedResources >= totalResources) {
    console.log('🖼️ Recursos carregados.');
  }
}

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = updateLoadingProgress;
loadingManager.onError = url => console.warn(`⚠️ Falha ao carregar recurso: ${url}`);

const textureLoader = new THREE.TextureLoader(loadingManager);

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
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, config.cameraY + 1.6, config.cameraZ + 6.5);
  camera.lookAt(0, 6.5, -config.wallDistance + 0.4);
  camera.updateProjectionMatrix();
}
updateCamera();

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    updateCamera();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 200);
});
// ==================== BLOCO 3 — LUZES, CÂMARA E CHÃO REFLECTIVO ====================

// Luz ambiente ajustada para iluminar a galeria de forma suave e uniforme
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Iluminação reduzida para metade
scene.add(ambientLight);

// Removidas as luzes diretas apontadas para as paredes
// Mantém-se apenas a luz ambiente geral e o efeito do chão reflectivo

// Criação do chão reflectivo — estilo obsidiana líquida
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
const paredeGeoFundo = new THREE.PlaneGeometry(42, 32);
const paredeGeoLateral = new THREE.PlaneGeometry(34, 30);

function aplicarTexturaParede(textura) {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura || null,
    color: textura ? 0xffffff : 0x1a1a1a,
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
}

textureLoader.load(
  'assets/antracite-realista.jpg',
  textura => aplicarTexturaParede(textura),
  undefined,
  () => {
    console.warn('⚠️ Falha ao carregar a textura antracite. Aplicar cor fallback.');
    aplicarTexturaParede(null);
  }
);

const quadroCentralGrupo = new THREE.Group();
const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

const molduraCentral = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 0.3, alturaQuadro + 0.3, 0.18),
  new THREE.MeshStandardMaterial({
    color: 0x1e1a16,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x0d0c0a,
    emissiveIntensity: 0.15
  })
);
molduraCentral.position.z = -0.1;
quadroCentralGrupo.add(molduraCentral);

const texturaCentral = textureLoader.load('assets/obras/obra-central.jpg', updateLoadingProgress);
const pinturaCentral = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pinturaCentral.position.z = 0.01;
quadroCentralGrupo.add(pinturaCentral);

quadroCentralGrupo.position.set(0, 11.2, -config.wallDistance - 5.19);
scene.add(quadroCentralGrupo);

const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x2f1b08,
  emissiveIntensity: 0.33
});

function criarFrisoCentral(x, y, z, largura, altura) {
  const grupo = new THREE.Group();
  const espessura = 0.06;
  [1, -1].forEach(dy => {
    const barra = new THREE.Mesh(
      new THREE.BoxGeometry(largura, espessura, 0.02),
      frisoMaterial
    );
    barra.position.set(0, altura / 2 * dy, 0);
    grupo.add(barra);
  });
  [1, -1].forEach(dx => {
    const barra = new THREE.Mesh(
      new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02),
      frisoMaterial
    );
    barra.position.set(largura / 2 * dx - espessura / 2 * dx, 0, 0);
    grupo.add(barra);
  });
  grupo.position.set(x, y, z);
  scene.add(grupo);
}

criarFrisoCentral(0, 11.2, -config.wallDistance - 5.17, 5.2, 6.3);

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

const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b,
  roughness: 0.5,
  metalness: 0.25
});

const vitrineMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x1a1a1a,
  metalness: 0.1,
  roughness: 0,
  transparent: true,
  opacity: 0.18,
  transmission: 1,
  thickness: 0.25,
  reflectivity: 0.5,
  clearcoat: 1,
  clearcoatRoughness: 0.1
});

const gemaMaterial = new THREE.MeshStandardMaterial({
  color: 0x33ccff,
  emissive: 0x33ccff,
  emissiveIntensity: 1.8,
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.85
});

function criarPedestalRetangular(posX, posZ) {
  const largura = 0.8;
  const profundidade = 0.8;
  const alturaPedestal = 1.5;
  const alturaVitrine = 1.3;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(largura, alturaPedestal, profundidade),
    pedestalMaterial
  );
  base.position.set(posX, alturaPedestal / 2, posZ);
  base.castShadow = base.receiveShadow = true;
  scene.add(base);

  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(largura * 0.9, alturaVitrine, profundidade * 0.9),
    vitrineMaterial
  );
  vitrine.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  vitrine.castShadow = vitrine.receiveShadow = true;
  scene.add(vitrine);

  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.35, 1),
    gemaMaterial
  );
  gema.position.set(posX, alturaPedestal + alturaVitrine / 2, posZ);
  scene.add(gema);
}

const deslocamento = config.circleRadius + 3.3;
criarPedestalRetangular(-deslocamento, -deslocamento);
criarPedestalRetangular(deslocamento, -deslocamento);
criarPedestalRetangular(-deslocamento, deslocamento);
criarPedestalRetangular(deslocamento, deslocamento);

const circuloLuzGeometry = new THREE.RingGeometry(
  config.circleRadius + 0.4,
  config.circleRadius + 1.1,
  128
);

const circuloLuzMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 1.8,
  roughness: 0.2,
  metalness: 0.1,
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide
});

const circuloLuz = new THREE.Mesh(circuloLuzGeometry, circuloLuzMaterial);
circuloLuz.rotation.x = -Math.PI / 2;
circuloLuz.position.y = 0.01;
scene.add(circuloLuz);

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

function criarObrasNormais() {
  const raio = config.circleRadius;
  const tamanho = config.obraSize;

  dadosObras.forEach((dados, i) => {
    textureLoader.load(
      dados.imagem,
      (texture) => {
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
        obra.castShadow = true;
        obra.receiveShadow = true;

        obra.userData = { dados, index: i };

        scene.add(obra);
        obrasNormais.push(obra);
        updateLoadingProgress();
      },
      undefined,
      (error) => {
        console.error(`Erro ao carregar imagem da obra ${dados.titulo}:`, error);

        const obraFallback = new THREE.Mesh(
          new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
          new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.2,
            metalness: 0.1,
            side: THREE.DoubleSide,
            transparent: true
          })
        );

        const angulo = (i / dadosObras.length) * Math.PI * 2;
        obraFallback.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
        obraFallback.lookAt(0, 4.2, 0);
        obraFallback.castShadow = true;
        obraFallback.receiveShadow = true;

        obraFallback.userData = { dados, index: i };

        scene.add(obraFallback);
        obrasNormais.push(obraFallback);
        updateLoadingProgress();
      }
    );
  });
}

const velocidadeObras = 0.07; // Reduzida para que as obras continuem a circular suavemente

function animarObrasCirculares(delta) {
  anguloAtual += (obraDestacada ? velocidadeObras * 0.05 : velocidadeObras) * delta;

  const raio = config.circleRadius;

  obrasNormais.forEach((obra, i) => {
    if (obra === obraDestacada) return;

    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}

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

function destacarObra(obra) {
  if (obraDestacada) return;

  obraDestacada = obra;
  ambienteDesacelerado = true;

  const dados = obra.userData.dados;

  gsap.to(obra.position, {
    x: 0,
    y: 6.5,
    z: 0,
    duration: 1.1,
    ease: 'power2.inOut'
  });

  gsap.to(obra.scale, {
    x: 2,
    y: 2,
    z: 2,
    duration: 0.9,
    ease: 'power2.out'
  });

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

window.addEventListener('pointerdown', (e) => {
  if (!obraDestacada || infoPanel.contains(e.target)) return;
  fecharObraDestacada();
});

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
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
      obraDestacada = null;
      ambienteDesacelerado = false;
    }
  });

  gsap.to(obra.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 0.6,
    ease: 'power2.out'
  });
}

// ==================== BLOCO 14 — BOTÃO “BUY” E INTEGRAÇÃO COM METAMASK ====================

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

  try {
    modalElements.botao.disabled = true;
    modalElements.botao.textContent = 'A processar...';

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const tx = await signer.sendTransaction({
      to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41', // endereço da galeria
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

// ==================== BLOCO 15 — BOTÃO “CONNECT WALLET” COM LIGAÇÃO E DESCONEXÃO ====================

const walletBtn = document.createElement('button');
walletBtn.id = 'wallet-button';
walletBtn.textContent = 'Connect Wallet';
walletBtn.style.cssText = `
  position: fixed;
  top: 18px;
  right: 20px;
  z-index: 250;
  padding: 10px 18px 10px 42px;
  font-size: 1em;
  background-color: #d8b26c;
  color: #111;
  border: none;
  border-radius: 6px;
  font-family: 'Playfair Display', serif;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  background-image: url('/assets/icons/metamask.svg');
  background-repeat: no-repeat;
  background-position: 12px center;
  background-size: 20px 20px;
  transition: background-color 0.3s ease, transform 0.2s ease;
`;
document.body.appendChild(walletBtn);

let walletAddress = null;

async function atualizarEstadoCarteira() {
  if (walletAddress) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const saldo = await provider.getBalance(walletAddress);
    const eth = ethers.formatEther(saldo);
    walletBtn.textContent = `Disconnect (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} | ${parseFloat(eth).toFixed(4)} ETH)`;
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
    atualizarEstadoCarteira();
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

// ==================== BLOCO 16 — PERSISTÊNCIA DA LIGAÇÃO DA CARTEIRA COM LOCALSTORAGE ====================

window.addEventListener('load', async () => {
  if (window.ethereum && localStorage.getItem('walletConnected') === 'true') {
    try {
      const contas = await window.ethereum.request({ method: 'eth_accounts' });

      if (contas.length > 0) {
        walletAddress = contas[0];
        atualizarEstadoCarteira();
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

// ==================== BLOCO 17 — INICIALIZAÇÃO DA GALERIA 3D ====================

function iniciarGaleria() {
  // 1. Criar as obras normais do círculo rotativo
  criarObrasNormais();
}

// Executar ao carregar a página
window.addEventListener('load', iniciarGaleria);


// ==================== BLOCO 18 — ENCERRAMENTO SEGURO DA GALERIA ====================

window.addEventListener('beforeunload', () => {
  console.log('A encerrar a galeria NANdART e a limpar recursos...');
  renderer.dispose();
  textureLoader.dispose();
  // Outras operações de limpeza podem ser incluídas aqui, se necessário.
});

// ==================== BLOCO 19 — EVENTOS ADICIONAIS E MELHORIAS ====================

const navIcons = document.querySelector('.navigation-icons');
if (navIcons) {
  navIcons.style.position = 'absolute'; // Posicionamento absoluto na cena
  navIcons.style.top = '1.5%';
  navIcons.style.left = '1.5%';
  navIcons.style.zIndex = '100'; // Fica sempre à frente
}

const infoPanel = document.getElementById('info-panel');
if (infoPanel) {
  infoPanel.classList.add('painel-informativo-ajustado');
}

function aplicarDesfoqueFundo(ativo) {
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.style.backdropFilter = ativo ? 'blur(8px)' : 'none';
    overlay.style.display = ativo ? 'block' : 'none';
  }
}

function destacarObraComFundo(obra) {
  destacarObra(obra);
  aplicarDesfoqueFundo(true);
}

function fecharObraDestacadaComFundo() {
  fecharObraDestacada();
  aplicarDesfoqueFundo(false);
}

window.addEventListener('pointerdown', (e) => {
  if (!obraDestacada || infoPanel.contains(e.target)) return;
  fecharObraDestacadaComFundo();
});

const velocidadeObrasLenta = 0.05;
function animarObrasCirculares(delta) {
  const velocidade = obraDestacada ? velocidadeObrasLenta : velocidadeObras;
  anguloAtual += velocidade * delta;

  const raio = config.circleRadius;
  obrasNormais.forEach((obra, i) => {
    if (obra === obraDestacada) return;
    const angulo = (i / obrasNormais.length) * Math.PI * 2 + anguloAtual;
    obra.position.set(Math.cos(angulo) * raio, 4.2, Math.sin(angulo) * raio);
    obra.lookAt(0, 4.2, 0);
  });
}

const walletBtn = document.getElementById('wallet-button');
if (walletBtn) {
  walletBtn.style.position = 'absolute';
  walletBtn.style.top = '1.5%';
  walletBtn.style.right = '1.5%';
  walletBtn.style.zIndex = '100';
}

console.log('✅ BLOCO 19 concluído com melhorias visuais e de comportamento.');

// ==================== BLOCO 20 — FINALIZAÇÃO E INICIALIZAÇÃO SEGURA ====================

function iniciarGaleria() {
  if (window._galeriaIniciada) {
    console.warn('⚠️ A galeria já foi iniciada. Ignorando nova inicialização.');
    return;
  }
  window._galeriaIniciada = true;

  criarObrasNormais();

  console.log('🔍 A verificar integridade visual e interativa da galeria...');
  aplicarDesfoqueFundo(false);

  console.log('%c🎨 Galeria 3D NANdART inicializada com sucesso!', 'color:#d8b26c;font-size:16px;');
}

window.addEventListener('DOMContentLoaded', iniciarGaleria);

console.log('%c🖼️ BLOCO 25 concluído: inicialização, ajustes e verificação final da galeria!', 'color:#8a5c21;font-size:14px;');

// ==================== BLOCO 21 — FUNÇÃO PRINCIPAL DE ANIMAÇÃO ====================

function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();

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

  renderer.render(scene, camera);
}

animate();
