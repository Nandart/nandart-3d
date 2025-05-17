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
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 12, cameraY: 4.2, textSize: 0.4 },
  SM: { obraSize: 1.0, circleRadius: 2.6, wallDistance: 9, cameraZ: 12.5, cameraY: 4.2, textSize: 0.45 },
  MD: { obraSize: 1.1, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 4.2, textSize: 0.5 },
  LG: { obraSize: 1.2, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13.5, cameraY: 4.2, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera();
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.fov = 38;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY, config.cameraZ + 18.5);
  camera.lookAt(0, 5.5, -config.wallDistance + 0.6);
  camera.updateProjectionMatrix();
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.6;

// Iluminação global reforçada
const luzAmbiente1 = new THREE.AmbientLight(0xfff7e6, 1.8);
const luzAmbiente2 = new THREE.AmbientLight(0xfff7e6, 1.8);
scene.add(luzAmbiente1, luzAmbiente2);

const luzHemisferica = new THREE.HemisphereLight(0xfff4e0, 0x202020, 1.4);
scene.add(luzHemisferica);
// Chão com reflexo realista e visível
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});
floor.material.opacity = 0.94;
floor.material.roughness = 0.01;
floor.material.metalness = 1;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.7;
floor.material.reflectivity = 0.98;
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Círculo de luz no chão com brilho envolvente
const circle = new THREE.Mesh(
  new THREE.RingGeometry(4.4, 4.6, 120),
  new THREE.MeshStandardMaterial({
    color: 0xfdf6dc,
    emissive: 0xffefc6,
    emissiveIntensity: 5.2,
    metalness: 0.85,
    roughness: 0.08,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  })
);
circle.rotation.x = -Math.PI / 2;
circle.position.y = 0.051;
circle.receiveShadow = true;
scene.add(circle);

// Cor dourada fiel à imagem "dourado para friso.png"
const corDouradoFriso = new THREE.Color('#8a5c20');

// Material físico para frisos com reflexo real
const frisoMaterial = new THREE.MeshPhysicalMaterial({
  color: corDouradoFriso,
  metalness: 1,
  roughness: 0.05,
  reflectivity: 0.85,
  clearcoat: 0.9,
  clearcoatRoughness: 0.03,
  emissive: 0x3a240a,
  emissiveIntensity: 0.55
});

// Função para frisos com contorno arredondado
function criarFrisoContorno(pontos, radius = 0.028) {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const geometry = new THREE.TubeGeometry(curva, 100, radius, 16, true);
  const mesh = new THREE.Mesh(geometry, frisoMaterial);
  mesh.castShadow = false;
  scene.add(mesh);
  return mesh;
}

// Friso central arredondado à volta da obra
const alturaCentro = 9.5;
const larguraFriso = 4.4;
const alturaFriso = 5.4;
const raioCurva = 0.3;
const zFriso = -config.wallDistance + 0.015;

const pontosFrisoCentral = [
  new THREE.Vector3(-larguraFriso / 2 + raioCurva, alturaCentro + alturaFriso / 2, zFriso),
  new THREE.Vector3(larguraFriso / 2 - raioCurva, alturaCentro + alturaFriso / 2, zFriso),
  new THREE.Vector3(larguraFriso / 2, alturaCentro + alturaFriso / 2 - raioCurva, zFriso),
  new THREE.Vector3(larguraFriso / 2, alturaCentro - alturaFriso / 2 + raioCurva, zFriso),
  new THREE.Vector3(larguraFriso / 2 - raioCurva, alturaCentro - alturaFriso / 2, zFriso),
  new THREE.Vector3(-larguraFriso / 2 + raioCurva, alturaCentro - alturaFriso / 2, zFriso),
  new THREE.Vector3(-larguraFriso / 2, alturaCentro - alturaFriso / 2 + raioCurva, zFriso),
  new THREE.Vector3(-larguraFriso / 2, alturaCentro + alturaFriso / 2 - raioCurva, zFriso),
  new THREE.Vector3(-larguraFriso / 2 + raioCurva, alturaCentro + alturaFriso / 2, zFriso)
];

