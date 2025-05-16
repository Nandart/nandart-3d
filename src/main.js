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

const camera = new THREE.PerspectiveCamera();
updateCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 34;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 5.8, config.cameraZ + 13);
  camera.lookAt(0, 7, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;

// ✨ Luz ambiente radial suave e refinada
const luzAmbienteCentral = new THREE.PointLight(0xfff2dd, 0.6, 50, 2);
luzAmbienteCentral.position.set(0, 9.5, 0);
scene.add(luzAmbienteCentral);

// ✨ Luz hemisférica quente para reforço geral do ambiente
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.5);
scene.add(luzHemisferica);

// ✨ Luzes rasantes laterais muito suaves para dar volume às paredes
const luzRasanteEsquerda = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
luzRasanteEsquerda.position.set(-12, 5.5, 0);
luzRasanteEsquerda.target.position.set(-12, 5.5, -10);
scene.add(luzRasanteEsquerda, luzRasanteEsquerda.target);

const luzRasanteDireita = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
luzRasanteDireita.position.set(12, 5.5, 0);
luzRasanteDireita.target.position.set(12, 5.5, -10);
scene.add(luzRasanteDireita, luzRasanteDireita.target);


import { Reflector } from 'three/addons/objects/Reflector.js';

// ✨ Chão com reflexo profundo e textura realista tipo obsidiana líquida

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

// 🔶 Novos frisos realistas com contorno embutido

function criarFrisoEmbutido(x, y, z, largura, altura, rotY = 0, depth = 0.03) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, depth),
    new THREE.MeshPhysicalMaterial({
      color: 0xd1b072,
      metalness: 1,
      roughness: 0.08,
      clearcoat: 0.95,
      clearcoatRoughness: 0.05,
      emissive: 0x3a2a0a,
      emissiveIntensity: 0.25,
      reflectivity: 0.6
    })
  );
  friso.position.set(x, y, z);
  friso.rotation.y = rotY;
  friso.castShadow = true;
  scene.add(friso);
  return friso;
}

// Parede de fundo – moldura embutida
criarFrisoEmbutido(0, 14.2, -config.wallDistance + 0.03, 10, 0.1); // topo
criarFrisoEmbutido(0, 2.2, -config.wallDistance + 0.03, 10, 0.1); // base
criarFrisoEmbutido(-5.1, 8.2, -config.wallDistance + 0.03, 0.1, 12); // lateral esquerda
criarFrisoEmbutido(5.1, 8.2, -config.wallDistance + 0.03, 0.1, 12); // lateral direita

// Parede de fundo – moldura exterior
criarFrisoEmbutido(0, 16.6, -config.wallDistance + 0.025, 18, 0.08); // topo exterior
criarFrisoEmbutido(0, 0.5, -config.wallDistance + 0.025, 18, 0.08); // base exterior
criarFrisoEmbutido(-9.1, 8.5, -config.wallDistance + 0.025, 0.08, 16); // lateral esquerda exterior
criarFrisoEmbutido(9.1, 8.5, -config.wallDistance + 0.025, 0.08, 16); // lateral direita exterior

// Frisos horizontais junto ao chão e teto (contínuos laterais)
const offsetZ = config.wallDistance / 2;
criarFrisoEmbutido(0, 0.3, -offsetZ, 36, 0.06); // rodapé
criarFrisoEmbutido(0, 19.8, -offsetZ, 36, 0.06); // teto

// 🟨 Luzes refinadas para destacar os frisos com contorno

// Luz superior frontal – friso central da parede de fundo
const luzFrisosTopo = new THREE.SpotLight(0xffeac2, 1.15, 9, Math.PI / 10, 0.5);
luzFrisosTopo.position.set(0, 13.2, -config.wallDistance + 2);
luzFrisosTopo.target.position.set(0, 10, -config.wallDistance + 0.01);
scene.add(luzFrisosTopo, luzFrisosTopo.target);

// Luz inferior frontal – base da parede de fundo
const luzFrisosBase = new THREE.SpotLight(0xffeac2, 0.9, 7, Math.PI / 12, 0.4);
luzFrisosBase.position.set(0, 3.2, -config.wallDistance + 2);
luzFrisosBase.target.position.set(0, 6, -config.wallDistance + 0.01);
scene.add(luzFrisosBase, luzFrisosBase.target);

// Luz lateral esquerda – frisos verticais e horizontais
const luzFrisoEsquerdo = new THREE.SpotLight(0xffeac2, 1.2, 9, Math.PI / 10, 0.45);
luzFrisoEsquerdo.position.set(-13, 10, -config.wallDistance / 2 + 1);
luzFrisoEsquerdo.target.position.set(-13, 8, -config.wallDistance / 2);
scene.add(luzFrisoEsquerdo, luzFrisoEsquerdo.target);

