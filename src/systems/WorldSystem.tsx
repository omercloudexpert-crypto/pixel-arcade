import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Procedural City Generation
export const WorldSystem = () => {
  const buildingsRef = useRef<THREE.InstancedMesh>(null);

  const citySize = 20; // 20x20 blocks
  const blockSize = 20;
  const roadWidth = 8;

  const { buildingData, treeData } = useMemo(() => {
    const buildings: { position: [number, number, number]; scale: [number, number, number]; color: string }[] = [];
    const trees: { position: [number, number, number]; scale: [number, number, number] }[] = [];

    for (let x = -citySize; x <= citySize; x++) {
      for (let z = -citySize; z <= citySize; z++) {
        // Leave space for roads
        if (x % 2 === 0 || z % 2 === 0) continue;

        const posX = x * blockSize;
        const posZ = z * blockSize;

        // Building
        const height = 10 + Math.random() * 40;
        const width = blockSize - roadWidth - Math.random() * 4;
        const depth = blockSize - roadWidth - Math.random() * 4;
        
        buildings.push({
          position: [posX, height / 2, posZ],
          scale: [width, height, depth],
          color: Math.random() > 0.8 ? '#111' : `hsl(${200 + Math.random() * 60}, 20%, ${10 + Math.random() * 20}%)`
        });

        // Trees on sidewalks
        if (Math.random() > 0.7) {
          trees.push({
            position: [posX + width/2 + 2, 2, posZ],
            scale: [1, 1, 1]
          });
        }
      }
    }
    return { buildingData: buildings, treeData: trees };
  }, []);

  useFrame(() => {
    if (buildingsRef.current) {
      const dummy = new THREE.Object3D();
      buildingData.forEach((data, i) => {
        dummy.position.set(...data.position);
        dummy.scale.set(...data.scale);
        dummy.updateMatrix();
        buildingsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      buildingsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Ground / Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1a2f1a" roughness={0.8} />
      </mesh>

      {/* Roads */}
      <group>
        {Array.from({ length: citySize * 2 + 1 }).map((_, i) => {
          const pos = (i - citySize) * blockSize;
          return (
            <group key={i}>
              {/* X-axis roads */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, pos]} receiveShadow>
                <planeGeometry args={[1000, roadWidth]} />
                <meshStandardMaterial color="#222" roughness={0.5} />
              </mesh>
              {/* Z-axis roads */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[pos, 0.01, 0]} receiveShadow>
                <planeGeometry args={[roadWidth, 1000]} />
                <meshStandardMaterial color="#222" roughness={0.5} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Buildings (Instanced for performance) */}
      <instancedMesh ref={buildingsRef} args={[undefined, undefined, buildingData.length]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
      </instancedMesh>

      {/* Neon Lights on Buildings (Cyberpunk style) */}
      {buildingData.filter((_, i) => i % 5 === 0).map((data, i) => (
        <mesh key={`light-${i}`} position={[data.position[0], data.position[1] * 0.8, data.position[2] + data.scale[2]/2 + 0.1]}>
          <planeGeometry args={[data.scale[0] * 0.8, 2]} />
          <meshBasicMaterial color={Math.random() > 0.5 ? '#ff00ff' : '#00ffff'} toneMapped={false} />
        </mesh>
      ))}

      {/* Trees */}
      {treeData.map((data, i) => (
        <group key={`tree-${i}`} position={data.position}>
          <mesh position={[0, 2, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.4, 4]} />
            <meshStandardMaterial color="#4a3728" />
          </mesh>
          <mesh position={[0, 5, 0]} castShadow>
            <coneGeometry args={[2, 6, 8]} />
            <meshStandardMaterial color="#2d5a27" />
          </mesh>
        </group>
      ))}

      {/* Water / River */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 200]} receiveShadow>
        <planeGeometry args={[200, 1000]} />
        <meshStandardMaterial color="#0044ff" transparent opacity={0.8} roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
};
