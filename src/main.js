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
renderer.toneMappingExposure = 2.2;

// Luz ambiente reforçada
const luzAmbiente1 = new THREE.AmbientLight(0xfff7e6, 0.85);
const luzAmbiente2 = new THREE.AmbientLight(0xfff7e6, 0.85);
scene.add(luzAmbiente1, luzAmbiente2);

// Luz hemisférica suave
const luzHemisferica = new THREE.HemisphereLight(0xfff3e0, 0x080808, 0.5);
scene.add(luzHemisferica);

// Luz direcional sobre quadros laterais e central (sem ofuscar)
const luzQuadroEsq = new THREE.SpotLight(0xfff2dd, 1.2, 12, Math.PI / 7, 0.3);
luzQuadroEsq.position.set(-13.5, 10, -config.wallDistance / 2);
luzQuadroEsq.target.position.set(-14.5, 6, -config.wallDistance / 2);
scene.add(luzQuadroEsq, luzQuadroEsq.target);

const luzQuadroDir = new THREE.SpotLight(0xfff2dd, 1.2, 12, Math.PI / 7, 0.3);
luzQuadroDir.position.set(13.5, 10, -config.wallDistance / 2);
luzQuadroDir.target.position.set(14.5, 6, -config.wallDistance / 2);
scene.add(luzQuadroDir, luzQuadroDir.target);

const luzQuadroCentro = new THREE.SpotLight(0xfff2dd, 1.1, 13, Math.PI / 9, 0.4);
luzQuadroCentro.position.set(0, 11.5, -config.wallDistance + 1);
luzQuadroCentro.target.position.set(0, 6.8, -config.wallDistance + 0.01);
scene.add(luzQuadroCentro, luzQuadroCentro.target);

// Chão mais reflexivo e transparente
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
  clipBias: 0.001,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0a0a0a,
  recursion: 2
});

floor.material.opacity = 0.92;
floor.material.roughness = 0.015;
floor.material.metalness = 0.99;
floor.material.transparent = true;
floor.material.envMapIntensity = 1.5;
floor.material.reflectivity = 0.97;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
// Cor dourada fiel ao layout (imagem "dourado para friso.png")
const corDouradoFriso = new THREE.Color('#8a5c20');

// Material geral para todos os frisos embutidos
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: corDouradoFriso,
  metalness: 1,
  roughness: 0.08,
  emissive: 0x3a240a,
  emissiveIntensity: 0.35
});

// Função para criar frisos arredondados com TubeGeometry
function criarFrisoContorno(pontos, radius = 0.025) {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const geometry = new THREE.TubeGeometry(curva, 120, radius, 12, true);
  const mesh = new THREE.Mesh(geometry, frisoMaterial);
  mesh.castShadow = false;
  scene.add(mesh);
  return mesh;
}

// Friso central com contorno arredondado à volta do quadro central
const alturaCentro = 6.9;
const larguraFriso = 4.4;
const alturaFriso = 5.4;
const raioCurva = 0.3;
const zFriso = -config.wallDistance + 0.015;

// Cálculo dos pontos arredondados
const pontosFrisoCentral = [
  new THREE.Vector3(-larguraFriso / 2 + raioCurva, alturaCentro + alturaFriso / 2, zFriso),
  new THREE.Vector3(larguraFriso / 2 - raioCurva, alturaCentro + alturaFriso / 2, zFriso),
  new THREE.Vector3(larguraFriso / 2, alturaCentro + alturaFriso / 2 - raioCurva, zFriso),
  new THREE.Vector3(larguraFriso / 2, alturaCentro - alturaFriso / 2 + raioCurva, zFriso),
  new THREE.Vector3(larguraFriso / 2 - raioCurva, alturaCentro - alturaFriso / 2, zFriso),
  new THREE.Vector3(-larguraFriso / 2 + raioCurva, alturaCentro - alturaFriso / 2, zFriso),
  new THREE.Vector3(-larguraFriso / 2, alturaCentro - alturaFriso / 2 + raioCurva, zFriso),
  new THREE.Vector3(-larguraFriso / 2, alturaCentro + alturaFriso / 2 - raioCurva, zFriso),
  new THREE.Vector3(-larguraFriso / 2 + raioCurva, alturaCentro + alturaFriso / 2, zFriso) // Fecha o laço
];

