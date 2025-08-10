import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Basic Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222); // Dark grey background

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6); // Move camera to a better viewing angle

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotate are enabled
controls.dampingFactor = 0.05;
controls.enableZoom = false; // Disable zooming
controls.enablePan = false; // Disable panning

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Rubik's Cube ---
const rubiksCube = new THREE.Group();
const CUBIE_SIZE = 1;
const CUBIE_GAP = 0.1; // Gap between cubies
const CUBE_DIMENSION = 3; // 3x3x3 cube

// Materials for the faces
const materials = {
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }),  // Red (+X)
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }),   // Orange (-X)
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }),    // White (+Y)
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }), // Yellow (-Y)
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }),  // Blue (+Z)
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }),   // Green (-Z)
    inside: new THREE.MeshStandardMaterial({ color: 0x111111 })  // Dark grey for inside faces
};

// Create and position the 27 cubies
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            // Don't create the center cubie as it's not visible
            if (x === 0 && y === 0 && z === 0) {
                continue;
            }

            const cubieGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);

            // Determine the material for each face of the cubie
            const cubieMaterials = [
                x === 1 ? materials.right : materials.inside,  // right
                x === -1 ? materials.left : materials.inside,   // left
                y === 1 ? materials.top : materials.inside,     // top
                y === -1 ? materials.bottom : materials.inside, // bottom
                z === 1 ? materials.front : materials.inside,   // front
                z === -1 ? materials.back : materials.inside    // back
            ];

            const cubie = new THREE.Mesh(cubieGeometry, cubieMaterials);
            
            // Calculate the position with a gap
            const positionOffset = CUBIE_SIZE + CUBIE_GAP;
            cubie.position.set(x * positionOffset, y * positionOffset, z * positionOffset);

            rubiksCube.add(cubie);
        }
    }
}

scene.add(rubiksCube);

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
