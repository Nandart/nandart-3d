import * as THREE from 'three';
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
  XS: { obraSize: 0.45, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5, textSize: 0.4 },
  SM: { obraSize: 0.5, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5, textSize: 0.45 },
  MD: { obraSize: 0.55, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5, textSize: 0.5 },
  LG: { obraSize: 0.6, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
updateCamera(); // posicionamento correto logo ao iniciar

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 36;
  camera.position.set(0, config.cameraY, config.cameraZ); // posição recuada e centrada
  camera.lookAt(0, 6.8, -config.wallDistance); // focar ligeiramente acima e fundo
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

scene.add(new THREE.AmbientLight(0xfff7e6, 1.7));

// Luz ambiente mais ampla para iluminar a sala de forma elegante
const luzAmbienteSuave = new THREE.HemisphereLight(0xfff4e5, 0x080808, 0.7);
scene.add(luzAmbienteSuave);

// Luzes de teto adicionais para reforçar o ambiente
const spotsTeto = [ -6, 0, 6 ];
spotsTeto.forEach(x => {
  const foco = new THREE.SpotLight(0xfff7e0, 1.4, 18, Math.PI / 6, 0.4);
  foco.position.set(x, 13, -config.wallDistance + 1);
  foco.target.position.set(x, 6, -config.wallDistance + 1);
  foco.castShadow = true;
  foco.shadow.mapSize.set(1024, 1024);
  scene.add(foco);
  scene.add(foco.target);
});

import { Reflector } from 'three/addons/objects/Reflector.js';

const floorGeometry = new THREE.PlaneGeometry(40, 40);

const floor = new Reflector(floorGeometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x101010,
  recursion: 1
});

