import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Responsividade refinada com níveis
function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5, textSize: 0.4 },
  SM: { obraSize: 1.0, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5, textSize: 0.45 },
  MD: { obraSize: 1.1, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5, textSize: 0.5 },
  LG: { obraSize: 1.2, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 6.2, config.cameraZ + 14.5);
  camera.lookAt(0, 7.2, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

// Duplicação da iluminação ambiente com subtileza e brilho amplo
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 0.85);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 0.85);
scene.add(luzAmbiente1, luzAmbiente2);

// Luz hemisférica subtil para tonalidade de fundo
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.4);
scene.add(luzHemisferica);

// Luz rasante lateral esquerda (efeito dramático)
const luzRasanteEsquerda = new THREE.SpotLight(0xfff2dd, 0.75);
luzRasanteEsquerda.position.set(-10, 8, 0);
luzRasanteEsquerda.angle = Math.PI / 6;
luzRasanteEsquerda.penumbra = 0.3;
luzRasanteEsquerda.decay = 2;
luzRasanteEsquerda.distance = 25;
luzRasanteEsquerda.castShadow = true;
luzRasanteEsquerda.shadow.mapSize.width = 1024;
luzRasanteEsquerda.shadow.mapSize.height = 1024;
luzRasanteEsquerda.shadow.bias = -0.0005;
scene.add(luzRasanteEsquerda);

// Atualização dinâmica ao redimensionar
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// 🪞 Pavimento reflectivo e translúcido com acabamento físico
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x000000,
  recursion: 2
});

floor.material.opacity = 0.85;
floor.material.roughness = 0.02;
floor.material.metalness = 0.98;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.4;
floor.material.reflectivity = 0.98;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ✨ Círculo de luz ampliado e vivo
const circle = new THREE.Mesh(
  new THREE.RingGeometry(4.3, 4.55, 100),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.8,
    metalness: 0.75,
    roughness: 0.1,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.051;
circle.receiveShadow = true;
scene.add(circle);

// Friso horizontal dourado vivo após o círculo de luz
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
// Material dourado vivo para todos os frisos da galeria
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0xf3cc80,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x3a240a,
  emissiveIntensity: 0.35
});

// Função para frisos horizontais ou verticais simples (linha reta)
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

// Função para frisos rectangulares com vértices arredondados (sem bicos)
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
// 🟡 Friso central ajustado (dobro do tamanho anterior, sem bicos)
const frisoCentral = criarFrisoRect(0, 10.3, -config.wallDistance + 0.01, 6.4, 6.4);

// Friso horizontal interior — dentro do friso central e paralelo ao topo
criarFrisoLinha(0, 12.25, -config.wallDistance + 0.012, 4.5);

// 🟡 Frisos laterais duplos com topo alinhado ao friso central e maior extensão inferior
// Lado esquerdo — externo
criarFrisoRect(-7.6, 10.3, -config.wallDistance + 0.01, 3.2, 9.2);
// Lado esquerdo — interno
criarFrisoRect(-7.6, 10.3, -config.wallDistance + 0.012, 1.7, 7.5);

// Lado direito — externo
criarFrisoRect(7.6, 10.3, -config.wallDistance + 0.01, 3.2, 9.2);
// Lado direito — interno
criarFrisoRect(7.6, 10.3, -config.wallDistance + 0.012, 1.7, 7.5);
// 🟡 Frisos horizontais inferiores — paralelos e contínuos com as paredes laterais
// Parede de fundo — dois frisos paralelos
criarFrisoLinha(0, 1.3, -config.wallDistance + 0.01, 36);  // superior
criarFrisoLinha(0, 1.0, -config.wallDistance + 0.012, 36); // inferior

// Paredes laterais — continuidade do friso superior
criarFrisoLinha(-16.2, 1.3, -config.wallDistance / 2, 2.2); // esquerda superior
criarFrisoLinha(16.2, 1.3, -config.wallDistance / 2, 2.2);  // direita superior

// Paredes laterais — continuidade do friso inferior
criarFrisoLinha(-16.2, 1.0, -config.wallDistance / 2, 2.2); // esquerda inferior
criarFrisoLinha(16.2, 1.0, -config.wallDistance / 2, 2.2);  // direita inferior
// 🖼️ Quadro central — centrado dentro do novo friso central
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroCentralGrupo = new THREE.Group();
const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

// Moldura escura com relevo e proporções fiéis
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

// Pintura principal centrada
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

// Posicionamento dentro do friso
quadroCentralGrupo.position.set(0, 10.3, -config.wallDistance + 0.001);
scene.add(quadroCentralGrupo);
// 🧱 Paredes com textura antracite realista (com fallback)
const paredeGeoFundo = new THREE.PlaneGeometry(40, 30);
const paredeGeoLateral = new THREE.PlaneGeometry(30, 28);

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

  // Parede de fundo
  const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
  paredeFundo.position.set(0, 13.4, -config.wallDistance - 4.1);
  paredeFundo.receiveShadow = true;
  scene.add(paredeFundo);

  // Parede lateral esquerda
  const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeEsquerda.position.set(-14.6, 13.2, -config.wallDistance / 2);
  paredeEsquerda.rotation.y = Math.PI / 2;
  paredeEsquerda.receiveShadow = true;
  scene.add(paredeEsquerda);

  // Parede lateral direita
  const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
  paredeDireita.position.set(14.6, 13.2, -config.wallDistance / 2);
  paredeDireita.rotation.y = -Math.PI / 2;
  paredeDireita.receiveShadow = true;
  scene.add(paredeDireita);
};

