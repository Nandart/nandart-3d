import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';
import { obrasSuspensas } from './data/obras-suspensas.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// 📱 Sistema de responsividade refinado (XS, SM, MD, LG)
function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 12, cameraY: 5.4, textSize: 0.4 },
  SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 13, cameraY: 5.7, textSize: 0.45 },
  MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 14, cameraY: 6.1, textSize: 0.5 },
  LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 15, cameraY: 6.4, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

// 🎨 Cena e carregador de texturas
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
const textureLoader = new THREE.TextureLoader();

// 🎥 Câmara adaptativa
const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 6.5, config.cameraZ + 15.2);
  camera.lookAt(0, 7.3, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

// 🖥️ Renderizador com qualidade cinematográfica
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.25;

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Iluminação ambiente e direcional ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(15, 20, 15);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// === Círculo de luz no chão (ring light) fiel ao layout ===
const ringInnerRadius = 3.6;
const ringOuterRadius = 4.0;
const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);
const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
const ringLight = new THREE.Mesh(ringGeometry, ringMaterial);

ringLight.rotation.x = -Math.PI / 2; // Plano horizontal no chão
ringLight.position.set(0, 0.01, 0);  // Ligeiramente acima do chão para evitar z-fighting
scene.add(ringLight);

// Base do chão com leve reflexo (obrigatório para realismo)
const floorGeometry = new THREE.PlaneGeometry(50, 50);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a0a0a,
  roughness: 0.35,
  metalness: 0.8
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
// Geometrias base das paredes
const paredeGeoFundo = new THREE.PlaneGeometry(40, 30);
const paredeGeoLateral = new THREE.PlaneGeometry(30, 28);

// Função utilitária para aplicar textura antracite às paredes
const aplicarTexturaParede = textura => {
  const paredeMaterial = new THREE.MeshStandardMaterial({
    map: textura,
    color: 0xffffff,
    emissive: new THREE.Color(0x111111),
    emissiveIntensity: 0.25,
    roughness: 0.65,
    metalness: 0.15,
    side: THREE.FrontSide
  });

  // Parede de fundo (central)
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
  paredeFundo.position.set(0, 13.6, -config.wallDistance - 4.1);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // Parede lateral esquerda
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeEsquerda.position.set(-14.6, 13.4, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // Parede lateral direita
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeDireita.position.set(14.6, 13.4, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
};

// Carregar textura antracite com fallback remoto
textureLoader.load(
  '/assets/antracite-realista.jpg',
  texturaLocal => {
    console.log('✅ Textura antracite local carregada.');
    aplicarTexturaParede(texturaLocal);
  },
  undefined,
  () => {
    console.warn('⚠️ Falha ao carregar textura local. A usar versão remota...');
    textureLoader.load(
      'https://nandart.art/assets/antracite-realista.jpg',
      texturaRemota => aplicarTexturaParede(texturaRemota),
      undefined,
      err => console.error('❌ Erro ao carregar textura remota:', err)
    );
  }
);

// Material dourado para frisos (cor exata conforme imagem "dourado para friso.png")
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x2f1b08,
  emissiveIntensity: 0.33
});

// Função para criar friso linear simples (linha horizontal)
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = false;
  scene.add(friso);
  return friso;
}

// Função para friso retangular (moldura com 4 lados)
function criarFrisoRect(x, y, z, largura, altura, rotY = 0) {
  const group = new THREE.Group();
  const espessura = 0.06;

  const topo = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  topo.position.set(0, altura / 2, 0);
  group.add(topo);

  const base = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  base.position.set(0, -altura / 2, 0);
  group.add(base);

  const esquerda = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02), frisoMaterial);
  esquerda.position.set(-largura / 2 + espessura / 2, 0, 0);
  group.add(esquerda);

  const direita = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02), frisoMaterial);
  direita.position.set(largura / 2 - espessura / 2, 0, 0);
  group.add(direita);

  group.position.set(x, y, z);
  group.rotation.y = rotY;
  scene.add(group);
  return group;
}

// Friso central (moldura com maior respiro visual)
criarFrisoRect(
  0,                  // X
  10.3,               // Y (centro vertical do friso)
  -config.wallDistance + 0.01, // Z (junto à parede central)
  6.8,                // Largura
  7.0                 // Altura
);

// Friso interior horizontal acima do quadro central
criarFrisoLinha(
  0,
  13.1,
  -config.wallDistance + 0.012,
  4.5
);

// Frisos duplos verticais laterais com estrutura dupla
const posXFrisoLateral = 6.7;
const alturaFrisoExt = 8.8;
const alturaFrisoInt = 7.1;