floor.material.opacity = 0.3;
floor.material.roughness = 0.25;
floor.material.metalness = 0.4;
floor.material.transparent = true;
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Luz rasante para valorizar o reflexo no chão
const luzRasante = new THREE.SpotLight(0xfff8e0, 1.3, 20, Math.PI / 7, 0.5);
luzRasante.position.set(0, 4.5, 4);
luzRasante.target.position.set(0, 0, 0);
scene.add(luzRasante);
scene.add(luzRasante.target);
// Luz de fundo para iluminar a parede traseira
const luzFundoSuave = new THREE.PointLight(0xffeedd, 1.2, 30);
luzFundoSuave.position.set(0, 5, -config.wallDistance - 4);
scene.add(luzFundoSuave);
// Reflexo subtil animado na intensidade
gsap.to(luzRasante, {
  intensity: 1.6,
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// Novo círculo de luz no chão: mais fino, elegante e radiante
const circle = new THREE.Mesh(
  new THREE.RingGeometry(2.1, 2.6, 72),
  new THREE.MeshStandardMaterial({
    color: 0xfdf1d2,
    emissive: 0xffe8bb,
    emissiveIntensity: 2,
    metalness: 0.6,
    roughness: 0.2,
    transparent: true,
    opacity: 0.6,
    side: THREE.FrontSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.037;
scene.add(circle);

const textureLoader = new THREE.TextureLoader();
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

const frisoMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xd9b96c,
  metalness: 1,
  roughness: 0.1,
  transmission: 0,
  reflectivity: 0.65,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1,
  emissive: 0x5a430c,
  emissiveIntensity: 0.25
});

function criarFriso(x, y, z, largura, altura, rotY = 0, depth = 0.05) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth),
    frisoMaterial
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
  return friso;
}

// Frisos frontais e laterais
criarFriso(0, 13.5, -config.wallDistance + 0.01, 12, 0.15);
criarFriso(0, 2.5, -config.wallDistance + 0.01, 12, 0.15);
criarFriso(-6, 8, -config.wallDistance + 0.01, 0.15, 11);
criarFriso(6, 8, -config.wallDistance + 0.01, 0.15, 11);
criarFriso(0, 8, -config.wallDistance + 0.005, 10, 10, 0, 0.02);

criarFriso(-10, 13.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2); // vertical esquerda cima
criarFriso(10, 13.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2);  // vertical direita cima
criarFriso(-10, 2.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2);  // vertical esquerda baixo
criarFriso(10, 2.5, -config.wallDistance / 2, 0.15, 11, Math.PI / 2);   // vertical direita baixo
criarFriso(-10, 8, -config.wallDistance / 2, 12, 0.12, Math.PI / 2);    // horizontal lateral esquerda
criarFriso(10, 8, -config.wallDistance / 2, 12, 0.12, Math.PI / 2);     // horizontal lateral direita
// Luz dedicada para destacar os frisos frontais
const luzFrisos = new THREE.SpotLight(0xffeeb3, 1.4, 10, Math.PI / 8, 0.6);
luzFrisos.position.set(0, 12, -config.wallDistance + 3);
luzFrisos.target.position.set(0, 8, -config.wallDistance + 0.01);
scene.add(luzFrisos);
scene.add(luzFrisos.target);

// Luz para friso lateral esquerdo
const luzFrisoEsq = new THREE.SpotLight(0xffeeb3, 1.3, 9, Math.PI / 9, 0.5);
luzFrisoEsq.position.set(-11.5, 12, -config.wallDistance / 2);
luzFrisoEsq.target.position.set(-11.5, 8, -config.wallDistance / 2);
scene.add(luzFrisoEsq);
scene.add(luzFrisoEsq.target);

// Luz para friso lateral direito
const luzFrisoDir = new THREE.SpotLight(0xffeeb3, 1.3, 9, Math.PI / 9, 0.5);
luzFrisoDir.position.set(11.5, 12, -config.wallDistance / 2);
luzFrisoDir.target.position.set(11.5, 8, -config.wallDistance / 2);
scene.add(luzFrisoDir);
scene.add(luzFrisoDir.target);

const frisosParaIluminar = [
  [-6, 8, -config.wallDistance + 1],  // lateral esquerda
  [6, 8, -config.wallDistance + 1],   // lateral direita
  [0, 13.6, -config.wallDistance + 1], // friso superior
  [0, 2.5, -config.wallDistance + 1],  // friso inferior
];

frisosParaIluminar.forEach(([x, y, z]) => {
  const luzFriso = new THREE.SpotLight(0xfff0c0, 1.5, 6, Math.PI / 9, 0.6);
  luzFriso.position.set(x, y + 1.5, z + 1.2);
  luzFriso.target.position.set(x, y, z);
  scene.add(luzFriso);
  scene.add(luzFriso.target);
});

// Adição de obras nas paredes laterais
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -10.25, y: 6.1, z: -1.6, rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 10.25, y: 6.1, z: 1.6, rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const texture = textureLoader.load(src);
  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3.2),
    new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide })
  );
  quadro.position.set(x, y, z);
  quadro.rotation.y = rotY;
  quadro.castShadow = true;
  scene.add(quadro);
});

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

// Criar vitrines inspiradas no layout com gemas facetadas
function criarVitrine(x, z) {
  // Pedestal retangular com proporção correta
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 2.2, 1.1),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.6,
      metalness: 0.15
    })
  );
  // Friso dourado superior do pedestal
const topoDourado = new THREE.Mesh(
  new THREE.CylinderGeometry(0.31, 0.31, 0.06, 32),
  materialDouradoPedestal
);
topoDourado.position.set(x, 2.2, z);
topoDourado.castShadow = true;
scene.add(topoDourado);

  pedestal.position.set(x, 1.1, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // Caixa de vidro com realismo físico
  const vitrine = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshPhysicalMaterial({
    color: 0xf8f8f8,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 1,
    thickness: 0.3,
    transparent: true,
    opacity: 0.15,
    ior: 1.45,
    reflectivity: 0.6,
    clearcoat: 0.8,
    clearcoatRoughness: 0.05
  })
);

  vitrine.position.set(x, 2.5, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Objeto facetado com geometria mais rica
  const objeto = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.33, 1),
    new THREE.MeshStandardMaterial({
      color: 0x99ccff,
      roughness: 0.1,
      metalness: 0.5,
      emissive: 0x3377aa,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.95
    })
  );
  objeto.position.set(x, 2.5, z);
  objeto.castShadow = true;
  scene.add(objeto);

  // Iluminação embutida e localizada
  const luzInterior = new THREE.PointLight(0x99ccff, 2.2, 3);
  luzInterior.position.set(x, 2.5, z);
  scene.add(luzInterior);

  // Animações subtis do brilho da gema
  gsap.to(objeto.material, {
    emissiveIntensity: 1.2,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to(luzInterior, {
    intensity: 2.8,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}

criarVitrine(-9.5, -1.8);
criarVitrine(-9.5, 1.8);
criarVitrine(9.5, -1.8);
criarVitrine(9.5, 1.8);

// Quadro decorativo na parede de fundo (em destaque)
const quadroDecorativoFundo = new THREE.Group();

// Dimensões otimizadas para impacto visual
const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

// Moldura principal em relevo
const moldura = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 0.25, alturaQuadro + 0.25, 0.2),
  new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.6,
    roughness: 0.3
  })
);
quadroDecorativoFundo.add(moldura);

