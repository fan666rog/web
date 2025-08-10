import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Basic Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.enableZoom = false;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Rubik's Cube ---
const rubiksCube = new THREE.Group();
const CUBIE_SIZE = 1;
const CUBIE_GAP = 0.1;
const CUBE_DIMENSION = 3;

const materials = {
    right: new THREE.MeshStandardMaterial({ color: 0xff0000 }),  // Red (+X)
    left: new THREE.MeshStandardMaterial({ color: 0xffa500 }),   // Orange (-X)
    top: new THREE.MeshStandardMaterial({ color: 0xffffff }),    // White (+Y)
    bottom: new THREE.MeshStandardMaterial({ color: 0xffff00 }), // Yellow (-Y)
    front: new THREE.MeshStandardMaterial({ color: 0x0000ff }),  // Blue (+Z)
    back: new THREE.MeshStandardMaterial({ color: 0x008000 }),   // Green (-Z)
    inside: new THREE.MeshStandardMaterial({ color: 0x111111 })
};

const positionOffset = CUBIE_SIZE + CUBIE_GAP;
for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
            if (x === 0 && y === 0 && z === 0) continue;
            const cubieGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
            const cubieMaterials = [
                x === 1 ? materials.right : materials.inside,
                x === -1 ? materials.left : materials.inside,
                y === 1 ? materials.top : materials.inside,
                y === -1 ? materials.bottom : materials.inside,
                z === 1 ? materials.front : materials.inside,
                z === -1 ? materials.back : materials.inside
            ];
            const cubie = new THREE.Mesh(cubieGeometry, cubieMaterials);
            cubie.position.set(x * positionOffset, y * positionOffset, z * positionOffset);
            rubiksCube.add(cubie);
        }
    }
}
scene.add(rubiksCube);

// --- Rotation Logic ---
let isAnimating = false; // Flag to prevent multiple rotations at once
const pivot = new THREE.Group();
scene.add(pivot);

function rotateSlice(axis, layer, direction = 1) {
    if (isAnimating) return; // Don't allow new rotation if one is in progress
    isAnimating = true;

    pivot.rotation.set(0, 0, 0);
    pivot.updateMatrixWorld();

    const cubiesToRotate = [];
    rubiksCube.children.forEach(cubie => {
        // Use a small tolerance to account for floating point inaccuracies
        if (Math.abs(cubie.position[axis] - layer * positionOffset) < 0.1) {
            cubiesToRotate.push(cubie);
        }
    });

    cubiesToRotate.forEach(cubie => {
        // THREE.Group.attach (instead of .add) preserves the world position
        pivot.attach(cubie);
    });
    
    // Animate the rotation
    const targetAngle = (Math.PI / 2) * direction;
    let currentAngle = 0;
    const animationDuration = 300; // in milliseconds
    let startTime = null;

    function animateRotation(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / animationDuration;

        if (progress < 1) {
            pivot.rotation[axis] = targetAngle * progress;
            requestAnimationFrame(animateRotation);
        } else {
            // --- Finalize Rotation ---
            pivot.rotation[axis] = targetAngle; // Ensure it's exactly at the target angle
            pivot.updateMatrixWorld(); // Update the pivot's matrix

            // Detach cubies and re-add to the main cube group
            while(pivot.children.length > 0) {
                const cubie = pivot.children[0];
                // Get the cubie's new world position and rotation
                cubie.getWorldPosition(cubie.position);
                cubie.getWorldQuaternion(cubie.quaternion);
                
                // Snap position to nearest integer value to fix floating point errors
                cubie.position.x = Math.round(cubie.position.x / positionOffset) * positionOffset;
                cubie.position.y = Math.round(cubie.position.y / positionOffset) * positionOffset;
                cubie.position.z = Math.round(cubie.position.z / positionOffset) * positionOffset;

                rubiksCube.add(cubie);
            }
            isAnimating = false;
        }
    }
    requestAnimationFrame(animateRotation);
}


// Setup button event listeners
function setupRotationControls() {
    // Standard cube notation uses clockwise for the face you're looking at.
    // Three.js right-hand rule means positive rotation is counter-clockwise around an axis.
    // So for some faces, we need to invert the direction.
    document.getElementById('rotate-u').addEventListener('click', () => rotateSlice('y', 1, 1));
    document.getElementById('rotate-u-prime').addEventListener('click', () => rotateSlice('y', 1, -1));
    
    document.getElementById('rotate-d').addEventListener('click', () => rotateSlice('y', -1, -1));
    document.getElementById('rotate-d-prime').addEventListener('click', () => rotateSlice('y', -1, 1));

    document.getElementById('rotate-r').addEventListener('click', () => rotateSlice('x', 1, 1));
    document.getElementById('rotate-r-prime').addEventListener('click', () => rotateSlice('x', 1, -1));

    document.getElementById('rotate-l').addEventListener('click', () => rotateSlice('x', -1, -1));
    document.getElementById('rotate-l-prime').addEventListener('click', () => rotateSlice('x', -1, 1));
    
    document.getElementById('rotate-f').addEventListener('click', () => rotateSlice('z', 1, 1));
    document.getElementById('rotate-f-prime').addEventListener('click', () => rotateSlice('z', 1, -1));

    document.getElementById('rotate-b').addEventListener('click', () => rotateSlice('z', -1, -1));
    document.getElementById('rotate-b-prime').addEventListener('click', () => rotateSlice('z', -1, 1));
}


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Start ---
setupRotationControls();
animate();
