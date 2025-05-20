import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// 📱 Sistema de responsividade refinado
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

// 🔗 Botão Connect Wallet + Disconnect
const botaoConectar = document.getElementById('connect-wallet');

async function conectarCarteira() {
  if (!window.ethereum) {
    alert('Instala a MetaMask ou outra carteira Web3 para interagir com a galeria.');
    return;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const endereco = await signer.getAddress();
    const enderecoResumido = endereco.slice(0, 6) + '...' + endereco.slice(-4);

    botaoConectar.textContent = `${enderecoResumido} | Disconnect`;
    botaoConectar.dataset.connected = 'true';
  } catch (err) {
    console.error('Erro ao conectar carteira:', err);
    alert('Ocorreu um erro ao tentar conectar a carteira.');
  }
}

botaoConectar?.addEventListener('click', () => {
  if (botaoConectar.dataset.connected === 'true') {
    botaoConectar.textContent = 'Connect Wallet';
    botaoConectar.dataset.connected = 'false';
  } else {
    conectarCarteira();
  }
});

async function verificarLigacaoInicial() {
  if (typeof window.ethereum !== 'undefined') {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contas = await provider.listAccounts();

    if (contas.length > 0) {
      const endereco = contas[0];
      const enderecoResumido = endereco.slice(0, 6) + '...' + endereco.slice(-4);
      botaoConectar.textContent = `${enderecoResumido} | Disconnect`;
      botaoConectar.dataset.connected = 'true';
    }
  }
}
verificarLigacaoInicial();
// 💡 Iluminação ambiente triplicada (sem afetar obras ou imagens)
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 1.4);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 1.4);
const luzAmbiente3 = new THREE.AmbientLight(0xfff2dd, 1.4);
scene.add(luzAmbiente1, luzAmbiente2, luzAmbiente3);

// Luz hemisférica com brilho subtil de fundo
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.4);
scene.add(luzHemisferica);

// Luz rasante lateral para dar realce tridimensional
const luzRasanteEsquerda = new THREE.SpotLight(0xfff2dd, 0.8);
luzRasanteEsquerda.position.set(-10, 8, 0);
luzRasanteEsquerda.angle = Math.PI / 6;
luzRasanteEsquerda.penumbra = 0.3;
luzRasanteEsquerda.decay = 2;
luzRasanteEsquerda.distance = 25;
luzRasanteEsquerda.castShadow = true;
luzRasanteEsquerda.shadow.mapSize.set(1024, 1024);
luzRasanteEsquerda.shadow.bias = -0.0005;
scene.add(luzRasanteEsquerda);

// 🧱 Pavimento reflexivo estilo obsidiana líquida
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x000000,
  recursion: 2
});
floor.material.opacity = 0.88;
floor.material.roughness = 0.015;
floor.material.metalness = 0.98;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.4;
floor.material.reflectivity = 0.985;
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ✨ Círculo de luz redesenhado — com base na imagem layout.jpeg
const circle = new THREE.Mesh(
  new THREE.RingGeometry(4.2, 4.56, 120),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.5,
    metalness: 0.75,
    roughness: 0.1,
    transparent: true,
    opacity: 0.93,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.052;
circle.receiveShadow = true;
scene.add(circle);

// Friso horizontal dourado vivo abaixo do círculo
const frisoChao = new THREE.Mesh(
  new THREE.BoxGeometry(36, 0.06, 0.03),
  new THREE.MeshStandardMaterial({
    color: 0xd8b26c,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x3a2a0a,
    emissiveIntensity: 0.25
  })
);
frisoChao.position.set(0, 0.032, -config.wallDistance / 2 + 0.8);
scene.add(frisoChao);

// 🎨 Material dourado vivo fiel à imagem "dourado para friso.png"
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21, // #8a5c21
  metalness: 1,
  roughness: 0.08,
  emissive: 0x2f1b08,
  emissiveIntensity: 0.33
});

// Função para frisos lineares simples
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

// Função para frisos retangulares com 4 lados
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
// 🟡 Friso central redesenhado com respiro visual
criarFrisoRect(
  0,               // X
  10.3,            // Y (centro vertical do friso)
  -config.wallDistance + 0.01, // Z (junto à parede central)
  6.8,             // Largura
  7.0              // Altura
);

// Friso interior horizontal acima do quadro central
criarFrisoLinha(
  0,
  13.1,
  -config.wallDistance + 0.012,
  4.5
);

// 🟡 Frisos duplos verticais laterais com estrutura dupla
const posXFrisoLateral = 6.7;
const alturaFrisoExt = 8.8;
const alturaFrisoInt = 7.1;

