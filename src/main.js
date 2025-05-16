import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const textureLoader = new THREE.TextureLoader();

const config = {
  wallDistance: 14.5,
  circleRadius: 6.5,
  obraSize: 2.1
};

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 6.5, 16);
camera.lookAt(0, 6, 0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.3;
renderer.outputEncoding = THREE.sRGBEncoding;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// 🧱 Textura de parede e material realista
const texturaParede = textureLoader.load('/assets/parede-antracite.jpg');

const paredeMaterial = new THREE.MeshPhysicalMaterial({
  map: texturaParede,
  color: 0x1a1a1a,
  metalness: 0.25,
  roughness: 0.5,
  reflectivity: 0.3,
  clearcoat: 0.1,
  clearcoatRoughness: 0.2
});

// 🧱 Parede de fundo
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 5.5);
backWall.receiveShadow = true;
scene.add(backWall);

// 🧱 Paredes laterais
const paredeLateralGeo = new THREE.PlaneGeometry(30, 28);

const leftWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
leftWall.position.set(-13.2, 13, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
rightWall.position.set(13.2, 13, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);

// 🟨 Função e materiais para frisos embutidos com dupla camada (paredes laterais)
function criarFrisoEmbutido(pontos, material) {
  const curva = new THREE.CatmullRomCurve3(pontos, true);
  const geometria = new THREE.TubeGeometry(curva, 64, 0.02, 8, true);
  return new THREE.Mesh(geometria, material);
}

const materialMolduraExterior = new THREE.MeshStandardMaterial({
  color: 0xf3c97a,
  metalness: 1,
  roughness: 0.04,
  emissive: 0x4e3a1d,
  emissiveIntensity: 0.4
});

const materialMolduraInterior = new THREE.MeshStandardMaterial({
  color: 0xf5e5bb,
  metalness: 0.8,
  roughness: 0.1,
  emissive: 0x2a1d0a,
  emissiveIntensity: 0.3
});

// ➕ Moldura dupla embutida — lateral esquerda
const molduraExtEsq = criarFrisoEmbutido([
  new THREE.Vector3(-15.2, 2.0, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(-15.2, 13.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(-11.2, 13.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(-11.2, 2.0, -config.wallDistance / 2 + 0.021)
], materialMolduraExterior);
scene.add(molduraExtEsq);

const molduraIntEsq = criarFrisoEmbutido([
  new THREE.Vector3(-14.7, 2.6, -config.wallDistance / 2 + 0.022),
  new THREE.Vector3(-14.7, 13.2, -config.wallDistance / 2 + 0.022),
  new THREE.Vector3(-11.8, 13.2, -config.wallDistance / 2 + 0.022),
  new THREE.Vector3(-11.8, 2.6, -config.wallDistance / 2 + 0.022)
], materialMolduraInterior);
scene.add(molduraIntEsq);

// ➕ Moldura dupla embutida — lateral direita
const molduraExtDir = criarFrisoEmbutido([
  new THREE.Vector3(15.2, 2.0, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(15.2, 13.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(11.2, 13.8, -config.wallDistance / 2 + 0.021),
  new THREE.Vector3(11.2, 2.0, -config.wallDistance / 2 + 0.021)
], materialMolduraExterior);
scene.add(molduraExtDir);

const molduraIntDir = criarFrisoEmbutido([
  new THREE.Vector3(14.7, 2.6, -config.wallDistance / 2 + 0.022),
  new THREE.Vector3(14.7, 13.2, -config.wallDistance / 2 + 0.022),
  new THREE.Vector3(11.8, 13.2, -config.wallDistance / 2 + 0.022),
  new THREE.Vector3(11.8, 2.6, -config.wallDistance / 2 + 0.022)
], materialMolduraInterior);
scene.add(molduraIntDir);
// ✨ Luz ambiente geral e luzes cenográficas
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
luzAmbiente.position.set(0, 9.5, 0);
scene.add(luzAmbiente);

const luzHemisferica = new THREE.HemisphereLight(0xfff8e6, 0x101010, 2.8);
scene.add(luzHemisferica);

const luzDirecional = new THREE.DirectionalLight(0xfff4e0, 3.2);
luzDirecional.position.set(0, 20, 12);
luzDirecional.castShadow = true;
scene.add(luzDirecional);

// Luz frontal focada na parede de fundo
const luzFrontalParedeFundo = new THREE.SpotLight(0xffead4, 1.8, 35, Math.PI / 4, 0.45);
luzFrontalParedeFundo.position.set(0, 12, 10);
luzFrontalParedeFundo.target.position.set(0, 9, -config.wallDistance);
scene.add(luzFrontalParedeFundo, luzFrontalParedeFundo.target);

// Luzes laterais rasantes nas paredes
const luzParedeEsquerda = new THREE.SpotLight(0xffead4, 2.2, 30, Math.PI / 5, 0.3);
luzParedeEsquerda.position.set(-14, 12, 0);
luzParedeEsquerda.target.position.set(-13.2, 10, -config.wallDistance / 2);
scene.add(luzParedeEsquerda, luzParedeEsquerda.target);

const luzParedeDireita = new THREE.SpotLight(0xffead4, 2.2, 30, Math.PI / 5, 0.3);
luzParedeDireita.position.set(14, 12, 0);
luzParedeDireita.target.position.set(13.2, 10, -config.wallDistance / 2);
scene.add(luzParedeDireita, luzParedeDireita.target);

// 🪞 Chão reflexivo tipo obsidiana líquida
const floorGeometry = new THREE.PlaneGeometry(40, 40);

const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});

floor.material.opacity = 0.82;
floor.material.roughness = 0.03;
floor.material.metalness = 0.95;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.2;
floor.material.reflectivity = 0.92;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 💡 Luz ambiente subtil no chão
const luzRasante = new THREE.SpotLight(0xfff8e0, 0.4, 10, Math.PI / 7, 0.5);
luzRasante.position.set(0, 1.5, 3);
luzRasante.target.position.set(0, 0, 0);
scene.add(luzRasante);
scene.add(luzRasante.target);

// Animação de intensidade da luz rasante
gsap.to(luzRasante, {
  intensity: 3.2,
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// 🔆 Círculo de luz central
const circle = new THREE.Mesh(
  new THREE.RingGeometry(7.0, 7.35, 120),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.5,
    metalness: 0.7,
    roughness: 0.15,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.052;
circle.receiveShadow = true;
scene.add(circle);

// Friso horizontal no chão (frente ao círculo de luz)
const frisoChaoFrontal = new THREE.Mesh(
  new THREE.PlaneGeometry(7.2, 0.04),
  new THREE.MeshStandardMaterial({
    color: 0xf3c97a,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x3a240f,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide
  })
);
frisoChaoFrontal.rotation.x = -Math.PI / 2;
frisoChaoFrontal.position.set(0, 0.051, -2.55);
frisoChaoFrontal.receiveShadow = true;
scene.add(frisoChaoFrontal);

// Luz dedicada ao friso do chão
const luzFrisoChao = new THREE.SpotLight(0xffeac2, 1.2, 4.2, Math.PI / 10, 0.4);
luzFrisoChao.position.set(0, 1.6, 3.05);
luzFrisoChao.target.position.set(0, 0.05, 3.05);
luzFrisoChao.intensity = 0.7;
scene.add(luzFrisoChao, luzFrisoChao.target);
// 💠 Textura (não usada diretamente mas reservada)
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// ✨ Material dourado para os topos das vitrines
const materialDouradoPedestal = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.1,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1,
  emissive: 0x4a320a,
  emissiveIntensity: 0.2,
  reflectivity: 0.5
});

function criarVitrine(x, z, indice) {
  const alturaPedestal = 2.8;
  const alturaVitrine = 1.15;
  const alturaTotal = alturaPedestal + alturaVitrine;
  const alturaGema = alturaPedestal + 0.65;

  // 🟫 Pedestal metálico escuro
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, alturaPedestal, 0.88),
    new THREE.MeshPhysicalMaterial({
      color: 0x1f1f1f,
      metalness: 1,
      roughness: 0.28,
      reflectivity: 0.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.15
    })
  );
  pedestal.position.set(x, alturaPedestal / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // 🔶 Tampa dourada refinada
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaPedestal, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // 🟦 Vidro da vitrine
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, alturaVitrine, 0.88),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 1,
      transparent: true,
      opacity: 0.32,
      ior: 1.3,
      reflectivity: 0.6,
      clearcoat: 0.6,
      clearcoatRoughness: 0.05
    })
  );
  vitrine.position.set(x, alturaPedestal + alturaVitrine / 2, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // 💎 Gema facetada
  const geometriaGema = new THREE.OctahedronGeometry(0.36, 2);
  const materialGema = new THREE.MeshPhysicalMaterial({
    color: 0x9bcaff,
    metalness: 0.3,
    roughness: 0.05,
    transmission: 1,
    thickness: 0.7,
    transparent: true,
    opacity: 1,
    reflectivity: 0.95,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    ior: 1.52,
    emissive: 0x1c3d66,
    emissiveIntensity: 0.42
  });

  const gema = new THREE.Mesh(geometriaGema, materialGema);
  gema.position.set(x, alturaGema, z);
  gema.rotation.y = indice * 0.4;
  gema.castShadow = true;
  scene.add(gema);

  // 💡 Luz interna da gema
  const luzInterior = new THREE.PointLight(0x88bbff, 1.5, 1.6);
  luzInterior.position.set(x, alturaGema + 0.07, z);
  scene.add(luzInterior);

  const luzInferiorGema = new THREE.SpotLight(0x8fcfff, 0.8, 1.8, Math.PI / 6, 0.4);
  luzInferiorGema.position.set(x, alturaGema - 0.2, z);
  luzInferiorGema.target.position.set(x, alturaGema, z);
  scene.add(luzInferiorGema, luzInferiorGema.target);

  // ⛔ Bloqueador opaco atrás da gema
  const bloqueador = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      metalness: 0,
      roughness: 1
    })
  );
  bloqueador.rotation.y = Math.PI;
  bloqueador.position.set(x, alturaGema + 0.07, z - 0.18);
  bloqueador.receiveShadow = true;
  scene.add(bloqueador);

  // ✨ Animação pulsante da gema
  gsap.to(gema.material, {
    emissiveIntensity: 0.9,
    duration: 3.2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

// Criar as quatro vitrines com gemas
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);

// ✨ Luz cenográfica central para gemas
const luzGemas = new THREE.SpotLight(0xcedfff, 1.7, 8, Math.PI / 7, 0.4);
luzGemas.position.set(0, 5.8, 0);
luzGemas.target.position.set(0, 3.4, 0);
scene.add(luzGemas, luzGemas.target);

gsap.to(luzGemas, {
  intensity: 2,
  duration: 4,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// 🖼️ Grupo do quadro decorativo central
const quadroDecorativoFundo = new THREE.Group();

const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

// 🖼️ Obra central
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  texture => {
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
  },
  undefined,
  err => console.error('Erro ao carregar obra-central.jpg:', err)
);

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.35,
    metalness: 0.04,
    emissive: 0x000000,
    emissiveIntensity: 0.05,
    side: THREE.FrontSide
  })
);
pintura.position.z = 0.01;
quadroDecorativoFundo.add(pintura);

