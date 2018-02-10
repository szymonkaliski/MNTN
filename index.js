const THREE = require("three");
const OrbitControls = require("three-orbitcontrols");

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;

// scene
const scene = new THREE.Scene();

// lights
const ambientLight = new THREE.AmbientLight(0x777777);
scene.add(ambientLight);

// mesh
const geometry = new THREE.PlaneGeometry(1, 1, 10, 10);
const material = new THREE.MeshStandardMaterial();
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.style.margin = 0;
document.body.appendChild(renderer.domElement);

// orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;
controls.enableZoom = true;

// loop
const loop = () => {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
};

loop();
