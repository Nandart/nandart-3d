import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

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
  camera.position.set(0, config.cameraY + 5.8, config.cameraZ + 13);
  camera.lookAt(0, 7, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.0;

// Iluminação — ajustada para ambiente mais claro, sem exageros
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 0.45);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 0.45);
scene.add(luzAmbiente1, luzAmbiente2);

const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.35);
scene.add(luzHemisferica);

const luzRasanteEsquerda = new THREE.SpotLight(0xfff2dd, 0.6);
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

// Chão reflectivo realista com transparência elevada
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});

floor.material.opacity = 0.65;
floor.material.roughness = 0.01;
floor.material.metalness = 0.95;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.4;
floor.material.reflectivity = 0.98;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Círculo de luz ampliado, bem posicionado e visível
const circle = new THREE.Mesh(
  new THREE.RingGeometry(4.4, 4.6, 100),
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
circle.position.y = 0.052;
circle.receiveShadow = true;
scene.add(circle);
// Material dourado rigoroso (#8a5c20) com brilho suave
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c20,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x3a240a,
  emissiveIntensity: 0.3
});

function criarFrisoRecto(x, y, z, largura, altura) {
  const grupo = new THREE.Group();
  const espessura = 0.06;

  const topo = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  topo.position.set(0, altura / 2, 0);
  grupo.add(topo);

  const base = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
  base.position.set(0, -altura / 2, 0);
  grupo.add(base);

  const esquerda = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura, 0.02), frisoMaterial);
  esquerda.position.set(-largura / 2, 0, 0);
  grupo.add(esquerda);

  const direita = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura, 0.02), frisoMaterial);
  direita.position.set(largura / 2, 0, 0);
  grupo.add(direita);

  grupo.position.set(x, y, z);
  scene.add(grupo);
}

// Friso central (maior, com respiro à volta da obra)
criarFrisoRecto(0, 7.8, -config.wallDistance + 0.01, 5.2, 6.5);

// Linha horizontal curta no interior do friso central (distante do topo)
const criarFrisoLinha = (x, y, z, largura) => {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, 0.06, 0.02),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  scene.add(friso);
};

criarFrisoLinha(0, 10.2, -config.wallDistance + 0.015, 3.3);

// Frisos duplos laterais (esquerdo e direito do friso central)
const yFrisosLaterais = 7.8;
const zFrisos = -config.wallDistance + 0.01;

// Esquerda
criarFrisoRecto(-7.6, yFrisosLaterais, zFrisos, 2.2, 6.8); // externo
criarFrisoRecto(-7.6, yFrisosLaterais, zFrisos + 0.002, 1.2, 5.5); // interno

// Direita
criarFrisoRecto(7.6, yFrisosLaterais, zFrisos, 2.2, 6.8); // externo
criarFrisoRecto(7.6, yFrisosLaterais, zFrisos + 0.002, 1.2, 5.5); // interno

// Frisos horizontais paralelos no limite inferior da parede de fundo
criarFrisoLinha(0, 1.1, -config.wallDistance + 0.01, 36);
criarFrisoLinha(0, 0.6, -config.wallDistance + 0.01, 36);

// Continuação dos frisos inferiores nas paredes laterais
criarFrisoLinha(-16.2, 1.1, -config.wallDistance / 2, 2.2);
criarFrisoLinha(-16.2, 0.6, -config.wallDistance / 2, 2.2);
criarFrisoLinha(16.2, 1.1, -config.wallDistance / 2, 2.2);
criarFrisoLinha(16.2, 0.6, -config.wallDistance / 2, 2.2);
// 🧱 Textura antracite realista da parede (com fallback garantido)
textureLoader.load(
  '/assets/parede-antracite.jpg',
  texturaParede => {
    console.log('✅ Textura da parede carregada:', texturaParede);

    const paredeMaterial = new THREE.MeshStandardMaterial({
      map: texturaParede,
      color: 0xffffff, // reforça brilho e contraste da textura
      emissive: new THREE.Color(0x111111), // leve brilho de base
      emissiveIntensity: 0.25,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.FrontSide
    });

    const paredeGeo = new THREE.PlaneGeometry(40, 30);

    // Parede de fundo — posicionada mais recuada para dar profundidade
    const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
    backWall.position.set(0, 13, -config.wallDistance - 4.05);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Paredes laterais
    const paredeLateralGeo = new THREE.PlaneGeometry(30, 28);

    const leftWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
    leftWall.position.set(-14.6, 13, -config.wallDistance / 2);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
    rightWall.position.set(14.6, 13, -config.wallDistance / 2);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
  },
  undefined,
  err => {
    console.error('Erro ao carregar textura da parede:', err);

    // Fallback: paredes com cor base escura
    const paredeFallback = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.65,
      metalness: 0.1
    });

    const geoFundo = new THREE.PlaneGeometry(40, 30);
    const backWall = new THREE.Mesh(geoFundo, paredeFallback);
    backWall.position.set(0, 13, -config.wallDistance - 4.05);
    scene.add(backWall);

    const geoLateral = new THREE.PlaneGeometry(30, 28);
    const leftWall = new THREE.Mesh(geoLateral, paredeFallback);
    leftWall.position.set(-14.6, 13, -config.wallDistance / 2);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(geoLateral, paredeFallback);
    rightWall.position.set(14.6, 13, -config.wallDistance / 2);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
  }
);
// Textura do quadro central
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

