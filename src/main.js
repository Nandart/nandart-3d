[file content begin]
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ethers } from 'ethers';

// Selecionar o botão da carteira
const walletButton = document.getElementById('wallet-button');

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Sistema de responsividade mais eficaz
function getViewportLevel() {
const largura = window.innerWidth;
if (largura < 480) return 'XS';
if (largura < 768) return 'SM';
if (largura < 1024) return 'MD';
return 'LG';
}

const configMap = {
XS: { obraSize: 0.9, circleRadius: 2.4, wallDistance: 8, cameraZ: 12, cameraY: 5.4, textSize: 0.4 },
SM: { obraSize: 1.1, circleRadius: 2.8, wallDistance: 9.5, cameraZ: 13, cameraY: 5.7, textSize: 0.45 },
MD: { obraSize: 1.3, circleRadius: 3.3, wallDistance: 10.5, cameraZ: 14, cameraY: 6.1, textSize: 0.5 },
LG: { obraSize: 1.45, circleRadius: 3.6, wallDistance: 11, cameraZ: 15, cameraY: 6.4, textSize: 0.55 }
};

let config = configMap[getViewportLevel()];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const textureLoader = new THREE.TextureLoader();

// Configuração avançada da câmera para capturar toda a cena
const camera = new THREE.PerspectiveCamera();
function updateCamera() {
config = configMap[getViewportLevel()];
camera.fov = 45;
camera.aspect = window.innerWidth / window.innerHeight;
camera.position.set(0, 9, 22);
camera.lookAt(0, 7, -config.wallDistance);
camera.near = 0.1;
camera.far = 100;
camera.updateProjectionMatrix();
}
updateCamera();

const renderer = new THREE.WebGLRenderer({
canvas: document.getElementById('scene'),
antialias: true,
alpha: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.25;

window.addEventListener('resize', () => {
updateCamera();
renderer.setSize(window.innerWidth, window.innerHeight);
});

// Iluminação ambiente ajustada
const luzAmbiente1 = new THREE.AmbientLight(0xfff2dd, 0.6);
const luzAmbiente2 = new THREE.AmbientLight(0xfff2dd, 0.6);
scene.add(luzAmbiente1, luzAmbiente2);

// Luz hemisférica para brilho subtil
const luzHemisferica = new THREE.HemisphereLight(0xfff2e0, 0x080808, 0.35);
scene.add(luzHemisferica);

// Luz rasante esquerda com projecção lateral realista
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

// Pavimento reflectivo e translúcido preto
const floorGeometry = new THREE.PlaneGeometry(40, 40);
const floor = new Reflector(floorGeometry, {
clipBias: 0.001,
textureWidth: window.innerWidth * window.devicePixelRatio,
textureHeight: window.innerHeight * window.devicePixelRatio,
color: 0x000000,
recursion: 2
});

floor.material.opacity = 0.22;
floor.material.roughness = 0.01;
floor.material.metalness = 0.99;
floor.material.transparent = true;
floor.material.envMapIntensity = 2.8;
floor.material.reflectivity = 0.99;
floor.material.ior = 1.45;
floor.material.thickness = 0.5;

floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ✨ Círculo de luz com brilho forte
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

// Material dourado vivo para frisos com emissão intensa
const frisoMaterial = new THREE.MeshStandardMaterial({
color: 0xf3cc80,
metalness: 1,
roughness: 0.08,
emissive: 0xf3cc80,
emissiveIntensity: 0.45
});

// Função para frisos simples
function criarFrisoLinha(x, y, z, largura, altura = 0.06, rotY = 0) {
const friso = new THREE.Mesh(
new THREE.BoxGeometry(largura, altura, 0.02),
frisoMaterial
);
friso.position.set(x, y, z);
friso.rotation.y = rotY;
friso.castShadow = false;
scene.add(friso);
return friso;
}

// Função para frisos rectangulares
function criarFrisoRect(x, y, z, largura, altura, rotY = 0) {
const group = new THREE.Group();
const espessura = 0.06;

const topo = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
topo.position.set(0, altura / 2, 0);
group.add(topo);

const base = new THREE.Mesh(new THREE.BoxGeometry(largura, espessura, 0.02), frisoMaterial);
base.position.set(0, -altura / 2, 0);
group.add(base);

const esquerda = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02), frisoMaterial);
esquerda.position.set(-largura / 2 + espessura / 2, 0, 0);
group.add(esquerda);

const direita = new THREE.Mesh(new THREE.BoxGeometry(espessura, altura - espessura * 2, 0.02), frisoMaterial);
direita.position.set(largura / 2 - espessura / 2, 0, 0);
group.add(direita);

group.position.set(x, y, z);
group.rotation.y = rotY;
scene.add(group);
return group;
}