criarFrisoContorno(pontosFrisoCentral);

// Linha horizontal interna superior do friso central
const linhaInterna = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 0.06, 0.02),
  frisoMaterial
);
linhaInterna.position.set(0, alturaCentro + alturaFriso / 2 - 0.35, zFriso + 0.001);
scene.add(linhaInterna);

// Friso inferior da parede de fundo
const frisoInferiorParede = new THREE.Mesh(
  new THREE.BoxGeometry(36, 0.05, 0.02),
  frisoMaterial
);
frisoInferiorParede.position.set(0, 1.1, -config.wallDistance + 0.015);
scene.add(frisoInferiorParede);

// Frisos inferiores contínuos nas laterais
const frisoInferiorEsquerda = new THREE.Mesh(
  new THREE.BoxGeometry(10.2, 0.05, 0.02),
  frisoMaterial
);
frisoInferiorEsquerda.position.set(-14.6 + 5.1, 1.1, -config.wallDistance / 2);
frisoInferiorEsquerda.rotation.y = Math.PI / 2;
scene.add(frisoInferiorEsquerda);

const frisoInferiorDireita = new THREE.Mesh(
  new THREE.BoxGeometry(10.2, 0.05, 0.02),
  frisoMaterial
);
frisoInferiorDireita.position.set(14.6 - 5.1, 1.1, -config.wallDistance / 2);
frisoInferiorDireita.rotation.y = -Math.PI / 2;
scene.add(frisoInferiorDireita);
// Textura antracite realista para as paredes
const texturaAntracite = textureLoader.load('/assets/IMG_2945.jpg');
texturaAntracite.wrapS = THREE.RepeatWrapping;
texturaAntracite.wrapT = THREE.RepeatWrapping;
texturaAntracite.repeat.set(3, 3);

const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaAntracite,
  metalness: 0.4,
  roughness: 0.9
});

// Parede de fundo
const paredeFundo = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 22),
  paredeMaterial
);
paredeFundo.position.set(0, 11, -config.wallDistance);
scene.add(paredeFundo);

// Parede lateral esquerda
const paredeEsquerda = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 22),
  paredeMaterial
);
paredeEsquerda.rotation.y = Math.PI / 2;
paredeEsquerda.position.set(-15, 11, -config.wallDistance / 2);
scene.add(paredeEsquerda);

// Parede lateral direita
const paredeDireita = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 22),
  paredeMaterial
);
paredeDireita.rotation.y = -Math.PI / 2;
paredeDireita.position.set(15, 11, -config.wallDistance / 2);
scene.add(paredeDireita);
// Material escuro e mate para as molduras salientes
const materialMoldura = new THREE.MeshStandardMaterial({
  color: 0x222222,
  roughness: 0.6,
  metalness: 0.25
});

// Quadro central com moldura saliente
const grupoCentral = new THREE.Group();

const texturaObraCentral = textureLoader.load('/assets/obras/obra-central.jpg');
const obraCentral = new THREE.Mesh(
  new THREE.PlaneGeometry(3.85, 4.8),
  new THREE.MeshStandardMaterial({
    map: texturaObraCentral,
    roughness: 0.15,
    metalness: 0.08
  })
);
obraCentral.position.z = 0.04;
grupoCentral.add(obraCentral);

const molduraCentral = new THREE.Mesh(
  new THREE.BoxGeometry(4.1, 5.1, 0.1),
  materialMoldura
);
grupoCentral.add(molduraCentral);

grupoCentral.position.set(0, 9.5, -config.wallDistance + 0.03);
scene.add(grupoCentral);