// Lado esquerdo
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// Lado direito
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// 🟡 Frisos horizontais inferiores contínuos nas 3 paredes
criarFrisoLinha(0, 1.3, -config.wallDistance + 0.01, 36);     // fundo superior
criarFrisoLinha(0, 1.0, -config.wallDistance + 0.012, 36);    // fundo inferior
criarFrisoLinha(-16.2, 1.3, -config.wallDistance / 2, 2.2);   // lateral esq. sup.
criarFrisoLinha(-16.2, 1.0, -config.wallDistance / 2, 2.2);   // lateral esq. inf.
criarFrisoLinha(16.2, 1.3, -config.wallDistance / 2, 2.2);    // lateral dir. sup.
criarFrisoLinha(16.2, 1.0, -config.wallDistance / 2, 2.2);    // lateral dir. inf.

// 🧱 Geometria base das paredes
const paredeGeoFundo = new THREE.PlaneGeometry(40, 30);
const paredeGeoLateral = new THREE.PlaneGeometry(30, 28);

// Função utilitária para aplicar a textura antracite às três paredes
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

  // 🧱 Parede de fundo (central)
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
  paredeFundo.position.set(0, 13.6, -config.wallDistance - 4.1);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // 🧱 Parede lateral esquerda
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeEsquerda.position.set(-14.6, 13.4, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // 🧱 Parede lateral direita
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeDireita.position.set(14.6, 13.4, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
};

// 🌌 Carregamento da textura antracite com fallback remoto
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

// 🟫 Moldura escura saliente com profundidade realista
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

  // Moldura escura com relevo e profundidade
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

  // Pintura com textura correspondente
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

  // Posicionamento final sobre a parede lateral
  grupoQuadro.position.set(x, y, z);
  grupoQuadro.rotation.y = rotY;
  scene.add(grupoQuadro);
});
// 🟡 Material dourado realista para o topo dos pedestais
const materialDouradoPedestal = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.08,
  clearcoat: 0.9,
  clearcoatRoughness: 0.05,
  emissive: 0x4a320a,
  emissiveIntensity: 0.25,
  reflectivity: 0.6
});

// 💠 Textura da gema facetada
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// Função para criar vitrine completa com pedestal e gema
function criarVitrine(x, z, indice) {
  const alturaPedestal = 4.6;
  const alturaVitrine = 1.6;
  const alturaGema = alturaPedestal + alturaVitrine / 2 + 0.25;
  const intensidade = 2.4;

  // 🟥 Pedestal negro com base sólida
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, alturaPedestal, 1.05),
    new THREE.MeshStandardMaterial({
      color: 0x121212,
      roughness: 0.5,
      metalness: 0.25
    })
  );
  pedestal.position.set(x, alturaPedestal / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // 🟡 Tampa dourada superior
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaPedestal + 0.03, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // 🔲 Vitrine translúcida em vidro
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, alturaVitrine, 1.0),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.42,
      transparent: true,
      opacity: 0.14,
      ior: 1.45,
      reflectivity: 0.7,
      clearcoat: 0.85,
      clearcoatRoughness: 0.05
    })
  );
  vitrine.position.set(x, alturaPedestal + alturaVitrine / 2 + 0.06, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // 💎 Gema flutuante facetada com brilho pulsante
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: 0x3377cc,
      emissiveIntensity: intensidade,
      transparent: true,
      opacity: 0.95
    })
  );
  gema.position.set(x, alturaGema, z);
  gema.rotation.y = indice * 0.3;
  gema.castShadow = true;
  scene.add(gema);
}

// 📍 Criação das quatro vitrines alinhadas com o círculo de luz (layout preciso)
criarVitrine(-9.4, -4.45, 0); // Esquerda traseira
criarVitrine(-9.4, 4.45, 1);  // Esquerda frontal
criarVitrine(9.4, -4.45, 2);  // Direita traseira
criarVitrine(9.4, 4.45, 3);   // Direita frontal
// 🔤 Carregamento da fonte e criação do texto NANdART
const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: config.textSize + 0.1,
      height: 0.12,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 5
    });

    textGeo.computeBoundingBox();
    const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: 0xc49b42,               // Dourado fiel (extraído de "dourado para nandart.png")
        metalness: 1,
        roughness: 0.25,
        emissive: 0x2c1d07,
        emissiveIntensity: 0.45
      })
    );

    // Posicionamento do nome — centrado e com profundidade
    texto.position.set(-largura / 2, 15.5, -config.wallDistance - 3.98);
    texto.castShadow = true;
    scene.add(texto);

    // Luz suave direcionada ao nome
    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.3, 12, Math.PI / 9, 0.4);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);
