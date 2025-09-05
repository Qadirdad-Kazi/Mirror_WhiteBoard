import React, { useRef, useEffect } from 'react';

const WebcamFeed = ({ onVideoReady }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (onVideoReady) onVideoReady(videoRef.current);
        }
      } catch (err) {
        console.error('Webcam error:', err);
      }
    };
    startWebcam();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="fixed inset-0 w-full h-full object-cover -z-10"
      style={{ background: '#000', transform: 'scaleX(-1)' }}
    />
  );
};

export default WebcamFeed;
