import { useEffect, useState } from 'react';

interface Controls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  enterVehicle: boolean;
  brake: boolean;
  handbrake: boolean;
}

export const useControls = () => {
  const [controls, setControls] = useState<Controls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    enterVehicle: false,
    brake: false,
    handbrake: false,
  });

  const [touchControls, setTouchControls] = useState({
    joystick: { x: 0, y: 0, active: false },
    buttons: { accelerate: false, brake: false, handbrake: false, jump: false }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setControls(c => ({ ...c, forward: true })); break;
        case 'KeyS': case 'ArrowDown': setControls(c => ({ ...c, backward: true })); break;
        case 'KeyA': case 'ArrowLeft': setControls(c => ({ ...c, left: true })); break;
        case 'KeyD': case 'ArrowRight': setControls(c => ({ ...c, right: true })); break;
        case 'Space': setControls(c => ({ ...c, jump: true })); break;
        case 'ShiftLeft': setControls(c => ({ ...c, sprint: true })); break;
        case 'KeyE': setControls(c => ({ ...c, enterVehicle: true })); break;
        case 'KeyB': setControls(c => ({ ...c, brake: true })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': setControls(c => ({ ...c, forward: false })); break;
        case 'KeyS': case 'ArrowDown': setControls(c => ({ ...c, backward: false })); break;
        case 'KeyA': case 'ArrowLeft': setControls(c => ({ ...c, left: false })); break;
        case 'KeyD': case 'ArrowRight': setControls(c => ({ ...c, right: false })); break;
        case 'Space': setControls(c => ({ ...c, jump: false, handbrake: false })); break;
        case 'ShiftLeft': setControls(c => ({ ...c, sprint: false })); break;
        case 'KeyE': setControls(c => ({ ...c, enterVehicle: false })); break;
        case 'KeyB': setControls(c => ({ ...c, brake: false })); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { controls, touchControls, setTouchControls };
};
