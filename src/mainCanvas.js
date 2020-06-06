import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

let scene;
let camera;
let controls;
let renderer;
let clock = new THREE.Clock();
const loader = new GLTFLoader();
let gltfObjs = [];

var prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

const initThreeCanvas = () => {
  const loadGltf = (filePath) => {
    loader.load(filePath, (gltf) => {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      gltfObjs.push({ gltf, mixer });
      gltf.scene.scale.set(1, 1, 1);
      scene.add(gltf.scene);
    });
  };

  const resizeCanvasToDisplaySize = () => {
    const canvas = renderer.domElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };

  const initScene = () => {
    scene = new THREE.Scene();
    let pmremGenerator = new THREE.PMREMGenerator(renderer);

    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .load("img/royal_esplanade_1k.hdr", (hdrEquirect) => {
        let hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(
          hdrEquirect
        );
        hdrEquirect.dispose();
        pmremGenerator.dispose();

        scene.background = hdrCubeRenderTarget.texture;
        scene.environment = hdrCubeRenderTarget.texture;
      });

    pmremGenerator.compileEquirectangularShader();
  };

  const addLights = () => {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1, 100);
    directionalLight.position.set(0, 5, 10);
    scene.add(directionalLight);
    directionalLight.castShadow = true;
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.height = 256;
    directionalLight.shadow.mapSize.width = 256;
    directionalLight.shadow.camera = new THREE.OrthographicCamera(
      -6,
      6,
      6,
      -6,
      8,
      20
    );
    // const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(cameraHelper);
  };

  const addCamera = () => {
    camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 0);
  };

  const addControls = () => {
    controls = new PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    const onKeyDown = function (event) {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          moveForward = true;
          break;
        case 37: // left
        case 65: // a
          moveLeft = true;
          break;
        case 40: // down
        case 83: // s
          moveBackward = true;
          break;
        case 39: // right
        case 68: // d
          moveRight = true;
          break;
      }
    };

    const onKeyUp = function (event) {
      switch (event.keyCode) {
        case 38: // up
        case 87: // w
          moveForward = false;
          break;
        case 37: // left
        case 65: // a
          moveLeft = false;
          break;
        case 40: // down
        case 83: // s
          moveBackward = false;
          break;
        case 39: // right
        case 68: // d
          moveRight = false;
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

    const blocker = document.getElementById("blocker");
    blocker.addEventListener(
      "click",
      () => {
        controls.lock();
      },
      false
    );

    controls.addEventListener("lock", () => {
      blocker.style.display = "none";
    });

    controls.addEventListener("unlock", () => {
      blocker.style.display = "block";
    });
  };
  const initAndAttachCanvas = () => {
    const selfHtmlNode = document.getElementById("mainCanvas");
    renderer = new THREE.WebGLRenderer({ antialias: true });
    selfHtmlNode.appendChild(renderer.domElement);
    renderer.setSize(selfHtmlNode.clientWidth, selfHtmlNode.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    window.addEventListener("resize", () => {
      resizeCanvasToDisplaySize();
    });
  };

  initAndAttachCanvas();
  initScene();
  addCamera();
  addControls();
  addLights();
  loadGltf("resources/gallery01.glb");
  resizeCanvasToDisplaySize();

  const animate = () => {
    gltfObjs.forEach((obj) => {
      obj.mixer.update(clock.getDelta());
    });

    var time = performance.now();
    var delta = (time - prevTime) / 1000;

    const velFactor = 10.0;
    velocity.x -= velocity.x * velFactor * delta;
    velocity.z -= velocity.z * velFactor * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 10.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 10.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    prevTime = time;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
};

export default initThreeCanvas;