// Lado esquerdo
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// Lado direito
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// Frisos horizontais inferiores contínuos nas 3 paredes
criarFrisoLinha(0, 1.3, -config.wallDistance + 0.01, 36);     // fundo superior
criarFrisoLinha(0, 1.0, -config.wallDistance + 0.012, 36);    // fundo inferior
criarFrisoLinha(-16.2, 1.3, -config.wallDistance / 2, 2.2);   // lateral esq. sup.
criarFrisoLinha(-16.2, 1.0, -config.wallDistance / 2, 2.2);   // lateral esq. inf.
criarFrisoLinha(16.2, 1.3, -config.wallDistance / 2, 2.2);    // lateral dir. sup.
criarFrisoLinha(16.2, 1.0, -config.wallDistance / 2, 2.2);    // lateral dir. inf.
// 🖼️ Textura da obra central (com fallback em caso de erro)
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroCentralGrupo = new THREE.Group();

// 📐 Dimensões reais da pintura sem moldura
const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

// 🟫 Moldura escura saliente com profundidade realista para quadro central
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

// 🖼️ Pintura central com leve metalização
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

// 📌 Posicionamento final da obra central
quadroCentralGrupo.position.set(
  0,                     // X — centro horizontal
  10.3,                  // Y — alinhado com o friso principal
  -config.wallDistance + 0.001 // Z — ligeiramente à frente da parede
);
scene.add(quadroCentralGrupo);

// 🖼️ Dados das obras nas paredes laterais
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.48,
    y: 11.6,
    z: -config.wallDistance / 2 + 0.01,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.48,
    y: 11.6,
    z: -config.wallDistance / 2 + 0.01,
    rotY: -Math.PI / 2
  }
];

// Criar e posicionar quadros laterais com molduras
obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(
    src,
    undefined,
    undefined,
    err => console.error(`Erro ao carregar ${src}:`, err)
  );

  const largura = 4.4;
  const altura = 6.4;

  const grupoQuadro = new THREE.Group();

  // Moldura escura saliente para quadro lateral
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(largura + 0.3, altura + 0.3, 0.18),
    new THREE.MeshStandardMaterial({
      color: 0x1e1a16,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x0d0c0a,
      emissiveIntensity: 0.15
    })
  );
  moldura.position.z = -0.1;
  grupoQuadro.add(moldura);

  // Pintura lateral com textura carregada
  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );
  quadro.position.z = 0.01;
  grupoQuadro.add(quadro);

  // Posicionar e rodar o quadro lateral na parede correta
  grupoQuadro.position.set(x, y, z);
  grupoQuadro.rotation.y = rotY;

  scene.add(grupoQuadro);
});
// Variável para controlar a obra que está aberta no modal
let obraSelecionada = null;
let cameraIsAnimating = false;

// Criar overlay desfocado para o fundo ao abrir modal
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  backdrop-filter: blur(6px);
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 50; display: none;
`;
document.body.appendChild(overlay);

// Painel informativo translúcido (modal)
const infoPanel = document.createElement('div');
infoPanel.style.cssText = `
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, 0);
  margin-top: calc(260px + 10px);
  padding: 20px;
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  color: #fffbe6;
  font-family: Georgia, serif;
  text-align: center;
  z-index: 60;
  display: none;
  max-width: 320px;
`;
infoPanel.innerHTML = `
  <div id="art-title" style="font-size: 1.6em; font-weight: bold;"></div>
  <div id="art-artist" style="margin-top: 6px;"></div>
  <div id="art-year" style="margin-top: 2px;"></div>
  <div id="art-description" style="margin-top: 10px; font-style: italic;"></div>
  <div id="art-price" style="margin-top: 10px; font-weight: bold;"></div>
  <button id="buy-art" style="
    margin-top: 16px; padding: 10px 18px;
    background-color: #d8b26c; color: #111;
    border: none; border-radius: 6px;
    font-size: 1em; cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
  ">Buy</button>