// 🟨 Friso retangular com cantos arredondados (substitui o friso circular)
const frisoQuadroCentral = new THREE.Mesh(
  new RoundedBoxGeometry(larguraQuadro + 0.4, alturaQuadro + 0.4, 0.04, 6, 0.25),
  new THREE.MeshStandardMaterial({
    color: 0xf3c97a,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x4e3a1d,
    emissiveIntensity: 0.35
  })
);
frisoQuadroCentral.position.z = 0;
quadroDecorativoFundo.add(frisoQuadroCentral);

// Posicionamento total do quadro e friso
quadroDecorativoFundo.position.set(0, 8.5, -config.wallDistance + 0.01);
scene.add(quadroDecorativoFundo);

// ➕ Traço subtil horizontal acima do quadro
const frisoSuperiorSubtil = new THREE.Mesh(
  new THREE.PlaneGeometry(13.2, 0.04),
  new THREE.MeshStandardMaterial({
    color: 0xf3c97a,
    metalness: 1,
    roughness: 0.1,
    emissive: 0x4a2a0a,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide
  })
);
frisoSuperiorSubtil.position.set(0, 15.3, -config.wallDistance + 0.015);
scene.add(frisoSuperiorSubtil);

// ✨ Texto 3D “NANdART” no topo da parede
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
    const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: 0xc4b582,
        metalness: 0.9,
        roughness: 0.3,
        emissive: 0x302a19,
        emissiveIntensity: 0.4
      })
    );

    texto.position.set(-largura / 2, 15.8, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);
  }
);
// 🖼️ Quadros laterais reais — dentro das molduras duplas