// 🟡 Friso central redesenhado
const frisoCentral = criarFrisoRect(
0,
10.3,
-config.wallDistance + 0.01,
6.8,
7.0
);

// Friso horizontal interior
criarFrisoLinha(
0,
13.1,
-config.wallDistance + 0.012,
4.5
);

// 🟡 Frisos laterais duplos
const posXFrisoLateral = 6.7;
const alturaFrisoExt = 8.8;
const alturaFrisoInt = 7.1;

// Lado esquerdo
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(-posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// Lado direito
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.01, 3.2, alturaFrisoExt);
criarFrisoRect(posXFrisoLateral, 10.3, -config.wallDistance + 0.012, 1.6, alturaFrisoInt);

// 🟡 Frisos horizontais inferiores nas paredes
criarFrisoLinha(0, 2.0, -config.wallDistance + 0.01, 36); // fundo superior
criarFrisoLinha(0, 1.7, -config.wallDistance + 0.012, 36); // fundo inferior
criarFrisoLinha(-16.2, 2.0, -config.wallDistance / 2, 2.2, 0.06, Math.PI / 2); // lateral esq. sup.
criarFrisoLinha(-16.2, 1.7, -config.wallDistance / 2, 2.2, 0.06, Math.PI / 2); // lateral esq. inf.
criarFrisoLinha(16.2, 2.0, -config.wallDistance / 2, 2.2, 0.06, -Math.PI / 2); // lateral dir. sup.
criarFrisoLinha(16.2, 1.7, -config.wallDistance / 2, 2.2, 0.06, -Math.PI / 2); // lateral dir. inf.

// 🖼️ Textura da obra central
const texturaCentral = textureLoader.load(
'/assets/obras/obra-central.jpg',
undefined,
undefined,
err => console.error('Erro ao carregar obra-central.jpg:', err)
);

const quadroCentralGrupo = new THREE.Group();

// Dimensões reais da pintura
const larguraQuadro = 4.6;
const alturaQuadro = 5.8;

// 🟫 Moldura escura saliente
const molduraCentral = new THREE.Mesh(
new THREE.BoxGeometry(larguraQuadro + 0.3, alturaQuadro + 0.3, 0.18),
new THREE.MeshStandardMaterial({
color: 0x1e1a16,
metalness: 0.6,
roughness: 0.3,
emissive: 0x0d0c0a,
emissiveIntensity: 0.15
})
);
molduraCentral.position.z = -0.1;
quadroCentralGrupo.add(molduraCentral);

// 🖼️ Pintura central
const pinturaCentral = new THREE.Mesh(
new THREE.PlaneGeometry(larguraQuadro, alturaQuadro),
new THREE.MeshStandardMaterial({
map: texturaCentral,
roughness: 0.15,
metalness: 0.1
})
);
pinturaCentral.position.z = 0.01;
quadroCentralGrupo.add(pinturaCentral);

// Posicionamento final do grupo
quadroCentralGrupo.position.set(
0,
10.3,
-config.wallDistance + 0.001
);
scene.add(quadroCentralGrupo);

// Textura antracite ultra realista como fallback
const antraciteTextureData = {
data: new Uint8Array([
80, 80, 80, 255, 85, 85, 85, 255, 75, 75, 75, 255, 90, 90, 90, 255,
85, 85, 85, 255, 80, 80, 80, 255, 75, 75, 75, 255, 70, 70, 70, 255,
90, 90, 90, 255, 85, 85, 85, 255, 80, 80, 80, 255, 75, 75, 75, 255,
70, 70, 70, 255, 65, 65, 65, 255, 60, 60, 60, 255, 55, 55, 55, 255
]),
width: 4,
height: 4
};

const antraciteTexture = new THREE.DataTexture(
antraciteTextureData.data,
antraciteTextureData.width,
antraciteTextureData.height,
THREE.RGBAFormat
);
antraciteTexture.needsUpdate = true;

// 🧱 Geometrias base das paredes
const paredeGeoFundo = new THREE.PlaneGeometry(40, 30);
const paredeGeoLateral = new THREE.PlaneGeometry(30, 28);

