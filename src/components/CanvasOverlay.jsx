import React from 'react';

const CanvasOverlay = React.forwardRef(({ width, height }, ref) => (
  <canvas
    ref={ref}
    width={width}
    height={height}
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ zIndex: 10 }}
  />
));

export default CanvasOverlay;