const obrasLaterais = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -11.8,
    y: 8.2,
    z: -config.wallDistance / 2 + 0.071,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 11.8,
    y: 8.2,
    z: -config.wallDistance / 2 + 0.071,
    rotY: -Math.PI / 2
  }
];

obrasLaterais.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src, tex => {
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.encoding = THREE.sRGBEncoding;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
  });

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3.2),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.06,
      side: THREE.FrontSide
    })
  );

  quadro.position.set(x, y, z);
  quadro.rotation.y = rotY;
  quadro.castShadow = true;
  scene.add(quadro);
});

// 🟨 Frisos embutidos com estrutura dupla — esquerda e direita

const materialFriso = new THREE.MeshStandardMaterial({
  color: 0xf3c97a,
  metalness: 1,
  roughness: 0.05,
  emissive: 0x4e3a1d,
  emissiveIntensity: 0.35
});

function criarFrisoDuplo(x, y, z, alturaExterna, alturaInterna, offset = 0.01, rotY = 0) {
  const larguraExterna = 0.35;
  const larguraInterna = 0.18;

  const frisoExterno = new THREE.Mesh(
    new THREE.CylinderGeometry(larguraExterna, larguraExterna, alturaExterna, 32),
    materialFriso
  );
  frisoExterno.position.set(x, y, z);
  frisoExterno.rotation.y = rotY;
  frisoExterno.castShadow = true;
  scene.add(frisoExterno);

  const frisoInterno = new THREE.Mesh(
    new THREE.CylinderGeometry(larguraInterna, larguraInterna, alturaInterna, 32),
    materialFriso
  );
  frisoInterno.position.set(x, y, z + offset);
  frisoInterno.rotation.y = rotY;
  frisoInterno.castShadow = true;
  scene.add(frisoInterno);
}