criarFrisoContorno(pontosFrisoCentral);

// Linha horizontal interna no friso central (ligeiramente abaixo do topo)
const linhaInterna = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 0.06, 0.02),
  frisoMaterial
);
linhaInterna.position.set(0, alturaCentro + alturaFriso / 2 - 0.35, zFriso + 0.001);
scene.add(linhaInterna);

// Frisos horizontais inferiores da parede de fundo (não no chão)
const frisoInferiorParede = new THREE.Mesh(
  new THREE.BoxGeometry(36, 0.05, 0.02),
  frisoMaterial
);
frisoInferiorParede.position.set(0, 1.1, -config.wallDistance + 0.015);
scene.add(frisoInferiorParede);

// Continuação do friso inferior nas laterais — esquerda e direita
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
// 🖼️ Quadro central – agora maior e perfeitamente centrado no novo friso
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroDecorativoFundo = new THREE.Group();
const larguraQuadro = 3.85;
const alturaQuadro = 4.8;

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.12,
    metalness: 0.12
  })
);
pintura.position.z = 0.012;
quadroDecorativoFundo.add(pintura);

quadroDecorativoFundo.position.set(0, 6.9, -config.wallDistance + 0.001);
scene.add(quadroDecorativoFundo);

// 🖼️ Quadros laterais com aumento proporcional e maior presença visual
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

  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 3.5),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.17,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );

  quadro.position.set(x, y, z + 0.001);
  quadro.rotation.y = rotY;
  quadro.receiveShadow = true;
  scene.add(quadro);
});

// ✨ Texto NANdART com dourado mais vivo e iluminação dedicada
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
    const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: 0xf8d189,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0x6c4718,
        emissiveIntensity: 0.5
      })
    );

    texto.position.set(-largura / 2, 16.4, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.5, 13, Math.PI / 9, 0.5);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);
// Textura da gema azul original
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');

// Material dourado realista para a tampa dos pedestais
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

// Função para criar vitrine com pedestal e gema luminosa
function criarVitrine(x, z, indice) {
  const alturaPedestal = 3.6;
  const alturaGema = alturaPedestal + 1.0;
  const emissivaBase = 0x3377cc;
  const intensidade = 1.9;

  // Pedestal escuro e sóbrio
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

  // Tampa dourada
  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, alturaPedestal + 0.03, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

  // Vitrine transparente e espessa
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

  // Gema facetada com brilho suave
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

// Criar vitrines — duas de cada lado conforme layout
criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);

// Círculo de luz no chão – dimensão e brilho subtis
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

// Obras suspensas normais – tamanho duplicado e reflexo animado
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
    new THREE.PlaneGeometry(config.obraSize * 2, config.obraSize * 2),
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
  reflexo.material.roughness = 0.5;
  reflexo.material.metalness = 0.6;
  reflexo.renderOrder = 1;
  scene.add(reflexo);

  obra.userData.reflexo = reflexo;
  reflexo.userData.targetPos = new THREE.Vector3();
  reflexo.userData.targetRot = new THREE.Euler();

  obrasNormais.push(obra);
});
// Redimensionamento automático do renderer e da câmara
window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ✨ Reflexos animados subtis nas molduras e gemas

// Moldura do quadro central – brilho pulsante
gsap.to(pintura.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => pintura.material.needsUpdate = true
});

// Frisos dourados – pulsação suave e contínua
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.color &&
    obj.material.color.getHexString() === '8a5c20'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.45,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// Gemas – brilho mágico e oscilante
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 2.2,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// ✨ Animação contínua das obras suspensas e reflexos sincronizados
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