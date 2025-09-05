import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// Default configuration
const DEFAULT_CONFIG = {
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
  selfieMode: true,
  flipHorizontal: true,
  width: 1280,
  height: 720,
  fps: 30,
  facingMode: 'user',
};

// Check for device compatibility
function checkCompatibility() {
  const isSecure = window.isSecureContext;
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch {
      return false;
    }
  })();

  return {
    isCompatible: isSecure && hasGetUserMedia && hasWebGL,
    details: {
      isSecure,
      hasGetUserMedia,
      hasWebGL,
    },
  };
}

// Get optimal camera constraints
function getCameraConstraints(config) {
  return {
    audio: false,
    video: {
      facingMode: config.facingMode,
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { ideal: config.fps },
    },
  };
}

export async function setupHandTracking(videoElement, onResults, userConfig = {}) {
  // Check device compatibility
  const compatibility = checkCompatibility();
  if (!compatibility.isCompatible) {
    throw new Error(`Device not compatible: ${JSON.stringify(compatibility.details)}`);
  }

  // Merge user config with defaults
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  
  // Initialize hands
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  // Set hand tracking options
  hands.setOptions({
    maxNumHands: config.maxNumHands,
    modelComplexity: config.modelComplexity,
    minDetectionConfidence: config.minDetectionConfidence,
    minTrackingConfidence: config.minTrackingConfidence,
    selfieMode: true,  // Always use selfie mode for front camera
    flipHorizontal: true,  // Flip the coordinates horizontally for natural movement
  });
  
  // Mirror the video element for selfie view
  videoElement.style.transform = 'scaleX(-1)';

  // Set up results handler with error handling
  const resultsHandler = (results) => {
    try {
      onResults(results);
    } catch (error) {
      console.error('Error in hand tracking results handler:', error);
    }
  };
  
  hands.onResults(resultsHandler);

  // Initialize camera
  let camera;
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      getCameraConstraints(config)
    );
    
    // Set video element properties
    videoElement.srcObject = stream;
    videoElement.playsInline = true;
    videoElement.muted = true;
    videoElement.setAttribute('playsinline', ''); // For iOS
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.width = videoElement.videoWidth;
        videoElement.height = videoElement.videoHeight;
        resolve();
      };
    });

    // Set up camera
    camera = new Camera(videoElement, {
      onFrame: async () => {
        try {
          if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
            await hands.send({ image: videoElement });
          }
        } catch (error) {
          console.error('Error processing frame:', error);
        }
      },
      width: config.width,
      height: config.height,
    });

    await camera.start();
  } catch (error) {
    console.error('Error initializing camera:', error);
    throw new Error(`Failed to initialize camera: ${error.message}`);
  }

  // Cleanup function
  const cleanup = async () => {
    try {
      if (camera) {
        await camera.stop();
      }
      if (videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
      }
      if (hands) {
        hands.close();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (document.hidden) {
      camera?.stop();
    } else {
      camera?.start();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return {
    hands,
    camera,
    cleanup: async () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      await cleanup();
    },
  };
}