// Função utilitária para aplicar textura realista às paredes
const aplicarTexturaParede = textura => {
const paredeMaterial = new THREE.MeshStandardMaterial({
map: textura,
color: 0xffffff,
emissive: new THREE.Color(0x111111),
emissiveIntensity: 0.25,
roughness: 0.65,
metalness: 0.15,
side: THREE.FrontSide
});

// Parede de fundo — central
const paredeFundo = new THREE.Mesh(paredeGeoFundo, paredeMaterial);
paredeFundo.position.set(0, 13.6, -config.wallDistance - 4.1);
paredeFundo.receiveShadow = true;
scene.add(paredeFundo);

// Parede lateral esquerda
const paredeEsquerda = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
paredeEsquerda.position.set(-14.6, 13.4, -config.wallDistance / 2);
paredeEsquerda.rotation.y = Math.PI / 2;
paredeEsquerda.receiveShadow = true;
scene.add(paredeEsquerda);

// Parede lateral direita
const paredeDireita = new THREE.Mesh(paredeGeoLateral, paredeMaterial);
paredeDireita.position.set(14.6, 13.4, -config.wallDistance / 2);
paredeDireita.rotation.y = -Math.PI / 2;
paredeDireita.receiveShadow = true;
scene.add(paredeDireita);
};

// Tentar carregar textura antracite, usar fallback se falhar
textureLoader.load(
'/assets/antracite-realista.jpg',
texturaLocal => {
console.log('✅ Textura antracite local carregada.');
aplicarTexturaParede(texturaLocal);
},
undefined,
() => {
console.warn('⚠️ Falha ao carregar textura local. A usar fallback...');
aplicarTexturaParede(antraciteTexture);
}
);

// 🖼️ Quadros laterais com moldura saliente
const obrasParede = [
{
src: '/assets/obras/obra-lateral-esquerda.jpg',
x: -14.5,
y: 9.1,
z: -config.wallDistance / 2,
rotY: Math.PI / 2
},
{
src: '/assets/obras/obra-lateral-direita.jpg',
x: 14.5,
y: 9.1,
z: -config.wallDistance / 2,
rotY: -Math.PI / 2
}
];

obrasParede.forEach(({ src, x, y, z, rotY }) => {
const textura = textureLoader.load(
src,
undefined,
undefined,
err => console.error(Erro ao carregar ${src}:, err)
);

const largura = 4.4;
const altura = 6.4;

const grupoQuadro = new THREE.Group();

// Moldura escura com relevo e volume
const moldura = new THREE.Mesh(
new THREE.BoxGeometry(largura + 0.3, altura + 0.3, 0.18),
new THREE.MeshStandardMaterial({
color: 0x1e1a16,
metalness: 0.6,
roughness: 0.3,
emissive: 0x0d0c0a,
emissiveIntensity: 0.15
})
);
moldura.position.z = -0.1;
grupoQuadro.add(moldura);

// Pintura com textura individual
const quadro = new THREE.Mesh(
new THREE.PlaneGeometry(largura, altura),
new THREE.MeshStandardMaterial({
map: textura,
roughness: 0.2,
metalness: 0.05,
side: THREE.FrontSide
})
);
quadro.position.z = 0.01;
grupoQuadro.add(quadro);

// Posicionamento final na parede correspondente
grupoQuadro.position.set(x, y, z + 0.01);
grupoQuadro.rotation.y = rotY;
scene.add(grupoQuadro);
});

// Material dourado realista para o topo dos pedestais
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

// Textura da gema facetada azul
const texturaGema = textureLoader.load('/assets/gemas/gema1.png');

