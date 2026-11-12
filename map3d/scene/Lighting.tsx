// Scene lighting: procedural room environment for reflections, warm key light with soft
// shadows, cool fill and a hemisphere ambient. RoomEnvironment needs no HDR download.
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function Lighting() {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.45;
    room.dispose();
    pmrem.dispose();
    return () => { scene.environment = null; env.dispose(); };
  }, [gl, scene]);

  return (
    <>
      <hemisphereLight args={['#fff1dc', '#3a2618', 0.7]} />
      <directionalLight
        position={[7, 13, 9]}
        intensity={2.2}
        color="#ffd7a8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.5} color="#9fc4ff" />
      <pointLight position={[0, 2.4, 0.3]} intensity={6} distance={9} decay={2} color="#ffb870" />
    </>
  );
}