// Quadros laterais com moldura saliente
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.55,
    y: 6.2,
    z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.55,
    y: 6.2,
    z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const grupo = new THREE.Group();

  const textura = textureLoader.load(src);
  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 3.5),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.18,
      metalness: 0.06,
      side: THREE.FrontSide
    })
  );
  obra.position.z = 0.04;
  grupo.add(obra);

  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 3.75, 0.1),
    materialMoldura
  );
  grupo.add(moldura);

  grupo.position.set(x, y, z + 0.03);
  grupo.rotation.y = rotY;
  scene.add(grupo);
});
// Iluminação ambiente duplicada para toda a galeria
const luzAmbientePrincipal = new THREE.AmbientLight(0xfff8ec, 2.4); // intensidade dobrada
scene.add(luzAmbientePrincipal);

// Luz hemisférica mais expressiva
const luzHemisfericaIntensa = new THREE.HemisphereLight(0xfff8e0, 0x1a1a1a, 1.2);
scene.add(luzHemisfericaIntensa);

// Luz direcional adicional suave para brilho geral
const luzDirecionalSuave = new THREE.DirectionalLight(0xfff2dc, 0.8);
luzDirecionalSuave.position.set(5, 15, 5);
scene.add(luzDirecionalSuave);

// Melhorar reflexos no chão com luz descendente subtil
const luzChao = new THREE.PointLight(0xfff3e0, 1.5, 20, 2);
luzChao.position.set(0, 7, 0);
scene.add(luzChao);

// Confirmação visual do círculo de luz bem pousado no chão
circle.position.y = 0.0025; // praticamente ao nível da superfície refletora

// Melhorar visibilidade do círculo com reflexo subtil no chão
const reflexoCircular = circle.clone();
reflexoCircular.material = circle.material.clone();
reflexoCircular.rotation.x = -Math.PI / 2;
reflexoCircular.position.y = -0.0025;
reflexoCircular.material.opacity = 0.35;
reflexoCircular.material.emissiveIntensity = 1.8;
reflexoCircular.material.transparent = true;
reflexoCircular.renderOrder = 1;
scene.add(reflexoCircular);
// Obras suspensas circulantes – 15 únicas, escala reduzida e reflexo suave
const obraPaths = [
  "/assets/obras/obra1.jpg",
  "/assets/obras/obra2.jpg",
  "/assets/obras/obra3.jpg",
  "/assets/obras/obra4.jpg",
  "/assets/obras/obra5.jpg",
  "/assets/obras/obra6.jpg",
  "/assets/obras/obra7.jpg",
  "/assets/obras/obra8.jpg",
  "/assets/obras/obra9.jpg",
  "/assets/obras/obra10.jpg",
  "/assets/obras/obra11.jpg",
  "/assets/obras/obra12.jpg",
  "/assets/obras/obra13.jpg",
  "/assets/obras/obra14.jpg",
  "/assets/obras/obra15.jpg"
];

const obrasNormais = [];

obraPaths.forEach((src, i) => {
  const textura = textureLoader.load(src);
  const ang = (i / obraPaths.length) * Math.PI * 2;
  const x = Math.cos(ang) * config.circleRadius;
  const z = Math.sin(ang) * config.circleRadius;
  const ry = -ang + Math.PI;

  const obra = new THREE.Mesh(
    new THREE.PlaneGeometry(config.obraSize, config.obraSize),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true
    })
  );
  obra.position.set(x, 4.2, z);
  obra.rotation.y = ry;
  obra.castShadow = true;
  scene.add(obra);

  const reflexo = obra.clone();
  reflexo.position.y = -0.01;
  reflexo.scale.y = -1;
  reflexo.material = obra.material.clone();
  reflexo.material.opacity = 0.25;
  reflexo.material.transparent = true;
  reflexo.material.depthWrite = false;
  reflexo.material.roughness = 0.45;
  reflexo.material.metalness = 0.6;
  reflexo.renderOrder = 1;
  scene.add(reflexo);

  obra.userData.reflexo = reflexo;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();

  obrasNormais.push(obra);
});

// Animação contínua e desacelerada
function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -0.000085;
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
      reflexo.position.lerp(reflexo.userData.targetPos, 0.12);
      reflexo.rotation.y += (ry - reflexo.rotation.y) * 0.12;
    }
  });

  renderer.render(scene, camera);
}

animate();