`;
document.body.appendChild(infoPanel);

// Referências aos elementos do modal
const modalTitulo = infoPanel.querySelector('#art-title');
const modalArtista = infoPanel.querySelector('#art-artist');
const modalAno = infoPanel.querySelector('#art-year');
const modalDescricao = infoPanel.querySelector('#art-description');
const modalPreco = infoPanel.querySelector('#art-price');
const botaoComprar = infoPanel.querySelector('#buy-art');

// Função para abrir o modal com dados e animações
function abrirModal(dados, cubo) {
  if (obraSelecionada) return; // Evitar abrir múltiplos modais

  obraSelecionada = cubo;
  overlay.style.display = 'block';
  infoPanel.style.display = 'block';

  modalTitulo.textContent = dados.titulo;
  modalArtista.textContent = dados.artista;
  modalAno.textContent = dados.ano;
  modalDescricao.textContent = dados.descricao || 'Obra exclusiva da galeria NANdART';
  modalPreco.textContent = `${dados.preco} ETH`;

  // Animações para destacar a obra no espaço
  gsap.to(cubo.scale, { x: 2, y: 2, z: 2, duration: 0.8, ease: 'power2.out' });
  gsap.to(cubo.position, { x: 0, y: 10.5, z: 0, duration: 0.9, ease: 'power2.inOut' });
  gsap.to(camera.position, { x: 0, y: 10.5, z: 5.5, duration: 1.1, ease: 'power2.inOut' });

  cameraIsAnimating = true;
  setTimeout(() => { cameraIsAnimating = false; }, 1200);
}

// Fechar modal ao clicar fora do painel
window.addEventListener('pointerdown', e => {
  if (!obraSelecionada || cameraIsAnimating) return;
  if (!infoPanel.contains(e.target)) {
    gsap.to(obraSelecionada.scale, { x: 1, y: 1, z: 1, duration: 0.6 });
    gsap.to(obraSelecionada.position, {
      y: 5, duration: 0.6, // voltar à posição original (y = 5 dos cubos)
      onComplete: () => {
        overlay.style.display = 'none';
        infoPanel.style.display = 'none';
        obraSelecionada = null;
      }
    });

    gsap.to(camera.position, {
      x: 0,
      y: 11,
      z: 15,
      duration: 0.8
    });
  }
});

// Detectar clique nos cubos suspensos usando raycaster
renderer.domElement.addEventListener('pointerdown', e => {
  if (obraSelecionada || cameraIsAnimating) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  // Obter interseções com cubos suspensos
  const intersects = raycaster.intersectObjects(cubosSuspensos);

  if (intersects.length > 0) {
    const cuboClicado = intersects[0].object;
    if (cuboClicado.onClick) {
      cuboClicado.onClick();
    }
  }
});

// Dentro do Bloco 4, logo após criar o modal e inserir o botão "Buy":
const botaoComprar = infoPanel.querySelector('#buy-art');

botaoComprar.addEventListener('click', () => {
  if (!obraSelecionada) return;
  const obra = obraSelecionada.userData.obra;
  buyHandler(obra);
});
async function buyHandler(obra) {
  if (!window.ethereum) {
    alert('Instala a MetaMask para poder adquirir esta obra.');
    return;
  }

  try {
    // Pedir permissões para ligar a carteira
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Valor em ETH convertido para Wei
    const valorETH = ethers.parseEther(obra.preco);

    // Endereço da galeria para receção do pagamento (substituir pelo endereço correto)
    const enderecoGaleria = '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41';

    // Criar e enviar transação
    const tx = await signer.sendTransaction({
      to: enderecoGaleria,
      value: valorETH
    });

    alert(`Transação enviada!\nHash: ${tx.hash}`);
    await tx.wait();

    alert('Compra confirmada! Muito obrigado por adquirir esta obra.');

    // Aqui poderá ser acrescentada lógica para atualizar UI ou estado após compra

  } catch (err) {
    console.error('Erro ao comprar a obra:', err);
    alert('Ocorreu um erro durante a compra. Por favor tenta novamente.');
  }
}
// Lista global para obras normais e seus dados
const obrasNormais = [];

const dadosObras = [
  {
    titulo: 'Obra 1',
    artista: 'Artista A',
    ano: '2024',
    descricao: 'Descrição da Obra 1.',
    preco: '0.5',
    imagem: '/assets/obras/obra1.jpg'
  },
  {
    titulo: 'Obra 2',
    artista: 'Artista B',
    ano: '2023',
    descricao: 'Descrição da Obra 2.',
    preco: '0.6',
    imagem: '/assets/obras/obra2.jpg'
  },
  {
    titulo: 'Obra 3',
    artista: 'Artista C',
    ano: '2025',
    descricao: 'Descrição da Obra 3.',
    preco: '0.45',
    imagem: '/assets/obras/obra3.jpg'
  }
  // Acrescenta mais obras conforme necessário
];

// Função para criar as obras normais e posicioná-las em círculo
function criarObrasNormais() {
  const raio = config.circleRadius;
  const tamanho = config.obraSize;

  dadosObras.forEach((dados, i) => {
    const textura = textureLoader.load(dados.imagem);

    const obraMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(tamanho * 1.3, tamanho * 1.6),
      new THREE.MeshStandardMaterial({
        map: textura,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true
      })
    );

    // Posição circular inicial
    const angulo = (i / dadosObras.length) * Math.PI * 2;
    obraMesh.position.set(
      Math.cos(angulo) * raio,
      4.2,
      Math.sin(angulo) * raio
    );
    obraMesh.lookAt(0, 4.2, 0);

    // Guardar índice para referência nos eventos
    obraMesh.userData = { index: i };

    scene.add(obraMesh);
    obrasNormais.push(obraMesh);
  });
}

criarObrasNormais();

// Detectar clique nas obras normais (integrado com raycaster)
renderer.domElement.addEventListener('pointerdown', e => {
  if (obraSelecionada || cameraIsAnimating) return;

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(obrasNormais);
  if (intersects.length > 0) {
    const obra = intersects[0].object;
    const index = obra.userData.index;
    const dados = dadosObras[index];
    abrirModal(dados, obra);
  }
});
// Relógio para calcular delta time e garantir animação suave
const relogio = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = relogio.getDelta();

  // Animar as obras normais em círculo
  animarObrasCirculares(delta);

  // Aqui podes adicionar outras animações ou atualizações

  renderer.render(scene, camera);
}

animate();
