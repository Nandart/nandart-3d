import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import { Reflector } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/objects/Reflector.js';
import { FontLoader } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/geometries/TextGeometry.js';
import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/ScrollTrigger.js';
import { MotionPathPlugin } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/MotionPathPlugin.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

function getViewportLevel() {
  const largura = window.innerWidth;
  if (largura < 480) return 'XS';
  if (largura < 768) return 'SM';
  if (largura < 1024) return 'MD';
  return 'LG';
}

const configMap = {
  XS: { obraSize: 1.2, circleRadius: 2.4, wallDistance: 8, cameraZ: 13, cameraY: 5.5, textSize: 0.4 },
  SM: { obraSize: 1.35, circleRadius: 2.6, wallDistance: 9, cameraZ: 13, cameraY: 5.5, textSize: 0.45 },
  MD: { obraSize: 1.5, circleRadius: 3.1, wallDistance: 10, cameraZ: 13, cameraY: 5.5, textSize: 0.5 },
  LG: { obraSize: 1.65, circleRadius: 3.5, wallDistance: 10.5, cameraZ: 13, cameraY: 5.5, textSize: 0.55 }
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
renderer.toneMappingExposure = 1.1;

// Iluminação com intensidade reduzida para ambiente mais realista
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 0.25);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 0.25);
scene.add(luzAmbiente1, luzAmbiente2);

const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.2);
scene.add(luzHemisferica);

// Luz lateral suave
const luz

// ✨ Cor dourada realista (RGB 138, 92, 33)
const frisoMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a5c21,
  metalness: 1,
  roughness: 0.08,
  emissive: new THREE.Color(0x3a240a),
  emissiveIntensity: 0.3
});

// 🖼️ Quadro central aumentado com maior presença
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroDecorativoFundo = new THREE.Group();
const larguraQuadro = 4.5;
const alturaQuadro = 5.8;

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

// Posicionado no centro do novo friso
quadroDecorativoFundo.position.set(0, 7.4, -config.wallDistance + 0.001);
scene.add(quadroDecorativoFundo);

// 🟡 Friso central retangular com contorno arredondado
const frisoTopo = new THREE.Mesh(
  new THREE.BoxGeometry(4.6, 0.06, 0.02),
  frisoMaterial
);
frisoTopo.position.set(0, 10.2, -config.wallDistance + 0.01);
scene.add(frisoTopo);

const frisoBase = new THREE.Mesh(
  new THREE.BoxGeometry(4.6, 0.06, 0.02),
  frisoMaterial
);
frisoBase.position.set(0, 4.6, -config.wallDistance + 0.01);
scene.add(frisoBase);

const frisoEsquerda = new THREE.Mesh(
  new THREE.CylinderGeometry(0.03, 0.03, 5.6, 16),
  frisoMaterial
);
frisoEsquerda.rotation.z = Math.PI / 2;
frisoEsquerda.position.set(-2.28, 7.4, -config.wallDistance + 0.01);
scene.add(frisoEsquerda);

const frisoDireita = new THREE.Mesh(
  new THREE.CylinderGeometry(0.03, 0.03, 5.6, 16),
  frisoMaterial
);
frisoDireita.rotation.z = Math.PI / 2;
frisoDireita.position.set(2.28, 7.4, -config.wallDistance + 0.01);
scene.add(frisoDireita);

// ➖ Friso horizontal interno paralelo no topo
const frisoInternoTopo = new THREE.Mesh(
  new THREE.BoxGeometry(3.4, 0.055, 0.02),
  frisoMaterial
);
frisoInternoTopo.position.set(0, 9.65, -config.wallDistance + 0.011);
scene.add(frisoInternoTopo);

// 🟫 Frisos horizontais inferiores da parede de fundo
const frisoInferiorCentro = new THREE.Mesh(
  new THREE.BoxGeometry(36, 0.06, 0.02),
  frisoMaterial
);
frisoInferiorCentro.position.set(0, 0.62, -config.wallDistance + 0.015);
scene.add(frisoInferiorCentro);

