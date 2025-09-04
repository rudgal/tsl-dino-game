import { TREX_STATE } from './spriteTRex.ts';

// Jump physics constants (units per second)
const JUMP_PHYSICS = {
  INITIAL_JUMP_VELOCITY: 4.0,   // positive = upward (units/second)
  GRAVITY: -9.0,                // negative = downward acceleration (units/second²)
  DROP_VELOCITY: -1.5,          // negative = fast downward velocity (units/second)
  GROUND_Y: 0,                  // ground level
  MIN_JUMP_HEIGHT: 0.4,         // minimum height before can fast-fall
  MAX_JUMP_HEIGHT: 3.5            // maximum jump height
}

// T-Rex state
let jumping = false;
let ducking = false;
let jumpVelocity = 0;
let reachedMinHeight = false;
let speedDrop = false;
let jumpOffsetY = 0;

// Callbacks
let onStateChange: ((state: number) => void) | null = null;
let getCurrentState: (() => number) | null = null;
let onRestart: (() => void) | null = null;

export function initTRexControls(
  tRexStateChangeCallback: (state: number) => void,
  getCurrentTRexStateCallback?: () => number,
  restartGameCallback?: () => void
) {
  onStateChange = tRexStateChangeCallback;
  getCurrentState = getCurrentTRexStateCallback || null;
  onRestart = restartGameCallback || null;

  // Set up single consolidated event handlers
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    
    // Check current state
    const currentState = getCurrentState ? getCurrentState() : TREX_STATE.RUNNING;
    
    // If crashed, restart the game
    if (currentState === TREX_STATE.CRASHED) {
      if (onRestart) {
        // Reset T-Rex controls state before restarting game
        resetTRexControls();
        onRestart();
      }
      return;
    }
    
    // If waiting, transition to running (game start)
    if (currentState === TREX_STATE.WAITING) {
      if (onStateChange) {
        onStateChange(TREX_STATE.RUNNING);
      }
      // Don't jump on first press when starting the game
      return;
    }
    
    // Normal jump during gameplay
    startJump();
  } else if (e.code === 'ArrowDown') {
    if (jumping) {
      // Speed drop during jump
      setSpeedDrop();
    } else if (!jumping && !ducking) {
      // Duck when on ground
      setDuck(true);
    }
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    if (jumping) {
      endJump();
    }
  } else if (e.code === 'ArrowDown') {
    // Stop speed drop and ducking
    speedDrop = false;
    setDuck(false);
  }
}

export function startJump() {
  if (jumping) return;

  jumping = true;
  jumpVelocity = JUMP_PHYSICS.INITIAL_JUMP_VELOCITY;
  reachedMinHeight = false;
  speedDrop = false;

  if (onStateChange) {
    onStateChange(TREX_STATE.JUMPING);
  }
}

export function endJump() {
  // Allow fast-fall if minimum height reached
  if (reachedMinHeight && jumpVelocity > JUMP_PHYSICS.DROP_VELOCITY) {
    jumpVelocity = JUMP_PHYSICS.DROP_VELOCITY;
  }
}

export function setSpeedDrop() {
  speedDrop = true;
  jumpVelocity = -2.0; // Force downward (units/second)
}

export function setDuck(isDucking: boolean) {
  if (isDucking && !ducking) {
    ducking = true;
    if (onStateChange) {
      onStateChange(TREX_STATE.DUCKING);
    }
  } else if (!isDucking && ducking) {
    ducking = false;
    if (onStateChange) {
      onStateChange(TREX_STATE.RUNNING);
    }
  }
}

function resetTRexControls() {
  jumping = false;
  ducking = false;
  jumpVelocity = 0;
  reachedMinHeight = false;
  speedDrop = false;
  jumpOffsetY = 0;
}

export function controlsTRex(deltaTimeSeconds: number): number {
  if (!jumping) return jumpOffsetY;

  // Update position based on velocity (framerate independent)
  jumpOffsetY += jumpVelocity * deltaTimeSeconds;

  // Apply gravity (framerate independent)
  jumpVelocity += JUMP_PHYSICS.GRAVITY * deltaTimeSeconds;

  // Check if minimum height reached
  if (jumpOffsetY > JUMP_PHYSICS.MIN_JUMP_HEIGHT || speedDrop) {
    reachedMinHeight = true;
  }

  // Check if maximum height reached
  if (jumpOffsetY > JUMP_PHYSICS.MAX_JUMP_HEIGHT || speedDrop) {
    endJump();
  }

  // Landing - back to ground
  if (jumpOffsetY <= JUMP_PHYSICS.GROUND_Y) {
    jumpOffsetY = JUMP_PHYSICS.GROUND_Y;
    jumping = false;
    jumpVelocity = 0;
    reachedMinHeight = false;

    // Speed drop becomes duck when landing
    if (speedDrop) {
      speedDrop = false;
      setDuck(true);
    } else if (onStateChange) {
      onStateChange(TREX_STATE.RUNNING);
    }
  }

  // console.log(`Jump Y: ${jumpOffsetY.toFixed(2)}, Velocity: ${jumpVelocity.toFixed(2)}, Delta: ${deltaTimeSeconds.toFixed(3)}`);
  return jumpOffsetY;
}

