import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Reflector } from 'three/addons/objects/Reflector.js';

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

// 🌕 Luz ambiente central — triplicada
const luzAmbienteCentral = new THREE.PointLight(0xfff2dd, 1.8, 50, 2);
luzAmbienteCentral.position.set(0, 9.5, 0);
scene.add(luzAmbienteCentral);

// 🌗 Luz hemisférica quente
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 1.5);
scene.add(luzHemisferica);

// 🎯 Luz rasante lateral esquerda
const luzRasanteEsquerda = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
luzRasanteEsquerda.position.set(-12, 5.5, 0);
luzRasanteEsquerda.target.position.set(-12, 5.5, -10);
scene.add(luzRasanteEsquerda, luzRasanteEsquerda.target);

// 🎯 Luz rasante lateral direita
const luzRasanteDireita = new THREE.SpotLight(0xfff0db, 0.35, 18, Math.PI / 5, 0.5);
luzRasanteDireita.position.set(12, 5.5, 0);
luzRasanteDireita.target.position.set(12, 5.5, -10);
scene.add(luzRasanteDireita, luzRasanteDireita.target);

// 🌌 Chão reflexivo tipo obsidiana líquida
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

// 💫 Luz rasante para reforçar reflexo no chão
const luzRasante = new THREE.SpotLight(0xfff8e0, 1.3, 20, Math.PI / 7, 0.5);
luzRasante.position.set(0, 4.5, 4);
luzRasante.target.position.set(0, 0, 0);
scene.add(luzRasante, luzRasante.target);

gsap.to(luzRasante, {
  intensity: 1.6,
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut'
});

// 🔘 Círculo de luz elegante no chão
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

// 🎨 Texturas base
const textureLoader = new THREE.TextureLoader();
const texturaGema = textureLoader.load('/assets/gemas/gema-azul.jpg.png');
const texturaParede = textureLoader.load('/assets/parede-antracite.jpg');
// 🧱 Parede de fundo completa e texturizada
const paredeGeo = new THREE.PlaneGeometry(40, 30);
const paredeMaterial = new THREE.MeshStandardMaterial({
  map: texturaParede,
  roughness: 0.9,
  metalness: 0.1,
  side: THREE.FrontSide
});
const backWall = new THREE.Mesh(paredeGeo, paredeMaterial);
backWall.position.set(0, 13, -config.wallDistance - 4.05);
backWall.receiveShadow = true;
scene.add(backWall);

// 📐 Painel central com cantos arredondados e traço horizontal
const painelCentral = new THREE.Mesh(
  new THREE.ShapeGeometry(
    (() => {
      const shape = new THREE.Shape();
      const r = 0.6, w = 6, h = 12;
      shape.moveTo(-w / 2 + r, -h / 2);
      shape.lineTo(w / 2 - r, -h / 2);
      shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      shape.lineTo(w / 2, h / 2 - r);
      shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      shape.lineTo(-w / 2 + r, h / 2);
      shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      shape.lineTo(-w / 2, -h / 2 + r);
      shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      return shape;
    })()
  ),
  new THREE.MeshStandardMaterial({
    color: 0x2b2b2b,
    roughness: 0.6,
    metalness: 0.15
  })
);
painelCentral.position.set(0, 13, -config.wallDistance - 4.04);
scene.add(painelCentral);

// ➖ Traço horizontal subtil no topo do painel central
const traçoTopo = new THREE.Mesh(
  new THREE.BoxGeometry(3.5, 0.06, 0.01),
  new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: 0.4 })
);
traçoTopo.position.set(0, 18.5, -config.wallDistance - 4.03);
scene.add(traçoTopo);

// 🧭 Painéis laterais com molduras internas embutidas
function criarPainelVerticalComMoldura(x) {
  const grupo = new THREE.Group();

  const painel = new THREE.Mesh(
    new THREE.ShapeGeometry(
      (() => {
        const shape = new THREE.Shape();
        const r = 0.5, w = 3, h = 14;
        shape.moveTo(-w / 2 + r, -h / 2);
        shape.lineTo(w / 2 - r, -h / 2);
        shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        shape.lineTo(w / 2, h / 2 - r);
        shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        shape.lineTo(-w / 2 + r, h / 2);
        shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        shape.lineTo(-w / 2, -h / 2 + r);
        shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
        return shape;
      })()
    ),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      metalness: 0.15
    })
  );
  painel.position.set(0, 0, 0);
  grupo.add(painel);

  const molduraInterna = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 10.5, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x393939, roughness: 0.4 })
  );
  molduraInterna.position.set(0, 0, 0.01);
  grupo.add(molduraInterna);

  grupo.position.set(x, 13, -config.wallDistance - 4.03);
  scene.add(grupo);
}
criarPainelVerticalComMoldura(-7.8);
criarPainelVerticalComMoldura(7.8);

// 🪵 Dois frisos horizontais contínuos (base da parede de fundo)
function criarFrisoInferior(z) {
  const friso = new THREE.Mesh(
    new THREE.BoxGeometry(42, 0.06, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4 })
  );
  friso.position.set(0, 0.3 + z, -config.wallDistance - 4.02);
  scene.add(friso);
}
criarFrisoInferior(0);
criarFrisoInferior(0.25);
// ✨ Vitrines com gemas facetadas

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
  const alturaGema = 3.3 + (indice % 2 === 0 ? 0.08 : -0.06);
  const emissivaBase = indice % 2 === 0 ? 0x3366aa : 0x3377cc;

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

  const topoDourado = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32),
    materialDouradoPedestal
  );
  topoDourado.position.set(x, 2.85, z);
  topoDourado.castShadow = true;
  scene.add(topoDourado);

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

criarVitrine(-9.5, -1.8, 0);
criarVitrine(-9.5, 1.8, 1);
criarVitrine(9.5, -1.8, 2);
criarVitrine(9.5, 1.8, 3);

// 🖼️ Quadro central suspenso com friso circular

const quadroDecorativoFundo = new THREE.Group();

const larguraQuadro = 3.6;
const alturaQuadro = 4.5;

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

// ✨ Texto "NANdART" com iluminação

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

    texto.position.set(-largura / 2, 16.5, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    const luzTexto = new THREE.SpotLight(0xfff1cc, 1.4, 12, Math.PI / 9, 0.5);
    luzTexto.position.set(0, 18, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto, luzTexto.target);
  }
);
// 🖼️ Obras suspensas com reflexo e rotação — tamanho duplicado já aplicado

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

// 🌟 Animação suave de rotação contínua das obras suspensas

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

// ✨ Animações subtis de brilho nas molduras e gemas

gsap.to(pintura.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => pintura.material.needsUpdate = true
});

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

// 🔄 Responsividade da câmara e renderer

window.addEventListener('resize', () => {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