// Frisos contínuos nas laterais
const frisoInferiorEsquerdo = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 0.06, 0.02),
  frisoMaterial
);
frisoInferiorEsquerdo.position.set(-16.2, 0.62, -config.wallDistance / 2);
frisoInferiorEsquerdo.rotation.y = Math.PI / 2;
scene.add(frisoInferiorEsquerdo);

const frisoInferiorDireito = new THREE.Mesh(
  new THREE.BoxGeometry(2.4, 0.06, 0.02),
  frisoMaterial
);
frisoInferiorDireito.position.set(16.2, 0.62, -config.wallDistance / 2);
frisoInferiorDireito.rotation.y = -Math.PI / 2;
scene.add(frisoInferiorDireito);

// 🌫️ Chão com maior reflexo e translucidez
floor.material.opacity = 0.75;
floor.material.roughness = 0.015;
floor.material.metalness = 1.0;
floor.material.transparent = true;
floor.material.reflectivity = 1.0;
floor.material.envMapIntensity = 1.6;



// Reforço visual da palavra NANdART
const fontLoader = new FontLoader();
fontLoader.load(
  'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
  font => {
    const textGeo = new TextGeometry('NANdART', {
      font,
      size: config.textSize,
      height: 0.12,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.018,
      bevelSegments: 5
    });

    textGeo.computeBoundingBox();
    const largura = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

    const texto = new THREE.Mesh(
      textGeo,
      new THREE.MeshStandardMaterial({
        color: frisoCorHex,
        metalness: 1,
        roughness: 0.15,
        emissive: 0x3a1f0a,
        emissiveIntensity: 0.35
      })
    );

    texto.position.set(-largura / 2, 16.5, -config.wallDistance - 3.985);
    texto.castShadow = true;
    scene.add(texto);

    // Luz dedicada com foco suave
    const luzTexto = new THREE.SpotLight(0xffe7aa, 1.6, 14, Math.PI / 10, 0.5);
    luzTexto.position.set(0, 18.2, -config.wallDistance - 2);
    luzTexto.target = texto;
    scene.add(luzTexto);
    scene.add(luzTexto.target);
  }
);
// 🖼️ Quadro central aumentado e reposicionado no centro do friso
const texturaCentral = textureLoader.load(
  '/assets/obras/obra-central.jpg',
  undefined,
  undefined,
  err => console.error('Erro a carregar obra-central.jpg:', err)
);

const quadroDecorativoFundo = new THREE.Group();
const larguraQuadroCentral = 7.2;
const alturaQuadroCentral = 9.0;

const pintura = new THREE.Mesh(
  new THREE.PlaneGeometry(larguraQuadroCentral, alturaQuadroCentral),
  new THREE.MeshStandardMaterial({
    map: texturaCentral,
    roughness: 0.15,
    metalness: 0.1
  })
);
pintura.position.z = 0.01;
quadroDecorativoFundo.add(pintura);

quadroDecorativoFundo.position.set(0, 6.9, -config.wallDistance + 0.001);
scene.add(quadroDecorativoFundo);

// Iluminação suave para a obra central
const luzObraCentral = new THREE.SpotLight(0xfff1dd, 0.65, 12, Math.PI / 8, 0.3);
luzObraCentral.position.set(0, 14, -config.wallDistance + 2);
luzObraCentral.target = quadroDecorativoFundo;
scene.add(luzObraCentral);
scene.add(luzObraCentral.target);

