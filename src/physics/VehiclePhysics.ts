import * as THREE from 'three';

export interface VehicleState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number; // Y-axis rotation in radians
  speed: number;
  rpm: number;
  gear: number;
  steering: number;
  acceleration: number;
  braking: number;
  handbrake: boolean;
}

export class VehiclePhysics {
  state: VehicleState;
  maxSpeed = 60; // m/s (~216 km/h)
  accelerationForce = 30;
  brakingForce = 50;
  friction = 0.98;
  turnSpeed = 2.5;
  driftFactor = 0.95;

  constructor() {
    this.state = {
      position: new THREE.Vector3(0, 1, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: 0,
      speed: 0,
      rpm: 800,
      gear: 1,
      steering: 0,
      acceleration: 0,
      braking: 0,
      handbrake: false,
    };
  }

  update(dt: number, input: { forward: boolean; backward: boolean; left: boolean; right: boolean; brake: boolean; handbrake: boolean }) {
    // Acceleration / Braking
    if (input.forward) {
      this.state.acceleration = THREE.MathUtils.lerp(this.state.acceleration, 1, dt * 5);
    } else if (input.backward) {
      this.state.acceleration = THREE.MathUtils.lerp(this.state.acceleration, -0.5, dt * 5);
    } else {
      this.state.acceleration = THREE.MathUtils.lerp(this.state.acceleration, 0, dt * 5);
    }

    if (input.brake) {
      this.state.braking = THREE.MathUtils.lerp(this.state.braking, 1, dt * 10);
    } else {
      this.state.braking = THREE.MathUtils.lerp(this.state.braking, 0, dt * 5);
    }

    this.state.handbrake = input.handbrake;

    // Steering (Fixed: Right is positive, Left is negative)
    const targetSteering = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.state.steering = THREE.MathUtils.lerp(this.state.steering, targetSteering, dt * 5);

    // Physics calculations
    const forwardDir = new THREE.Vector3(Math.sin(this.state.rotation), 0, Math.cos(this.state.rotation));

    // Apply forces
    if (this.state.acceleration !== 0) {
      this.state.velocity.add(forwardDir.multiplyScalar(this.state.acceleration * this.accelerationForce * dt));
    }

    if (this.state.braking > 0) {
      this.state.velocity.multiplyScalar(1 - this.state.braking * this.brakingForce * dt * 0.1);
    }

    // Friction
    this.state.velocity.multiplyScalar(this.friction);

    // Handbrake / Drift
    if (this.state.handbrake) {
      this.state.velocity.x *= this.driftFactor;
      this.state.velocity.z *= this.driftFactor;
    }

    // Update rotation based on speed and steering
    const speed = this.state.velocity.length();
    this.state.speed = speed;
    
    if (speed > 0.1) {
      const turnMultiplier = Math.min(speed / 10, 1); // Turn slower at low speeds
      // Fixed rotation direction
      this.state.rotation += this.state.steering * this.turnSpeed * turnMultiplier * dt * (this.state.velocity.dot(forwardDir) > 0 ? 1 : -1);
    }

    // Update position
    this.state.position.add(this.state.velocity.clone().multiplyScalar(dt));

    // RPM and Gear simulation
    this.state.rpm = 800 + (speed / this.maxSpeed) * 7000;
    if (this.state.rpm > 7000) {
      this.state.gear = Math.min(this.state.gear + 1, 6);
      this.state.rpm = 4000;
    } else if (this.state.rpm < 2000 && this.state.gear > 1) {
      this.state.gear = Math.max(this.state.gear - 1, 1);
      this.state.rpm = 5000;
    }

    // Keep on ground (simple gravity)
    if (this.state.position.y > 1) {
      this.state.velocity.y -= 9.8 * dt;
    } else {
      this.state.position.y = 1;
      this.state.velocity.y = 0;
    }
  }
}
