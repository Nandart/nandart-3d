import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';

function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5 },
  SM: { obraSize: 1.0, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5 },
  MD: { obraSize: 1.1, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5 },
  LG: { obraSize: 1.2, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5 }
};

let config = configMap[getViewportLevel()];
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const paredeTexture = textureLoader.load('/assets/IMG_2945.jpg');

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
function updateCamera() {
  config = configMap[getViewportLevel()];
  camera.position.set(0, 3.5, config.cameraZ + 18);
  camera.lookAt(0, 4.5, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();
}
updateCamera();

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.4;

// Iluminação duplicada e equilibrada
const luzAmbiente1 = new THREE.AmbientLight(0xfff8ec, 1.6);
const luzAmbiente2 = new THREE.AmbientLight(0xfff8ec, 1.6);
scene.add(luzAmbiente1, luzAmbiente2);

const luzHemisferica = new THREE.HemisphereLight(0xfff5e0, 0x222222, 1.2);
scene.add(luzHemisferica);
// Textura antracite aplicada às paredes
const paredeMaterial = new THREE.MeshStandardMaterial({
  map: paredeTexture,
  metalness: 0.4,
  roughness: 0.6
});

const paredeFundo = new THREE.Mesh(
  new THREE.PlaneGeometry(32, 18),
  paredeMaterial
);
paredeFundo.position.set(0, 9, -config.wallDistance);
scene.add(paredeFundo);

const paredeEsquerda = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  paredeMaterial
);
paredeEsquerda.position.set(-16, 9, -config.wallDistance / 2);
paredeEsquerda.rotation.y = Math.PI / 2;
scene.add(paredeEsquerda);

const paredeDireita = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 18),
  paredeMaterial
);
paredeDireita.position.set(16, 9, -config.wallDistance / 2);
paredeDireita.rotation.y = -Math.PI / 2;
scene.add(paredeDireita);

// Cor dourada e material dos frisos
const corDouradoFriso = new THREE.Color('#8a5c20');
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: corDouradoFriso,
  metalness: 1,
  roughness: 0.05,
  emissive: corDouradoFriso.clone().multiplyScalar(0.5),
  emissiveIntensity: 0.55
});

// Friso central com contorno arredondado e maior espaçamento
function criarFrisoContorno(pontos, radius = 0.027) {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const geometry = new THREE.TubeGeometry(curva, 120, radius, 12, true);
  const mesh = new THREE.Mesh(geometry, frisoMaterial);
  scene.add(mesh);
}

const alturaCentro = 9.5;
const larguraFriso = 5.4;
const alturaFriso = 6.2;
const raioCurva = 0.3;
const zFriso = -config.wallDistance + 0.01;

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

// Linha interna horizontal superior
const linhaInterna = new THREE.Mesh(
  new THREE.BoxGeometry(3.6, 0.06, 0.02),
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

// Continuação dos frisos nas paredes laterais
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
// 🖼️ Quadro central com moldura saliente escura
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro ao carregar obra-central.jpg:', err)
);

const larguraQuadro = 3.85;
const alturaQuadro = 4.8;
const espessuraMoldura = 0.18;

const quadroCentral = new THREE.Group();

// Moldura escura (Box com cavidade interna)
const molduraExt = new THREE.Mesh(
  new THREE.BoxGeometry(larguraQuadro + espessuraMoldura, alturaQuadro + espessuraMoldura, 0.15),
  new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.3,
    roughness: 0.6
  })
);
molduraExt.position.z = 0.06;
quadroCentral.add(molduraExt);

// Tela da pintura central
const tela = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.1,
    metalness: 0.15
  })
);
tela.position.z = 0.12;
quadroCentral.add(tela);

quadroCentral.position.set(0, 9.5, -config.wallDistance + 0.001);
scene.add(quadroCentral);

// 🖼️ Quadros laterais com moldura saliente idêntica
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.55, y: 6.2, z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.55, y: 6.2, z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);

  const quadro = new THREE.Group();

  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 3.7, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.6
    })
  );
  moldura.position.z = 0.04;
  quadro.add(moldura);

  const telaObra = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 3.5),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.12,
      metalness: 0.1
    })
  );
  telaObra.position.z = 0.09;
  quadro.add(telaObra);

  quadro.position.set(x, y, z + 0.002);
  quadro.rotation.y = rotY;
  scene.add(quadro);
});
// Círculo de luz totalmente visível e assente no chão
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
circle.position.y = 0.008;
circle.receiveShadow = true;
scene.add(circle);

// Texto "NANdART" com material dourado e luz dirigida
const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: 0.75,
      height: 0.12,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.018,
      bevelSegments: 6
    });

    textGeo.computeBoundingBox();
    const larguraTexto = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const textoMesh = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: 0xf8d189,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0x6c4718,
        emissiveIntensity: 0.6
      })
    );

    textoMesh.position.set(-larguraTexto / 2, 16.4, -config.wallDistance - 3.98);
    textoMesh.castShadow = true;
    scene.add(textoMesh);

    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.6, 13, Math.PI / 9, 0.5);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = textoMesh;
    scene.add(luzTexto, luzTexto.target);
  }
);
// Textura da gema azul
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// Material dourado vivo para a tampa dos pedestais
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

// Criar vitrine com gema sobre pedestal
function criarVitrine(x, z, indice) {
  const alturaPedestal = 3.6;
  const alturaGema = alturaPedestal + 1.0;

  const pedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, alturaPedestal, 1.05),
    new THREE.MeshStandardMaterial({
      color: 0x121212,
      roughness: 0.55,
      metalness: 0.2
    })
  );
  pedestal.position.set(x, alturaPedestal / 2, z);
  pedestal.castShadow = true;
  scene.add(pedestal);

  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaPedestal + 0.03, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  const vitrine = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 1.15, 1.0),
    new THREE.MeshPhysicalMaterial({
      color: 0xf8f8f8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 1,
      thickness: 0.35,
      transparent: true,
      opacity: 0.11,
      ior: 1.45,
      reflectivity: 0.65,
      clearcoat: 0.85,
      clearcoatRoughness: 0.05
    })
  );
  vitrine.position.set(x, alturaPedestal + 0.6, z);
  vitrine.castShadow = true;
  scene.add(vitrine);

  const gema = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 1),
    new THREE.MeshStandardMaterial({
      map: texturaGema,
      emissive: 0x3377cc,
      emissiveIntensity: 1.9,
      transparent: true,
      opacity: 0.95
    })
  );
  gema.position.set(x, alturaGema, z);
  gema.rotation.y = indice * 0.3;
  gema.castShadow = true;
  scene.add(gema);
}

// Quatro vitrines – duas de cada lado
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);

// Obras suspensas – circulares com reflexo
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
    new THREE.PlaneGeometry(config.obraSize / 2, config.obraSize / 2),
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

  const reflexo = obra.clone();
  reflexo.position.y = -0.01;
  reflexo.scale.y = -1;
  reflexo.material = obra.material.clone();
  reflexo.material.opacity = 0.2;
  reflexo.material.transparent = true;
  reflexo.material.depthWrite = false;
  reflexo.renderOrder = 1;
  scene.add(reflexo);

  obra.userData.reflexo = reflexo;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();

  obrasNormais.push(obra);
});

// Responsividade
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animação contínua
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