// ✨ Reflexos animados subtis — frisos, molduras e gemas
scene.traverse(obj => {
  // Frisos dourados com brilho pulsante
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.emissiveIntensity &&
    obj.material.color?.getHex() === 0x8a5c21
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.45,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  // Molduras escuras com leve emissividade
  if (
    obj.isMesh &&
    obj.material?.emissive &&
    obj.material?.color?.getHex() === 0x1e1a16
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.25,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  // Gemas com emissão pulsante intensa
  if (
    obj.isMesh &&
    obj.material?.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 2.8,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});
// 🎯 Interação com obras suspensas e modal informativo moderno

let obraSelecionada = null;
let velocidadeObras = 0.00012;
let cameraOriginalPos = camera.position.clone();
let cameraIsAnimating = false;

// Criar overlay de fundo desfocado
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  backdrop-filter: blur(6px); z-index: 50; display: none;
`;
document.body.appendChild(overlay);

// Criar painel informativo translúcido
const infoPanel = document.createElement('div');
infoPanel.style.cssText = `
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, 0);
  margin-top: calc(260px + 10px); padding: 20px;
  background: rgba(255,255,255,0.07); backdrop-filter: blur(4px);
  border-radius: 12px; color: #fffbe6; font-family: Georgia, serif;
  text-align: center; z-index: 60; display: none;
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

// Referências aos elementos
const modalTitulo = infoPanel.querySelector('#art-title');
const modalArtista = infoPanel.querySelector('#art-artist');
const modalAno = infoPanel.querySelector('#art-year');
const modalDescricao = infoPanel.querySelector('#art-description');
const modalPreco = infoPanel.querySelector('#art-price');
const botaoComprar = infoPanel.querySelector('#buy-art');

// Abrir modal com animação e dados
function abrirModal(dados, obra) {
  if (obraSelecionada) return;

  obraSelecionada = obra;
  overlay.style.display = 'block';
  infoPanel.style.display = 'block';

  modalTitulo.textContent = dados.titulo;
  modalArtista.textContent = dados.artista;
  modalAno.textContent = dados.ano;
  modalDescricao.textContent = dados.descricao || 'Obra exclusiva da galeria NANdART';
  modalPreco.textContent = `${dados.preco} ETH`;

  // Centralizar obra visualmente (centro vertical e horizontal)
  gsap.to(obra.scale, { x: 2, y: 2, duration: 0.8, ease: 'power2.out' });
  gsap.to(obra.position, {
    x: 0, y: 10.5, z: 0,
    duration: 0.9, ease: 'power2.inOut'
  });

  // Mover câmara para ver a obra e o painel
  gsap.to(camera.position, {
    x: 0, y: 10.5, z: 5.5,
    duration: 1.1, ease: 'power2.inOut'
  });

  // Desacelerar suavemente
  gsap.to(window, {
    duration: 1.5,
    ease: 'power2.out',
    onUpdate: () => {
      velocidadeObras = gsap.getProperty(window, 'velocidadeObras') || 0.00004;
    },
    onStart: () => {
      gsap.set(window, { velocidadeObras: velocidadeObras });
    },
    velocidadeObras: 0.00004
  });

  cameraIsAnimating = true;
  setTimeout(() => { cameraIsAnimating = false; }, 1200);
}
// Fechar modal e restaurar tudo
window.addEventListener('pointerdown', e => {
  if (!obraSelecionada || cameraIsAnimating) return;
  if (!infoPanel.contains(e.target)) {
    gsap.to(obraSelecionada.scale, { x: 1, y: 1, duration: 0.6 });
    gsap.to(obraSelecionada.position, {
      y: 4.2, duration: 0.6,
      onComplete: () => {
        overlay.style.display = 'none';
        infoPanel.style.display = 'none';
        obraSelecionada = null;
      }
    });

    gsap.to(camera.position, {
      x: cameraOriginalPos.x,
      y: cameraOriginalPos.y,
      z: cameraOriginalPos.z,
      duration: 0.8
    });

    // Restaurar velocidade original
    gsap.to(window, {
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        velocidadeObras = gsap.getProperty(window, 'velocidadeObras') || 0.00012;
      },
      velocidadeObras: 0.00012
    });
  }
});
// Detectar clique numa obra
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
    const index = obrasNormais.indexOf(obra);
    const dados = dadosObras[index];
    abrirModal(dados, obra);
  }
});
// Compra real com ethers.js
async function buyHandler(dados) {
  if (!window.ethereum) {
    alert('Instala a MetaMask para poder adquirir esta obra.');
    return;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const valorETH = ethers.parseEther(dados.preco);

    const tx = await signer.sendTransaction({
      to: '0xAbCdEf1234567890abcdef1234567890ABcDef12',
      value: valorETH
    });

    alert(`Transação enviada!\nHash: ${tx.hash}`);
    await tx.wait();
    alert('Compra confirmada! Muito obrigado por adquirir esta obra.');
  } catch (err) {
    console.error('Erro ao comprar a obra:', err);
    alert('Ocorreu um erro durante a compra. Por favor tenta novamente.');
  }
}
// Evento de clique no botão "Buy"
botaoComprar.addEventListener('click', () => {
  if (obraSelecionada) {
    const index = obrasNormais.indexOf(obraSelecionada);
    const dados = dadosObras[index];
    buyHandler(dados);
  }
});
// 🌐 Botão "Connect Wallet" com ligação e desconexão via MetaMask
const walletButton = document.createElement('button');
walletButton.id = 'wallet-button';
walletButton.textContent = 'Connect Wallet';
walletButton.style.cssText = `
  position: fixed; top: 18px; right: 20px; z-index: 100;
  padding: 10px 18px; font-size: 1em;
  background-color: #d8b26c; color: #111;
  border: none; border-radius: 6px;
  font-family: 'Playfair Display', serif;
  cursor: pointer; box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  transition: background-color 0.3s ease;
`;
document.body.appendChild(walletButton);

