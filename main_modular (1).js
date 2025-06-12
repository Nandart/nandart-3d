
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ethers } from './ethers.min.js';
import NandartNFT_ABI from './abi/NandartNFT_ABI.json' assert { type: "json" };

// Conteúdo restante será adicionado depois da estrutura de imports

// Inicialização da cena futurista com paredes escuras, piso reflexivo e quadros flutuantes

let scene, camera, renderer;
let premiumCircle;
const artworksSuspensas = [];

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.5, 7);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Piso com reflexo
    const floorTexture = new THREE.TextureLoader().load('/textures/glass_reflection.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.1,
        metalness: 0.6
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Luz de teto única
    RectAreaLightUniformsLib.init();
    const ceilingLight = new THREE.RectAreaLight(0xffffff, 10, 6, 0.3);
    ceilingLight.position.set(0, 5, 0);
    ceilingLight.rotation.x = -Math.PI / 2;
    scene.add(ceilingLight);

    // Paredes laterais escuras
    const wallTexture = new THREE.TextureLoader().load('/textures/dark_wall.jpg');
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMaterial);
    leftWall.position.set(-5, 2.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMaterial);
    rightWall.position.set(5, 2.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMaterial);
    backWall.position.set(0, 2.5, -5);
    scene.add(backWall);

    // Quadros flutuantes laterais
    const textureLoader = new THREE.TextureLoader();
    const emissiveColor = new THREE.Color(0x00aaff);

    for (let i = 0; i < 4; i++) {
        const texture = textureLoader.load(`/textures/obra${i + 1}.jpg`);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: emissiveColor,
            emissiveIntensity: 0.3
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), material);
        mesh.position.y = 2.5;

        if (i < 2) {
            mesh.position.x = -4.9;
            mesh.rotation.y = Math.PI / 2;
            mesh.position.z = i * 2 - 1.5;
        } else {
            mesh.position.x = 4.9;
            mesh.rotation.y = -Math.PI / 2;
            mesh.position.z = (i - 2) * 2 - 1.5;
        }

        scene.add(mesh);
    }

    // Circulo premium invisível no centro
    premiumCircle = document.createElement('div');
    premiumCircle.id = 'premium-circle';
    document.body.appendChild(premiumCircle);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