// Função para criar uma vitrine completa com pedestal e gema
function criarVitrine(x, z, indice) {
const alturaPedestal = 4.6;
const alturaVitrine = 1.6;
const alturaGema = alturaPedestal + alturaVitrine / 2 + 0.25;
const emissivaBase = 0x3377cc;
const intensidade = 2.4;

// Pedestal negro com volume robusto
const pedestal = new THREE.Mesh(
new THREE.BoxGeometry(1.05, alturaPedestal, 1.05),
new THREE.MeshStandardMaterial({
color: 0x121212,
roughness: 0.5,
metalness: 0.25
})
);
pedestal.position.set(x, alturaPedestal / 2, z);
pedestal.castShadow = true;
scene.add(pedestal);

// Tampa dourada superior
const topoDourado = new THREE.Mesh(
new THREE.CylinderGeometry(0.4, 0.4, 0.06, 32),
materialDouradoPedestal
);
topoDourado.position.set(x, alturaPedestal + 0.03, z);
topoDourado.castShadow = true;
scene.add(topoDourado);

// Vitrine de vidro translúcido
const vitrine = new THREE.Mesh(
new THREE.BoxGeometry(1.0, alturaVitrine, 1.0),
new THREE.MeshPhysicalMaterial({
color: 0xf8f8f8,
metalness: 0.1,
roughness: 0.05,
transmission: 1,
thickness: 0.42,
transparent: true,
opacity: 0.14,
ior: 1.45,
reflectivity: 0.7,
clearcoat: 0.85,
clearcoatRoughness: 0.05
})
);
vitrine.position.set(x, alturaPedestal + alturaVitrine / 2 + 0.06, z);
vitrine.castShadow = true;
scene.add(vitrine);

// Gema facetada azul flutuante
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

// Criar quatro vitrines nos pedestais laterais (15cm de distância das paredes)
criarVitrine(-12.0, -1.8, 0); // Esquerda traseira
criarVitrine(-12.0, 1.8, 1); // Esquerda frontal
criarVitrine(12.0, -1.8, 2); // Direita traseira
criarVitrine(12.0, 1.8, 3); // Direita frontal

// ✨ Texto NANdART com dourado vivo
const fontLoader = new FontLoader();
fontLoader.load(
'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/fonts/helvetiker_regular.typeface.json',
font => {
const textGeo = new TextGeometry('NANdART', {
font,
size: config.textSize + 0.1,
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
    color: 0xc49b42,
    metalness: 1,
    roughness: 0.25,
    emissive: 0x2c1d07,
    emissiveIntensity: 0.45
  })
);

texto.position.set(-largura / 2, 15.5, -config.wallDistance - 3.98);
texto.castShadow = true;
scene.add(texto);

// Luz direcional focada no texto
const luzTexto = new THREE.SpotLight(0xfff1cc, 1.3, 12, Math.PI / 9, 0.4);
luzTexto.position.set(0, 18, -config.wallDistance - 2);
luzTexto.target = texto;
scene.add(luzTexto);
scene.add(luzTexto.target);
}
);

// ✨ Reflexos animados subtis — frisos, molduras e gemas
scene.traverse(obj => {
// Frisos dourados com brilho pulsante
if (
obj.isMesh &&
obj.material &&
obj.material.emissive &&
obj.material.emissiveIntensity &&
obj.material.color?.getHex() === 0xf3cc80
) {
gsap.to(obj.material, {
emissiveIntensity: 0.65,
duration: 6,
repeat: -1,
yoyo: true,
ease: 'sine.inOut'
});
}

// Molduras escuras com brilho suave
if (
obj.isMesh &&
obj.material?.emissive &&
obj.material?.color?.getHex() === 0x1e1a16
) {
gsap.to(obj.material, {
emissiveIntensity: 0.25,
duration: 4,
repeat: -1,
yoyo: true,
ease: 'sine.inOut'
});
}

// Gemas com emissão pulsante intensa
if (
obj.isMesh &&
obj.material?.emissive &&
obj.geometry?.type === 'IcosahedronGeometry'
) {
gsap.to(obj.material, {
emissiveIntensity: 2.8,
duration: 5,
repeat: -1,
yoyo: true,
ease: 'sine.inOut'
});
}
});

// 🖼️ Obras circulantes suspensas
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

