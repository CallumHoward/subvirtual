"use strict";

import * as THREE from "three";
import { PointerLockControls } from "./PointerLockControls";

export const FpControls = (camera, body, blocker) => {
  const controls = new PointerLockControls(camera, body);
  let prevTime = performance.now();
  const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const collidableObjects = [];
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(),
    new THREE.Vector3(0, 0, -1),
    0,
    10
  );

  const size = 1.2;
  const cubeGeometry = new THREE.CubeGeometry(size, size, size, 2, 2, 2);
  const transparentMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    opacity: 0.5,
    transparent: true,
  });
  const boundingBox = new THREE.Mesh(cubeGeometry, transparentMaterial);

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

  const addCollidable = (object) => {
    if (object) {
      collidableObjects.push(object);
    }
    console.log("LOG collidableObjects: ", collidableObjects);
  };

  const colliding = () => {
    boundingBox.position.copy(controls.getObject().position);
    boundingBox.rotation.copy(controls.getObject().rotation);
    const originPoint = boundingBox.position.clone();

    for (let i = 0; i < boundingBox.geometry.vertices.length; i++) {
      const localVertex = boundingBox.geometry.vertices[i].clone();
      const globalVertex = localVertex.applyMatrix4(boundingBox.matrix);
      const directionVector = globalVertex.sub(boundingBox.position);

      const raycaster = new THREE.Raycaster(
        originPoint,
        directionVector.clone().normalize()
      );

      const intersections = raycaster.intersectObjects(collidableObjects);
      if (
        intersections.length > 0 &&
        intersections[0].distance < directionVector.length()
      ) {
        return true;
      }
    }
    return false;
  };

  let updateCount = 0;

  const update = () => {
    if (controls.isLocked) {
      const time = performance.now();
      const delta = (time - prevTime) / 1000;
      updateCount++;

      // Movement
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

      if (colliding()) {
        controls.moveRight(velocity.x * delta * 2.1);
        controls.moveForward(velocity.z * delta * 2.1);
      }

      prevTime = time;
    }
  };

  return {
    update,
    getObject: controls.getObject,
    addCollidable,
    getBoundingBox: () => boundingBox,
  };
};
