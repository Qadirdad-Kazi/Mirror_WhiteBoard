import React, { useRef, useEffect, useState, useCallback } from 'react';

import WebcamFeed from '../components/WebcamFeed';
import CanvasOverlay from '../components/CanvasOverlay';
import Toolbar from '../components/Toolbar';
import jsPDF from 'jspdf';
import { distance, mapToCanvas } from '../utils/geometry';
import { setupHandTracking } from '../utils/handTracking';
import { getToolbarButtonRects } from '../utils/toolbar';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  // Removed unused lastPoint state
  const [paths, setPaths] = useState([]); // Array of { color, thickness, tool, points }
  const [color, setColor] = useState('#22d3ee');
  const [thickness, setThickness] = useState(4);
  const [tool, setTool] = useState('pen');
  const [mode, setMode] = useState('camera'); // 'camera' or 'mouse'
  const [undoStack, setUndoStack] = useState([]);
  // Removed unused redoStack state


  // Hand tracking state
  const [handLandmarks, setHandLandmarks] = useState(null);
  const [videoElement, setVideoElement] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);
  const toolbarRef = useRef(null);
  const lastGestureSelect = useRef({ tool: null, time: 0 });

  // Setup MediaPipe Hands
  // Memoize the callback to avoid infinite loops
  const handleResults = useCallback((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandLandmarks(results.multiHandLandmarks[0]);
    } else {
      setHandLandmarks(null);
    }
  }, []);

  useEffect(() => {
    if (!videoElement) return;
    const { hands, camera } = setupHandTracking(videoElement, handleResults);
    return () => {
      hands.close();
      camera.stop();
    };
    // Only run when videoElement is set
    // eslint-disable-next-line
  }, [videoElement, handleResults]);

  // Gesture-based drawing and toolbar logic
  useEffect(() => {
    if (!handLandmarks || !canvasRef.current || mode !== 'camera') return;
    
    // Get index and thumb tip landmarks
    const indexTip = handLandmarks[8];
    const thumbTip = handLandmarks[4];
    
    // Calculate distance between index and thumb
    const dist = distance([indexTip.x, indexTip.y], [thumbTip.x, thumbTip.y]);
    const drawMode = dist < 0.07; // Tune threshold as needed
    
    // Map coordinates to canvas space and invert x-coordinate for proper mirroring
    const [x, y] = mapToCanvas([1 - indexTip.x, indexTip.y], window.innerWidth, window.innerHeight);

    // Toolbar hover/select logic
    let hovered = null;
    const toolbarRects = getToolbarButtonRects(toolbarRef);
    for (const { key, rect } of toolbarRects) {
      if (
        x >= rect.left && x <= rect.right &&
        y >= rect.top && y <= rect.bottom
      ) {
        hovered = key;
        break;
      }
    }
    setHoveredTool(hovered);
    // If pinched and hovering, select tool (debounced)
    if (hovered && drawMode) {
      const now = Date.now();
      if (
        lastGestureSelect.current.tool !== hovered ||
        now - lastGestureSelect.current.time > 800
      ) {
        // Simulate click/select
        if (hovered === 'undo') handleUndo();
        else if (hovered === 'redo') handleRedo();
        else if (hovered === 'clear') handleClear();
        else if (hovered === 'save') handleSave();
        else if (hovered === 'mode') setMode(mode === 'camera' ? 'mouse' : 'camera');
        else setTool(hovered);
        lastGestureSelect.current = { tool: hovered, time: now };
      }
      return; // Don't draw while selecting tool
    }

    // Drawing logic
    if (hovered) return; // Don't draw if hovering toolbar
    if (drawMode) {
      setPaths((prev) => {
        let updated = [...prev];
        if (!drawing) {
          updated = [...updated, { color, thickness, tool, points: [[x, y]] }];
          setDrawing(true);
        } else {
          updated[updated.length - 1].points.push([x, y]);
        }
        return updated;
      });
    } else if (drawing) {
      setDrawing(false);
    }
  }, [handLandmarks, tool, color, thickness, mode]);

  // Drawing logic (mouse fallback for now)
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Enable image smoothing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    paths.forEach(({ color, thickness, tool, points }) => {
      if (tool === 'eraser') {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = thickness;
      } else if (tool === 'neon') {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness + 2;
      } else {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
      }
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    });
  }, [paths]);

  // Enhanced smoothing with weighted moving average and distance threshold
  const smoothPoints = (points, windowSize = 5) => {
    if (points.length <= 2) return points.slice();
    
    // Apply weighted moving average (more weight to center points)
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < points.length; i++) {
      let sumX = 0;
      let sumY = 0;
      let weightSum = 0;
      
      for (let j = -halfWindow; j <= halfWindow; j++) {
        const idx = Math.min(Math.max(0, i + j), points.length - 1);
        // Use triangular weighting (strongest weight at center)
        const weight = 1 - (Math.abs(j) / (halfWindow + 1));
        
        sumX += points[idx][0] * weight;
        sumY += points[idx][1] * weight;
        weightSum += weight;
      }
      
      smoothed.push([sumX / weightSum, sumY / weightSum]);
    }
    
    // Apply additional smoothing pass for better results
    if (smoothed.length > 2) {
      for (let i = 1; i < smoothed.length - 1; i++) {
        smoothed[i][0] = (smoothed[i-1][0] + smoothed[i][0] * 2 + smoothed[i+1][0]) / 4;
        smoothed[i][1] = (smoothed[i-1][1] + smoothed[i][1] * 2 + smoothed[i+1][1]) / 4;
      }
    }
    
    return smoothed;
  };
  
  // Minimum distance between points to reduce noise
  const MIN_DISTANCE = 2; // pixels

  // Handle pointer down (for both mouse and touch)
  const handlePointerDown = (e) => {
    if (mode === 'camera' || (e.pointerType === 'mouse' && e.button !== 0)) {
      return; // Skip for camera mode or non-left mouse button
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawing(true);
    // Start with a few initial points to help with smoothing
    setPaths((prev) => [...prev, { 
      color, 
      thickness, 
      tool, 
      points: [[x, y], [x, y], [x, y]] // Start with 3 identical points for better smoothing
    }]);
  };

  const handlePointerMove = (e) => {
    if (!drawing) return;
    
    // Only draw if left button is pressed (for mouse)
    if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) {
      setDrawing(false);
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setPaths((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const currentPath = updated[updated.length - 1];
      
      // Check minimum distance from last point
      if (currentPath.points.length > 0) {
        const [lastX, lastY] = currentPath.points[currentPath.points.length - 1];
        const dx = x - lastX;
        const dy = y - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Skip if the point is too close to the previous one
        if (distance < MIN_DISTANCE) return updated;
      }
      
      // Add the new point
      currentPath.points.push([x, y]);
      
      // Apply smoothing to the entire path for better results
      if (currentPath.points.length > 4) {
        const pointsToSmooth = currentPath.points;
        const smoothedPoints = smoothPoints(pointsToSmooth, Math.min(7, pointsToSmooth.length));
        
        // Keep the first and last points unchanged for better control
        if (smoothedPoints.length > 2) {
          smoothedPoints[0] = [...pointsToSmooth[0]];
          smoothedPoints[smoothedPoints.length - 1] = [...pointsToSmooth[pointsToSmooth.length - 1]];
        }
        
        // Replace all points with smoothed version
        currentPath.points = smoothedPoints;
      }
      
      return updated;
    });
  };

  const handlePointerUp = () => {
    setDrawing(false);
  };
  
  const handlePointerLeave = () => {
    setDrawing(false);
  };

  // Toolbar actions
  const handleUndo = () => {
    if (paths.length === 0) return;
    setUndoStack((prev) => [...prev, paths[paths.length - 1]]);
    setPaths((prev) => prev.slice(0, -1));
  };
  const handleRedo = () => {
    if (undoStack.length === 0) return;
    setPaths((prev) => [...prev, undoStack[undoStack.length - 1]]);
    setUndoStack((prev) => prev.slice(0, -1));
  };
  const handleClear = () => {
    setUndoStack([]);
    setPaths([]);
  };
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ask user for format
    const format = window.prompt('Save as PNG or PDF? Type "png" or "pdf"', 'png');
    if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('whiteboard.pdf');
    } else {
      const link = document.createElement('a');
      link.download = 'whiteboard.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        thickness={thickness}
        setThickness={setThickness}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSave={handleSave}
        mode={mode}
        setMode={setMode}
        hoveredTool={hoveredTool}
        toolbarRef={toolbarRef}
      />
      <WebcamFeed onVideoReady={setVideoElement} />
      <CanvasOverlay
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
      />
      <canvas
        className="absolute inset-0 w-full h-full z-10"
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />
      {/* Debug overlay for hand landmarks */}
      {handLandmarks && (
        <svg className="pointer-events-none absolute inset-0 w-full h-full z-50" width={window.innerWidth} height={window.innerHeight}>
          {handLandmarks.map((lm, i) => {
            // Invert the x-coordinate to match the mirrored video
            const [x, y] = mapToCanvas([1 - lm.x, lm.y], window.innerWidth, window.innerHeight);
            return (
              <circle key={i} cx={x} cy={y} r={i === 8 ? 12 : 6} fill={i === 8 ? 'cyan' : 'lime'} opacity={i === 8 ? 0.7 : 0.5} />
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default Whiteboard;