// Dados reais das obras para o modal
const dadosObras = [
{
titulo: "Fragmento da Eternidade",
artista: "Inês Duarte",
ano: "2023",
preco: "0.8",
descricao: "Uma exploração das dimensões temporais através de texturas sobrepostas.",
imagem: "/assets/obras/obra1.jpg"
},
{
titulo: "Sombras de Luz",
artista: "Miguel Costa",
ano: "2024",
preco: "0.5",
descricao: "Contraste entre luz e sombra em movimento constante.",
imagem: "/assets/obras/obra2.jpg"
},
{
titulo: "Horizonte Partilhado",
artista: "Clara Mendonça",
ano: "2022",
preco: "1.2",
descricao: "Perspectivas múltiplas de um mesmo horizonte urbano.",
imagem: "/assets/obras/obra3.jpg"
},
{
titulo: "Memórias de Silêncio",
artista: "Rui Valente",
ano: "2023",
preco: "0.6",
descricao: "Abstração das memórias que permanecem no silêncio.",
imagem: "/assets/obras/obra4.jpg"
},
{
titulo: "Ritmo Contido",
artista: "Joana Serra",
ano: "2025",
preco: "0.75",
descricao: "Movimento congelado em padrões geométricos precisos.",
imagem: "/assets/obras/obra5.jpg"
},
{
titulo: "Flutuação Interior",
artista: "André Luz",
ano: "2023",
preco: "1.0",
descricao: "Estados emocionais representados através de cores fluidas.",
imagem: "/assets/obras/obra6.jpg"
},
{
titulo: "Verso Encoberto",
artista: "Sofia Rocha",
ano: "2024",
preco: "0.4",
descricao: "Texturas que revelam camadas ocultas da percepção.",
imagem: "/assets/obras/obra7.jpg"
},
{
titulo: "Silhueta do Amanhã",
artista: "Tiago Faria",
ano: "2025",
preco: "0.9",
descricao: "Visão futurista de formas orgânicas em evolução.",
imagem: "/assets/obras/obra8.jpg"
}
];

const obrasNormais = [];
let animationSpeed = -0.00012;
let originalAnimationSpeed = -0.00012;

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

obra.userData.originalPosition = new THREE.Vector3(x, 4.2, z);
obra.userData.originalRotation = new THREE.Euler(0, ry, 0);

obrasNormais.push(obra);
});

// Variáveis globais para controle do destaque
let obraSelecionada = null;
let isHighlighted = false;
const modal = document.querySelector('.art-modal');
const modalTitulo = document.getElementById('art-title');
const modalDescricao = document.getElementById('art-description');
const modalArtista = document.getElementById('art-artist');
const modalAno = document.getElementById('art-year');
const modalPreco = document.getElementById('art-price');
const botaoComprar = document.getElementById('buy-art');
const blurOverlay = document.getElementById('blur-overlay');

// Função para destacar a obra selecionada
function destacarObra(obra, dados) {
if (isHighlighted) return;
isHighlighted = true;
obraSelecionada = obra;

// Aplicar propriedades para garantir visibilidade
obra.renderOrder = 999;
obra.material.depthTest = false;
obra.material.depthWrite = false;

// Posição final desejada
const targetY = 6.3;
const targetZ = -config.wallDistance / 2;

// Duplicar o tamanho da obra
obra.scale.set(2, 2, 2);

// Animação para mover a obra para frente
gsap.to(obra.position, {
x: 0,
y: targetY,
z: targetZ,
duration: 0.8,
ease: 'power2.out',
onComplete: () => {
gsap.to(obra.rotation, {
y: 0,
duration: 0.5,
ease: 'power2.out',
onComplete: mostrarModal
});
}
});

// Ativar blur overlay
blurOverlay.classList.add('active');

function mostrarModal() {
// Preencher informações do modal
modalTitulo.textContent = dados.titulo;
modalDescricao.textContent = dados.descricao;
modalArtista.textContent = dados.artista;
modalAno.textContent = dados.ano;
modalPreco.textContent = ${dados.preco} ETH;

// Converter posição 3D para coordenadas de tela
const vector = new THREE.Vector3();
vector.setFromMatrixPosition(obra.matrixWorld);
vector.project(camera);

const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

// Posicionar modal 2cm abaixo da obra (aproximadamente 40px)
modal.style.left = `${x - modal.offsetWidth / 2}px`;
modal.style.top = `${y + 40}px`;

// Mostrar modal
modal.style.display = 'flex';
}
}

// Função para restaurar obra ao círculo
function restaurarObra() {
if (!isHighlighted) return;
isHighlighted = false;

// Esconder modal
modal.style.display = 'none';

// Restaurar propriedades de renderização
obraSelecionada.renderOrder = 0;
obraSelecionada.material.depthTest = true;
obraSelecionada.material.depthWrite = true;

// Restaurar tamanho original
obraSelecionada.scale.set(1, 1, 1);

// Restaurar posição e rotação originais
gsap.to(obraSelecionada.position, {
x: obraSelecionada.userData.originalPosition.x,
y: obraSelecionada.userData.originalPosition.y,
z: obraSelecionada.userData.originalPosition.z,
duration: 0.8,
ease: 'power2.out'
});

gsap.to(obraSelecionada.rotation, {
y: obraSelecionada.userData.originalRotation.y,
duration: 0.8,
ease: 'power2.out'
});

// Desativar blur overlay
blurOverlay.classList.remove('active');
}