let walletAddress = null;

walletButton.addEventListener('click', async () => {
  if (walletAddress) {
    // Desligar
    walletAddress = null;
    walletButton.textContent = 'Connect Wallet';
    walletButton.style.backgroundColor = '#d8b26c';
    return;
  }

  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      walletAddress = accounts[0];
      const abreviado = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      walletButton.textContent = abreviado;
      walletButton.style.backgroundColor = '#bca05c';
    } catch (err) {
      console.error('Erro ao ligar à carteira:', err);
      alert('Não foi possível ligar à carteira.');
    }
  } else {
    alert('MetaMask não está instalada. Instala para usar esta funcionalidade.');
  }
});
// 🚀 Animação contínua com controlo de velocidade e reflexos suaves
function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -velocidadeObras;

  obrasNormais.forEach((obra, i) => {
    // Evita movimentar a obra seleccionada
    if (obra !== obraSelecionada) {
      const angulo = tempo + (i / obrasNormais.length) * Math.PI * 2;
      const x = Math.cos(angulo) * config.circleRadius;
      const z = Math.sin(angulo) * config.circleRadius;
      const rotacaoY = -angulo + Math.PI;

      // Actualizar posição e rotação da obra
      obra.position.x = x;
      obra.position.z = z;
      obra.rotation.y = rotacaoY;

      // Actualizar reflexo correspondente suavemente
      const reflexo = obra.userData?.reflexo;
      if (reflexo) {
        reflexo.userData.targetPos.set(x, -0.01, z);
        reflexo.userData.targetRot.set(0, rotacaoY, 0);
        reflexo.position.lerp(reflexo.userData.targetPos, 0.1);
        reflexo.rotation.y += (rotacaoY - reflexo.rotation.y) * 0.1;
      }
    }
  });

  renderer.render(scene, camera);
}
animate();
// 🌐 Botão "Connect Wallet" com ligação e desconexão via MetaMask
const walletButton = document.createElement('button');
walletButton.id = 'wallet-button';
walletButton.textContent = 'Connect Wallet';
walletButton.style.cssText = `
  position: fixed; top: 18px; right: 20px; z-index: 100;
  padding: 10px 18px; font-size: 1em;
  background-color: #d8b26c; color: #111;
  border: none; border-radius: 6px;
  font-family: 'Playfair Display', serif;
  cursor: pointer; box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
  transition: background-color 0.3s ease;
`;
document.body.appendChild(walletButton);

let walletAddress = null;

walletButton.addEventListener('click', async () => {
  if (walletAddress) {
    // Desligar
    walletAddress = null;
    walletButton.textContent = 'Connect Wallet';
    walletButton.style.backgroundColor = '#d8b26c';
    return;
  }

  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      walletAddress = accounts[0];
      const abreviado = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      walletButton.textContent = abreviado;
      walletButton.style.backgroundColor = '#bca05c';
    } catch (err) {
      console.error('Erro ao ligar à carteira:', err);
      alert('Não foi possível ligar à carteira.');
    }
  } else {
    alert('MetaMask não está instalada. Instala para usar esta funcionalidade.');
  }
});
// Garantir foco e acessibilidade para teclado/tab
walletButton.setAttribute('aria-label', 'Connect Wallet');
walletButton.setAttribute('tabindex', '0');
walletButton.setAttribute('role', 'button');

// Responsividade adicional (opcional)
window.addEventListener('resize', () => {
  if (window.innerWidth < 600) {
    walletButton.style.fontSize = '0.85em';
    walletButton.style.padding = '8px 14px';
  } else {
    walletButton.style.fontSize = '1em';
    walletButton.style.padding = '10px 18px';
  }
});