// Luz lateral direita – frisos verticais e horizontais
const luzFrisoDireito = new THREE.SpotLight(0xffeac2, 1.2, 9, Math.PI / 10, 0.45);
luzFrisoDireito.position.set(13, 10, -config.wallDistance / 2 + 1);
luzFrisoDireito.target.position.set(13, 8, -config.wallDistance / 2);
scene.add(luzFrisoDireito, luzFrisoDireito.target);

// Brilho animado muito subtil para sensação de vida
gsap.to(luzFrisosTopo, {
  intensity: 1.3,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});


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

// 🖼️ Quadros laterais perfeitamente embutidos nas paredes

const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -15.48, y: 6.1, z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 15.48, y: 6.1, z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3.2),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );

  quadro.position.set(x, y, z + 0.001); // ligeiro destaque da parede
  quadro.rotation.y = rotY;
  quadro.receiveShadow = true;
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
function criarVitrine(x, z, indice) {
  // Altura variável para dar vida visual
  const alturaGema = 3.3 + (indice % 2 === 0 ? 0.08 : -0.06);
  const emissivaBase = indice % 2 === 0 ? 0x3366aa : 0x3377cc;
  const intensidadeBase = 2.3 + (indice % 2) * 0.3;

  // Pedestal
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

  // Tampa dourada
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, 2.85, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // Vitrine de vidro
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
  vitrine.position.set(x, 3.4, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  // Gema ligeiramente diferente em rotação, altura e cor emissiva
  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.33, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: emissivaBase,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.95
    })
  );
  gema.position.set(x, alturaGema, z);
  gema.rotation.y = indice * 0.4;
  gema.castShadow = true;
  scene.add(gema);
}
// Luz interior com variação de intensidade será adicionada aqui futuramente

criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);

// 🖼️ Quadro central com friso embutido elegante e realista

const quadroDecorativoFundo = new THREE.Group();

const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

// Imagem principal
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pintura.position.z = 0.01;
quadroDecorativoFundo.add(pintura);

// Friso dourado embutido na parede
const frisoExterior = new THREE.Mesh(
  new THREE.RingGeometry(
    larguraQuadro / 2 + 0.12,
    larguraQuadro / 2 + 0.18,
    64
  ),
  new THREE.MeshStandardMaterial({
    color: 0xc4b582,
    metalness: 1,
    roughness: 0.05,
    emissive: 0x2a1f0f,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide
  })
);
frisoExterior.rotation.x = Math.PI / 2;
frisoExterior.position.z = 0.015;
quadroDecorativoFundo.add(frisoExterior);

quadroDecorativoFundo.position.set(0, 6.9, -config.wallDistance - 3.5);
scene.add(quadroDecorativoFundo);

// Luz dedicada com foco artístico
const luzQuadroCentral = new THREE.SpotLight(0xfff3d2, 2.1, 10, Math.PI / 7, 0.5);
luzQuadroCentral.position.set(0, 11.5, -config.wallDistance - 1.5);
luzQuadroCentral.target = quadroDecorativoFundo;
scene.add(luzQuadroCentral);
scene.add(luzQuadroCentral.target);


gsap.to(luzQuadroCentral, {
  intensity: 2.3,
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

// ✨ Texto "NANdART" com presença refinada no topo

const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: 0.65, // ligeiramente maior mas ainda elegante
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

    texto.position.set(-largura / 2, 16.5, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    // Luz discreta para realçar o texto
    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.4, 12, Math.PI / 9, 0.5);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);

// 🧱 Parede de fundo corrigida e expandida para cobrir toda a galeria

const paredeGeo = new THREE.PlaneGeometry(40, 30); // maior em largura e altura

const texturaParede = textureLoader.load('/assets/texturas/parede-antracite.jpg');

const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaParede,
  roughness: 0.9,
  metalness: 0.1,
  side: THREE.FrontSide
});

const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 4.05); // subida + ligeiro ajuste no Z
backWall.receiveShadow = true;
scene.add(backWall);

// 🧱 Paredes laterais ajustadas com maior realismo e alinhamento

const paredeLateralGeo = new THREE.PlaneGeometry(30, 28); // ligeiramente mais altas

const leftWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
leftWall.position.set(-16.2, 13, -config.wallDistance / 2);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(paredeLateralGeo, paredeMaterial);
rightWall.position.set(16.2, 13, -config.wallDistance / 2);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);


// Atualização de dimensão ao redimensionar a janela
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
// ✨ Reflexos animados subtis nas molduras e gemas

// Moldura do quadro central – animação suave no brilho
gsap.to(pintura.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => pintura.material.needsUpdate = true
});


// Frisos – reflexo pulsante suave
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.emissiveIntensity &&
    obj.material.color &&
   obj.material.color.getHex() === 0xd9b96c

  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.35,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// Gemas – brilho mágico oscilante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 1.2,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
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