// Grupo do quadro central com moldura saliente
const quadroCentral = new THREE.Group();
const larguraQuadro = 3.6 * 1.3;
const alturaQuadro = 4.5 * 1.3;
const espessuraMoldura = 0.08;
const profundidadeMoldura = 0.12;

// Moldura escura tridimensional
const moldura = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 2 * espessuraMoldura, alturaQuadro + 2 * espessuraMoldura, profundidadeMoldura),
  new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.3,
    roughness: 0.7
  })
);
moldura.position.z = -profundidadeMoldura / 2;
quadroCentral.add(moldura);

// Pintura principal (obra)
const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pintura.position.z = 0.01;
quadroCentral.add(pintura);

// Posicionar no centro do friso principal da parede de fundo
quadroCentral.position.set(0, 7.8, -config.wallDistance + 0.001);
scene.add(quadroCentral);

// Quadros laterais (esquerdo e direito), com moldura visível
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.55,
    y: 6.1,
    z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.55,
    y: 6.1,
    z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);

  const largura = 2.2 * 1.3;
  const altura = 3.2 * 1.3;

  const quadroGrupo = new THREE.Group();

  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(largura + 0.16, altura + 0.16, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.7
    })
  );
  moldura.position.z = -0.06;
  quadroGrupo.add(moldura);

  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );
  obra.position.z = 0.01;
  quadroGrupo.add(obra);

  quadroGrupo.position.set(x, y, z + 0.001);
  quadroGrupo.rotation.y = rotY;
  scene.add(quadroGrupo);
});
// Material dourado da tampa do pedestal
const materialDouradoPedestal = new THREE.MeshPhysicalMaterial({
  color: 0x8a5c20,
  metalness: 1,
  roughness: 0.08,
  clearcoat: 0.9,
  clearcoatRoughness: 0.05,
  emissive: 0x4a320a,
  emissiveIntensity: 0.25,
  reflectivity: 0.6
});

// Textura da gema azul
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// Função que cria uma vitrine fiel ao layout
function criarVitrine(x, z, indice) {
  const alturaPedestal = 4.2;
  const alturaGema = alturaPedestal + 1.25;
  const emissivaBase = 0x3377cc;
  const intensidade = 1.9;

  // Pedestal preto elevado e sólido
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, alturaPedestal, 1.05),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.55,
      metalness: 0.25
    })
  );
  pedestal.position.set(x, alturaPedestal / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // Tampa dourada — separa o pedestal da vitrine
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.07, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaPedestal + 0.035, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // Vitrine de vidro realista, repousada sobre a tampa
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 1.2, 1.05),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.15,
      roughness: 0.04,
      transmission: 1,
      thickness: 0.4,
      transparent: true,
      opacity: 0.1,
      ior: 1.45,
      reflectivity: 0.7,
      clearcoat: 0.85,
      clearcoatRoughness: 0.04
    })
  );
  vitrine.position.set(x, alturaPedestal + 0.65, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Gema facetada com textura e brilho mágico
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.45, 1),
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

// Criar as quatro vitrines como no layout
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5,  1.8, 1);
criarVitrine( 9.5, -1.8, 2);
criarVitrine( 9.5,  1.8, 3);
// Fonte do texto "NANdART"
const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: 0.65,
      height: 0.12,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 5
    });

    textGeo.computeBoundingBox();
    const larguraTexto = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    // Malha do texto com material dourado vivo
    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: 0xcaa85c, // dourado vivo
        metalness: 0.95,
        roughness: 0.25,
        emissive: 0x3a2b10,
        emissiveIntensity: 0.35
      })
    );

    texto.position.set(-larguraTexto / 2, 15.9, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    // Luz dedicada ao texto
    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.2, 12, Math.PI / 10, 0.45);
    luzTexto.position.set(0, 17.5, -config.wallDistance - 2);
    luzTexto.target = texto;
    luzTexto.castShadow = false;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);
// Obras circulantes (suspensas, sem molduras) com tamanho e reflexo
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

  // Reflexo invertido no chão
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

  // Ligar obra e reflexo para animação
  obra.userData.reflexo = reflexo;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();

  obrasNormais.push(obra);
});

// ✨ Animação contínua das obras e reflexos
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