import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Environment } from '@react-three/drei';
import { useGameStore } from '../store/useGameStore';
import { WorldSystem } from '../systems/WorldSystem';
import { VehicleSystem } from '../systems/VehicleSystem';
import { PostProcessing } from '../rendering/PostProcessing';
import { MainMenu, HUD, PauseMenu, SettingsMenu } from '../ui/GameUI';

export default function CyberDrift({ onExit }: { onExit: () => void }) {
  const { screen } = useGameStore();

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 5, -10], fov: 60 }} dpr={[1, 2]}>
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          position={[50, 100, 50]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={500}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />
        
        {/* Environment */}
        <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Environment preset="city" />

        {/* World */}
        <WorldSystem />
        
        {/* Player / Vehicle */}
        {screen === 'playing' && <VehicleSystem />}

        {/* Post Processing */}
        <PostProcessing />
      </Canvas>

      {/* UI Overlays */}
      {screen === 'menu' && <MainMenu />}
      {screen === 'playing' && <HUD />}
      {screen === 'paused' && <PauseMenu />}
      {screen === 'settings' && <SettingsMenu />}

      {/* Exit Button (always visible in corner) */}
      <button 
        onClick={onExit}
        className="absolute top-4 right-4 z-[60] bg-red-600/80 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold backdrop-blur-md transition"
      >
        EXIT GAME
      </button>
    </div>
  );
}
