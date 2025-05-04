import * as THREE from 'three'
import { gsap } from 'gsap'

// Cena
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x111111)

// Câmara fixa
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50)
camera.position.set(0, 2, 6)

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)

// Painéis de ajuda
const imagensAjuda = [
  '/assets/ajuda/ajuda-rotacao.jpg',
  '/assets/ajuda/ajuda-modal.jpg',
  '/assets/ajuda/ajuda-cubo.jpg',
  '/assets/ajuda/ajuda-premium.jpg'
]

const largura = 2.5
const altura = 1.8
const raio = 3
const centroY = 2

const painéis = []

imagensAjuda.forEach((src, i) => {
  const tex = new THREE.TextureLoader().load(src)
  const mat = new THREE.MeshBasicMaterial({ map: tex })
  const geo = new THREE.PlaneGeometry(largura, altura)
  const painel = new THREE.Mesh(geo, mat)

  const angulo = (i - (imagensAjuda.length - 1) / 2) * 0.3
  painel.position.set(Math.sin(angulo) * raio, centroY, Math.cos(angulo) * raio - 2)
  painel.rotation.y = angulo
  painel.scale.set(0, 0, 0)

  scene.add(painel)
  painéis.push(painel)
})

// Animação de entrada
painéis.forEach((p, i) => {
  gsap.to(p.scale, {
    x: 1,
    y: 1,
    z: 1,
    duration: 1,
    delay: 0.2 + i * 0.2,
    ease: 'power2.out'
  })
})

// Responsividade
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Loop de renderização
function render() {
  requestAnimationFrame(render)
  renderer.render(scene, camera)
}
render()