// ➕ Aplicar frisos duplos embutidos nas paredes laterais
criarFrisoDuplo(-11.8, 8.2, -config.wallDistance / 2 + 0.01, 12, 11.4); // esquerda
criarFrisoDuplo(11.8, 8.2, -config.wallDistance / 2 + 0.01, 12, 11.4);  // direita

// ✨ Círculo de luz aumentado — conforme layout original (≈40% da largura do chão)
const circle = new THREE.Mesh(
  new THREE.RingGeometry(7.0, 7.35, 120),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.5,
    metalness: 0.7,
    roughness: 0.15,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.052;
circle.receiveShadow = true;
scene.add(circle);

// ✨ Friso horizontal fino e elegante no chão (frente ao círculo de luz)
const frisoChaoFrontal = new THREE.Mesh(
  new THREE.PlaneGeometry(7.2, 0.04),
  new THREE.MeshStandardMaterial({
    color: 0xf3c97a,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x3a240f,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide
  })
);
frisoChaoFrontal.rotation.x = -Math.PI / 2;
frisoChaoFrontal.position.set(0, 0.051, -2.55);
frisoChaoFrontal.receiveShadow = true;
scene.add(frisoChaoFrontal);

// ✨ Luz rasante discreta para iluminar o friso de chão
const luzFrisoChao = new THREE.SpotLight(0xffeac2, 1.2, 4.2, Math.PI / 10, 0.4);
luzFrisoChao.position.set(0, 1.6, 3.05); // ligeiramente acima do friso
luzFrisoChao.target.position.set(0, 0.05, 3.05); // aponta para o friso
luzFrisoChao.intensity = 0.7;
scene.add(luzFrisoChao, luzFrisoChao.target);

// ✨ Luz rasante adicional no chão — animação subtil do brilho
const luzRasante = new THREE.SpotLight(0xfff8e0, 0.4, 10, Math.PI / 7, 0.5);
luzRasante.position.set(0, 1.5, 3);
luzRasante.target.position.set(0, 0, 0);
scene.add(luzRasante, luzRasante.target);

gsap.to(luzRasante, {
  intensity: 3.2,
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});
let rotacaoPausada = false;

function animate() {
  requestAnimationFrame(animate);

  const tempoAtual = Date.now();
  const tempo = tempoAtual * -0.00012;

  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(ang) * config.circleRadius;
    const z = Math.sin(ang) * config.circleRadius;
    const ry = -ang + Math.PI;

    const intensidade = (obra === obraEmDestaque) ? 0.005 : 1;

    if (!rotacaoPausada || obra !== obraEmDestaque) {
      obra.position.x += (x - obra.position.x) * 0.05 * intensidade;
      obra.position.z += (z - obra.position.z) * 0.05 * intensidade;
      obra.rotation.y += (ry - obra.rotation.y) * 0.05 * intensidade;

      const reflexo = obra.userData.reflexo;
      if (reflexo) {
        reflexo.userData.targetPos.set(x, -0.01, z);
        reflexo.userData.targetRot.set(0, ry, 0);

        reflexo.position.lerp(reflexo.userData.targetPos, 0.05 * intensidade);
        reflexo.rotation.y += (ry - reflexo.rotation.y) * 0.05 * intensidade;
      }
    }
  });

  renderer.render(scene, camera);
}

animate();
