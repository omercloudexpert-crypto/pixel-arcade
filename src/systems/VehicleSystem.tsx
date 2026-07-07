import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VehiclePhysics } from '../physics/VehiclePhysics';
import { useControls } from '../hooks/useControls';
import { useGameStore } from '../store/useGameStore';

export const VehicleSystem = () => {
  const meshRef = useRef<THREE.Group>(null);
  const physics = useRef(new VehiclePhysics());
  const { controls } = useControls();
  const { updatePlayer, player } = useGameStore();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Cap delta to prevent physics explosions on lag
    const dt = Math.min(delta, 0.1);

    physics.current.update(dt, {
      forward: controls.forward,
      backward: controls.backward,
      left: controls.left,
      right: controls.right,
      brake: controls.brake,
      handbrake: controls.handbrake,
    });

    const { position, rotation, speed } = physics.current.state;

    // Update mesh
    meshRef.current.position.copy(position);
    meshRef.current.rotation.y = rotation;

    // Update store for UI
    if (player.mode === 'driving') {
      updatePlayer({
        position: [position.x, position.y, position.z],
        rotation: rotation,
        speed: speed * 3.6, // Convert m/s to km/h
        rpm: physics.current.state.rpm,
        gear: physics.current.state.gear,
      });
    }

    // Camera follow logic
    const relativeCameraOffset = new THREE.Vector3(0, 5, -10);
    const cameraOffset = relativeCameraOffset.applyMatrix4(meshRef.current.matrixWorld);
    
    state.camera.position.lerp(cameraOffset, 0.1);
    state.camera.lookAt(position.x, position.y + 2, position.z);
  });

  return (
    <group ref={meshRef}>
      {/* Car Body (Cyberpunk Sports Car) */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.8, 4.5]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.9} />
      </mesh>
      
      {/* Car Top */}
      <mesh position={[0, 1.1, -0.2]} castShadow>
        <boxGeometry args={[1.8, 0.6, 2.5]} />
        <meshStandardMaterial color="#000" roughness={0.1} metalness={1} />
      </mesh>

      {/* Neon Underglow */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[2.2, 4.7]} />
        <meshBasicMaterial color="#ff00ff" toneMapped={false} transparent opacity={0.5} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.6, 0.6, 2.26]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.6, 0.6, 2.26]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>

      {/* Headlight Beams (Volumetric fake) */}
      <mesh position={[-0.6, 0.6, 4]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.5, 4, 32, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0.6, 0.6, 4]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.5, 4, 32, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.6, 0.6, -2.26]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color={controls.brake ? '#ff0000' : '#550000'} toneMapped={false} />
      </mesh>
      <mesh position={[0.6, 0.6, -2.26]}>
        <boxGeometry args={[0.4, 0.2, 0.1]} />
        <meshBasicMaterial color={controls.brake ? '#ff0000' : '#550000'} toneMapped={false} />
      </mesh>

      {/* Wheels */}
      {[[-1.1, 0.3, 1.5], [1.1, 0.3, 1.5], [-1.1, 0.3, -1.5], [1.1, 0.3, -1.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#222" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};