// Imagem embutida
const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: textureLoader.load('/assets/obras/obra-central.jpg'),
    roughness: 0.15,
    metalness: 0.05
  })
);
pintura.position.z = 0.11;
quadroDecorativoFundo.add(pintura);

// Friso exterior dourado elegante
const frisoExterior = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + 0.3, alturaQuadro + 0.3, 0.01),
  new THREE.MeshStandardMaterial({
    color: 0xc4b582,
    metalness: 1,
    roughness: 0.1,
    emissive: 0x221f1f,
    emissiveIntensity: 0.4
  })
);
frisoExterior.position.z = 0.105;
quadroDecorativoFundo.add(frisoExterior);

// Posicionamento mais elevado na parede
quadroDecorativoFundo.position.set(0, 6.7, -config.wallDistance - 3.99);
scene.add(quadroDecorativoFundo);
// Luz dedicada ao quadro central
const luzQuadroCentral = new THREE.SpotLight(0xfff3d2, 1.6, 8, Math.PI / 8, 0.5);
luzQuadroCentral.position.set(0, 10.5, -config.wallDistance - 1.9);
luzQuadroCentral.target = quadroDecorativoFundo;
scene.add(luzQuadroCentral);
scene.add(luzQuadroCentral.target);
// Reflexo da obra central no chão

// Animação suave na intensidade da luz
gsap.to(luzQuadroCentral, {
  intensity: 2.1,
  duration: 4,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});
// Obras suspensas (sem molduras)
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

  // Reflexo da obra
  const reflexo = obra.clone();
  reflexo.position.y = -0.01;
  reflexo.scale.y = -1;
  reflexo.material = obra.material.clone();
 reflexo.material.opacity = 0.18;
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

// Texto NANdART sobre friso
const fontLoader = new FontLoader();
fontLoader.load('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json', font => {
  const textGeo = new TextGeometry('NANdART', {
    font,
    size: config.textSize,
    height: 0.08,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.01,
    bevelSegments: 5
  });
  textGeo.computeBoundingBox();
  const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

  const texto = new THREE.Mesh(
    textGeo,
    new THREE.MeshPhongMaterial({
      color: 0xc4b582,
      emissive: 0x222211,
      shininess: 100
    })
  );
 texto.position.set(-largura / 2, 13.65, -config.wallDistance - 3.985);
  texto.castShadow = true;
  scene.add(texto);

  const luzTexto = new THREE.SpotLight(0xfff2cc, 1.5, 10, Math.PI / 8, 0.5);
luzTexto.position.set(0, 12, -config.wallDistance - 1.9);
  luzTexto.target = texto;
  scene.add(luzTexto);
  scene.add(luzTexto.target);
});

// Paredes com textura e realce
const paredeMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.9,
  metalness: 0.1
});
const paredeGeo = new THREE.PlaneGeometry(32, 24);

const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 10, -config.wallDistance - 4);
scene.add(backWall);

const leftWall = new THREE.Mesh(paredeGeo, paredeMaterial);
leftWall.position.set(-15.5, 12, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeGeo, paredeMaterial);
rightWall.position.set(15.5, 12, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// Atualização de dimensão ao redimensionar a janela
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação contínua com rotação de obras
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