// Carregamento da textura local com fallback remoto
textureLoader.load(
  '/assets/antracite-realista.jpg',
  texturaLocal => {
    console.log('✅ Textura antracite local carregada com sucesso.');
    aplicarTexturaParede(texturaLocal);
  },
  undefined,
  () => {
    console.warn('⚠️ Falha ao carregar textura local. A usar versão remota.');
    textureLoader.load(
      'https://nandart.art/assets/antracite-realista.jpg',
      texturaRemota => aplicarTexturaParede(texturaRemota),
      undefined,
      err => console.error('❌ Erro ao carregar a textura remota:', err)
    );
  }
);
// 🖼️ Quadros laterais com moldura saliente e dimensão duplicada
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.5,
    y: 8.5,
    z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.5,
    y: 8.5,
    z: -config.wallDistance / 2,
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

  // Moldura escura com relevo saliente
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(largura + 0.3, altura + 0.3, 0.16),
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

  // Pintura central
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

  // Posicionamento final na parede lateral
  grupoQuadro.position.set(x, y, z + 0.01);
  grupoQuadro.rotation.y = rotY;
  scene.add(grupoQuadro);
});
// Material dourado para o topo do pedestal
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

// Textura da gema facetada
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// Função para criar vitrines com pedestal fiel ao layout
function criarVitrine(x, z, indice) {
  const alturaPedestal = 4.2;
  const alturaVitrine = 1.5;
  const alturaGema = alturaPedestal + alturaVitrine / 2 + 0.2;
  const emissivaBase = 0x3377cc;
  const intensidade = 2.2;

  // Pedestal sólido e elevado
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

  // Tampa dourada
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaPedestal + 0.03, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // Vitrine repousada sobre o pedestal (não embutida)
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, alturaVitrine, 1.0),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.4,
      transparent: true,
      opacity: 0.13,
      ior: 1.45,
      reflectivity: 0.65,
      clearcoat: 0.85,
      clearcoatRoughness: 0.05
    })
  );
  vitrine.position.set(x, alturaPedestal + alturaVitrine / 2 + 0.06, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Gema facetada mágica
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: emissivaBase,
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

// Criação das quatro vitrines nos pedestais
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);
// ✨ Nome NANdART com dourado real e presença central
const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: 0.7,
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
        color: 0xc49b42, // tom dourado do layout fornecido
        metalness: 1,
        roughness: 0.25,
        emissive: 0x2c1d07,
        emissiveIntensity: 0.45
      })
    );

    texto.position.set(-largura / 2, 15.6, -config.wallDistance - 3.98);
    texto.castShadow = true;
    scene.add(texto);

    // Luz subtil e centralizada sobre o texto
    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.3, 12, Math.PI / 9, 0.4);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);
// 🖼️ Obras circulantes suspensas com reflexos no chão
const obraPaths = [
  "/assets/obras/obra1.jpg",
  "/assets/obras/obra2.jpg",
  "/assets/obras/obra3.jpg",
  "/assets/obras/obra4.jpg",
  "/assets/obras/obra5.jpg",
  "/assets/obras/obra6.jpg",
  "/assets/obras/obra7.jpg",
  "/assets/obras/obra8.jpg"
];

const obrasNormais = [];

obraPaths.forEach((src, i) => {
  const texture = textureLoader.load(src);
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const x = Math.cos(ang) * config.circleRadius;
  const z = Math.sin(ang) * config.circleRadius;
  const ry = -ang + Math.PI;

  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );
  obra.position.set(x, 4.2, z);
  obra.rotation.y = ry;
  obra.castShadow = true;
  scene.add(obra);

  // Reflexo invertido e translúcido
  const reflexo = obra.clone();
  reflexo.position.y = -0.01;
  reflexo.scale.y = -1;
  reflexo.material = obra.material.clone();
  reflexo.material.opacity = 0.2;
  reflexo.material.transparent = true;
  reflexo.material.depthWrite = false;
  reflexo.material.roughness = 0.5;
  reflexo.material.metalness = 0.6;
  reflexo.renderOrder = 1;
  scene.add(reflexo);

  obra.userData.reflexo = reflexo;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();

  obrasNormais.push(obra);
});
// ✨ Animação contínua das obras suspensas e dos reflexos
function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -0.00012;
  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(ang) * config.circleRadius;
    const z = Math.sin(ang) * config.circleRadius;
    const ry = -ang + Math.PI;

    obra.position.x = x;
    obra.position.z = z;
    obra.rotation.y = ry;

    const reflexo = obra.userData.reflexo;
    if (reflexo) {
      reflexo.userData.targetPos.set(x, -0.01, z);
      reflexo.userData.targetRot.set(0, ry, 0);
      reflexo.position.lerp(reflexo.userData.targetPos, 0.1);
      reflexo.rotation.y += (ry - reflexo.rotation.y) * 0.1;
    }
  });

  renderer.render(scene, camera);
}

animate();