// 🖼️ Quadros laterais — aumentados e com moldura saliente
const obrasParede = [
  {
    src: '/assets/obras/obra-lateral-esquerda.jpg',
    x: -14.55, y: 6.1, z: -config.wallDistance / 2,
    rotY: Math.PI / 2
  },
  {
    src: '/assets/obras/obra-lateral-direita.jpg',
    x: 14.55, y: 6.1, z: -config.wallDistance / 2,
    rotY: -Math.PI / 2
  }
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
  const textura = textureLoader.load(src);

  const largura = 4.4;
  const altura = 6.4;
  const espessura = 0.12;

  // Moldura 3D saliente
  const moldura = new THREE.Mesh(
    new THREE.BoxGeometry(largura + 0.2, altura + 0.2, espessura),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x8a5c20),
      metalness: 1,
      roughness: 0.15,
      emissive: new THREE.Color(0x2a1a08),
      emissiveIntensity: 0.35
    })
  );
  moldura.position.set(x, y, z);
  moldura.rotation.y = rotY;
  scene.add(moldura);

  // Obra dentro da moldura
  const quadro = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, altura),
    new THREE.MeshStandardMaterial({
      map: textura,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.FrontSide
    })
  );
  quadro.position.set(x, y, z + 0.065);
  quadro.rotation.y = rotY;
  quadro.castShadow = true;
  scene.add(quadro);

  // Luz suave para a obra lateral
  const focoObra = new THREE.SpotLight(0xfff3d0, 0.5, 6, Math.PI / 9, 0.4);
  focoObra.position.set(x, y + 3.5, z + (rotY > 0 ? 2 : -2));
  focoObra.target = quadro;
  scene.add(focoObra);
  scene.add(focoObra.target);
});
// Luz suave para destacar a obra da parede de fundo (central)
const luzObraCentral = new THREE.SpotLight(0xfff2c7, 1.1, 15, Math.PI / 8, 0.5);
luzObraCentral.position.set(0, 11, -config.wallDistance + 1);
luzObraCentral.target.position.set(0, 7.5, -config.wallDistance + 0.01);
scene.add(luzObraCentral);
scene.add(luzObraCentral.target);

// Luzes para destacar obras laterais
const luzObraEsquerda = new THREE.SpotLight(0xfff2c7, 0.9, 12, Math.PI / 9, 0.4);
luzObraEsquerda.position.set(-12.5, 10, -config.wallDistance / 2 + 1.2);
luzObraEsquerda.target.position.set(-14.5, 6.2, -config.wallDistance / 2 + 0.1);
scene.add(luzObraEsquerda);
scene.add(luzObraEsquerda.target);

const luzObraDireita = new THREE.SpotLight(0xfff2c7, 0.9, 12, Math.PI / 9, 0.4);
luzObraDireita.position.set(12.5, 10, -config.wallDistance / 2 + 1.2);
luzObraDireita.target.position.set(14.5, 6.2, -config.wallDistance / 2 + 0.1);
scene.add(luzObraDireita);
scene.add(luzObraDireita.target);

// Nome NANdART com dourado mais vivo e luz dedicada já incluída
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
        color: 0xc9a33e,
        metalness: 1,
        roughness: 0.25,
        emissive: new THREE.Color(0x442c10),
        emissiveIntensity: 0.5
      })
    );

    texto.position.set(-largura /
// ✨ Animação contínua das obras suspensas e dos seus reflexos
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
// ✨ Reflexos vivos e subtis nas gemas, frisos e molduras

// Moldura do quadro central – brilho oscilante
gsap.to(pintura.material, {
  emissiveIntensity: 0.15,
  duration: 5,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
  onUpdate: () => (pintura.material.needsUpdate = true)
});

// Frisos dourados — pulsação suave e contínua
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.material.emissiveIntensity &&
    obj.material.color &&
    obj.material.color.getHex() === 0x8a5c21
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 0.4,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});

// Gemas dentro das vitrines — vibração luminosa contínua
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material &&
    obj.material.emissive &&
    obj.geometry?.type === 'IcosahedronGeometry'
  ) {
    gsap.to(obj.material, {
      emissiveIntensity: 2.0,
      duration: 4.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
});
// 🔄 Ajustes dinâmicos ao redimensionar a janela
window.addEventListener('resize', () => {
  config = configMap[getViewportLevel()];

  // Atualiza câmara com nova proporção e posição adaptada
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.set(0, config.cameraY + 5.8, config.cameraZ + 13);
  camera.lookAt(0, 7, -config.wallDistance + 0.8);
  camera.updateProjectionMatrix();

  // Ajusta tamanho do renderizador
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
// 🔄 Animação contínua das obras suspensas em círculo e respetivos reflexos
function animate() {
  requestAnimationFrame(animate);

  const tempo = Date.now() * -0.00012;

  obrasNormais.forEach((obra, i) => {
    const ang = tempo + (i / obrasNormais.length) * Math.PI * 2;
    const x = Math.cos(ang) * config.circleRadius;
    const z = Math.sin(ang) * config.circleRadius;
    const ry = -ang + Math.PI;

    obra.position.set(x, 4.2, z);
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