// Detectar clique nas obras
renderer.domElement.addEventListener('pointerdown', (e) => {
if (isHighlighted) {
// Verificar se clique foi fora do modal
if (!modal.contains(e.target)) {
restaurarObra();
}
return;
}

const mouse = new THREE.Vector2(
(e.clientX / window.innerWidth) * 2 - 1,
-(e.clientY / window.innerHeight) * 2 + 1
);

const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(mouse, camera);

const intersects = raycaster.intersectObjects(obrasNormais);
if (intersects.length > 0) {
const obra = intersects[0].object;
const index = obrasNormais.indexOf(obra);
const dados = dadosObras[index];
destacarObra(obra, dados);
}
});

// Modificar a animação para reduzir velocidade quando obra está destacada
function animate() {
requestAnimationFrame(animate);

const tempo = Date.now() * (isHighlighted ? -0.00006 : -0.00012);

obrasNormais.forEach((obra, i) => {
if (obra === obraSelecionada) return;

const angulo = tempo + (i / obrasNormais.length) * Math.PI * 2;
const x = Math.cos(angulo) * config.circleRadius;
const z = Math.sin(angulo) * config.circleRadius;
const rotacaoY = -angulo + Math.PI;

obra.position.x = x;
obra.position.z = z;
obra.rotation
});

renderer.render(scene, camera);
}

// Função para conectar/desconectar carteira
async function toggleWalletConnection() {
if (!window.ethereum) {
alert('Por favor instale a MetaMask para conectar sua carteira.');
return;
}

try {
if (walletButton.classList.contains('connected')) {
// Desconectar
walletButton.classList.remove('connected');
walletButton.innerHTML = 'Connect Wallet';
walletButton.style.padding = '10px 18px 10px 42px';
} else {
// Conectar
const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
const provider = new ethers.BrowserProvider(window.ethereum);
const balance = await provider.getBalance(accounts[0]);
const formattedBalance = ethers.formatEther(balance);
const shortBalance = parseFloat(formattedBalance).toFixed(3);

  walletButton.classList.add('connected');
  walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
  walletButton.style.padding = '10px 18px 10px 16px';
}
} catch (err) {
console.error('Erro ao conectar carteira:', err);
alert('Ocorreu um erro ao conectar sua carteira. Por favor tente novamente.');
}
}

// Função real de compra com ethers.js e MetaMask
async function buyHandler(dados) {
if (!window.ethereum) {
alert('Instala a MetaMask para poder adquirir esta obra.');
return;
}

try {
// Solicitar autorização à carteira do utilizador
await window.ethereum.request({ method: 'eth_requestAccounts' });

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Converter o preço para wei
const valorETH = ethers.parseEther(dados.preco);

// Enviar transação para o endereço da galeria
const tx = await signer.sendTransaction({
  to: '0x913b3984583Ac44dE06Ef480a8Ac925DEA378b41',
  value: valorETH
});

alert(`Transação enviada!\nHash: ${tx.hash}`);

// Aguardar confirmação da transação
await tx.wait();
alert('Compra confirmada! Muito obrigado por adquirir esta obra.');
} catch (err) {
console.error('Erro ao comprar a obra:', err);
alert('Ocorreu um erro durante a compra. Por favor tenta novamente.');
}
}

// Event listeners
if (botaoComprar) {
botaoComprar.addEventListener('click', () => {
if (obraSelecionada) {
const index = obrasNormais.indexOf(obraSelecionada);
const dados = dadosObras[index];
buyHandler(dados);
}
});
}

if (walletButton) {
walletButton.addEventListener('click', toggleWalletConnection);
}

// Verificar se já está conectado ao carregar a página
window.addEventListener('load', async () => {
if (window.ethereum) {
const provider = new ethers.BrowserProvider(window.ethereum);
const accounts = await provider.listAccounts();

if (accounts.length > 0) {
  const balance = await provider.getBalance(accounts[0].address);
  const formattedBalance = ethers.formatEther(balance);
  const shortBalance = parseFloat(formattedBalance).toFixed(3);

  walletButton.classList.add('connected');
  walletButton.innerHTML = `Connected <span id="wallet-balance">${shortBalance} ETH</span>`;
  walletButton.style.padding = '10px 18px 10px 16px';
}
}
});

// Iniciar a animação contínua da cena
animate();
