import * as THREE from "three";
import { PointerLockControls } from "./PointerLockControls";

export const FpControls = (camera, body, blocker) => {
  let controls = new PointerLockControls(camera, body);
  var prevTime = performance.now();
  let velocity = new THREE.Vector3();
  let direction = new THREE.Vector3();

  let moveForward = false;
  let moveBackward = false;
  let moveLeft = false;
  let moveRight = false;

  // set up keyboard controls
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

  // Pointer locking
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

  const update = () => {
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
  };

  return { update, getObject: controls.getObject };
};
