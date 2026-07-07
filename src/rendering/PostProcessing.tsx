import { EffectComposer, Bloom, SSAO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { useGameStore } from '../store/useGameStore';
import * as THREE from 'three';

export const PostProcessing = () => {
  const { graphics } = useGameStore();

  if (graphics.quality === 'low') return null;

  return (
    <EffectComposer enableNormalPass={false} multisampling={graphics.quality === 'ultra' ? 8 : 4}>
      <SSAO 
        radius={graphics.quality === 'ultra' ? 10 : 5} 
        intensity={graphics.ssao ? 15 : 0} 
        luminanceInfluence={0.9} 
        color={new THREE.Color('black')} 
      />
      <Bloom 
        luminanceThreshold={0.5} 
        mipmapBlur 
        intensity={graphics.bloom ? 1.5 : 0} 
        radius={0.8}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
      <ToneMapping 
        adaptive 
        resolution={256} 
        middleGrey={0.6} 
        maxLuminance={16.0} 
        averageLuminance={1.0} 
        adaptationRate={1.0} 
      />
    </EffectComposer>
  );
};
