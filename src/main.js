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

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
updateCamera();

function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 50; // ligeiramente mais aberto para incluir mais da cena
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 4.5, config.cameraZ + 10); // mais alto e mais longe
  camera.lookAt(0, 8, -config.wallDistance + 0.5); // ligeiramente mais para cima
  camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

scene.add(new THREE.AmbientLight(0xfff7e6, 3));

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
// Criar esferas luminosas para simular o reflexo das luzes de teto no chão
spotsTeto.forEach(x => {
  const esfera = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({
      emissive: 0xfff3d2,
      emissiveIntensity: 3,
      color: 0x000000
    })
  );
  esfera.position.set(x, 13, -config.wallDistance + 1);
  scene.add(esfera);
});

import { Reflector } from 'three/addons/objects/Reflector.js';

const floorGeometry = new THREE.PlaneGeometry(40, 40);

const floor = new Reflector(floorGeometry, {
  clipBias: 0.002,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});

floor.material.opacity = 0.9;
floor.material.roughness = 0.05;
floor.material.metalness = 0.85;
floor.material.transparent = true;
floor.material.envMapIntensity = 1;
floor.material.reflectivity = 0.8;

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
  new THREE.RingGeometry(2.6, 2.75, 100),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 3.5,
    metalness: 0.7,
    roughness: 0.15,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.052;
circle.receiveShadow = true;
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

// 🟨 Frisos fiéis ao layout da galeria NANdART

// Parede de fundo – moldura interior
criarFriso(0, 13.5, -config.wallDistance + 0.01, 10, 0.12); // topo
criarFriso(0, 2.5, -config.wallDistance + 0.01, 10, 0.12); // base
criarFriso(-5, 8, -config.wallDistance + 0.01, 0.12, 11); // lado esquerdo
criarFriso(5, 8, -config.wallDistance + 0.01, 0.12, 11); // lado direito

// Parede de fundo – moldura exterior
criarFriso(0, 15.8, -config.wallDistance + 0.01, 18, 0.12); // topo
criarFriso(0, 0.8, -config.wallDistance + 0.01, 18, 0.12); // base
criarFriso(-9, 8, -config.wallDistance + 0.01, 0.12, 15); // lateral esquerda
criarFriso(9, 8, -config.wallDistance + 0.01, 0.12, 15); // lateral direita

// Parede de fundo – frisos adicionais (acima e abaixo do quadro)
criarFriso(-6.2, 10.4, -config.wallDistance + 0.01, 4, 0.08); // esquerda topo
criarFriso(6.2, 10.4, -config.wallDistance + 0.01, 4, 0.08); // direita topo
criarFriso(-6.2, 5.1, -config.wallDistance + 0.01, 4, 0.08); // esquerda base
criarFriso(6.2, 5.1, -config.wallDistance + 0.01, 4, 0.08); // direita base

// Paredes laterais – frisos verticais com curvas superiores
const offsetZ = config.wallDistance / 2;

criarFriso(-15.4, 14.5, -offsetZ, 0.12, 7); // vertical superior esquerda
criarFriso(-15.4, 3.5, -offsetZ, 0.12, 7); // vertical inferior esquerda
criarFriso(15.4, 14.5, -offsetZ, 0.12, 7); // vertical superior direita
criarFriso(15.4, 3.5, -offsetZ, 0.12, 7); // vertical inferior direita

// Paredes laterais – frisos horizontais superiores e inferiores
criarFriso(-15.4, 18, -offsetZ, 4.5, 0.1); // esquerda topo
criarFriso(-15.4, 1, -offsetZ, 4.5, 0.1);  // esquerda base
criarFriso(15.4, 18, -offsetZ, 4.5, 0.1);  // direita topo
criarFriso(15.4, 1, -offsetZ, 4.5, 0.1);   // direita base

// Paredes laterais – frisos horizontais junto ao chão e teto (contínuos)
criarFriso(0, 0.3, -offsetZ, 32, 0.08); // rodapé
criarFriso(0, 19.5, -offsetZ, 32, 0.08); // teto

// Opcional: contorno de moldura para os quadros laterais (manual)
criarFriso(-10.25, 9.6, -1.6, 0.08, 3.5, Math.PI / 2); // esquerda vertical topo
criarFriso(-10.25, 2.6, -1.6, 0.08, 3.5, Math.PI / 2); // esquerda vertical base
criarFriso(-10.25, 6.1, -1.6, 2.5, 0.08); // esquerda horizontal

criarFriso(10.25, 9.6, 1.6, 0.08, 3.5, Math.PI / 2); // direita vertical topo
criarFriso(10.25, 2.6, 1.6, 0.08, 3.5, Math.PI / 2); // direita vertical base
criarFriso(10.25, 6.1, 1.6, 2.5, 0.08); // direita horizontal

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
  // Novo pedestal mais alto e esguio
  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.8, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.6,
      metalness: 0.15
    })
  );
  pedestal.position.set(x, 1.4, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  // Tampa dourada mais realista
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, 2.85, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // Caixa de vidro mais alta e mais esguia
  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 1.1, 0.88),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.3,
      transparent: true,
      opacity: 0.12,
      ior: 1.45,
      reflectivity: 0.6,
      clearcoat: 0.8,
      clearcoatRoughness: 0.05
    })
  );
  vitrine.position.set(x, 3.4, z); // mais alto
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Gema ajustada
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.33, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: 0x3377aa,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.95
    })
  );
  gema.position.set(x, 3.4, z);
  gema.castShadow = true;
  scene.add(gema);

  // Luz interior mais refinada
  const luzInterior = new THREE.PointLight(0x99ccff, 2.4, 3);
  luzInterior.position.set(x, 3.4, z);
  scene.add(luzInterior);

  gsap.to(gema.material, {
    emissiveIntensity: 1.1,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to(luzInterior, {
    intensity: 2.8,
    duration: 3,
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
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  () => pintura.material.needsUpdate = true,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
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
quadroDecorativoFundo.position.set(0, 6.7, -config.wallDistance - 3.5);
scene.add(quadroDecorativoFundo);

// Luz dedicada ao quadro central
const luzQuadroCentral = new THREE.SpotLight(0xfff3d2, 1.6, 8, Math.PI / 8, 0.5);
luzQuadroCentral.position.set(0, 11.5, -config.wallDistance - 1.5);
luzQuadroCentral.intensity = 2.5;
luzQuadroCentral.angle = Math.PI / 6;
luzQuadroCentral.penumbra = 0.5;
luzQuadroCentral.target = quadroDecorativoFundo;
scene.add(luzQuadroCentral);
scene.add(luzQuadroCentral.target);

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

