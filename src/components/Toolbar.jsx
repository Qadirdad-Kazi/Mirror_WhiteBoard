import React, { useState, useRef, useEffect } from 'react';

const TOOLBAR_ICONS = [
  { key: 'pen', label: '✏️', tooltip: 'Pen' },
  { key: 'neon', label: '🌈', tooltip: 'Neon Pen' },
  { key: 'eraser', label: '🩹', tooltip: 'Eraser' },
  { key: 'undo', label: '↩️', tooltip: 'Undo' },
  { key: 'redo', label: '↪️', tooltip: 'Redo' },
  { key: 'clear', label: '🗑️', tooltip: 'Clear' },
  { key: 'save', label: '💾', tooltip: 'Save' },
  { key: 'mode', label: '🎥', tooltip: 'Toggle Camera/Mouse' },
];

const Toolbar = ({
  tool, setTool, color, setColor, thickness, setThickness, onUndo, onRedo, onClear, onSave, mode, setMode,
  hoveredTool, gestureSelect, toolbarRef
}) => {
  const [open, setOpen] = useState(true);
  const localRef = useRef(null);
  useEffect(() => {
    if (toolbarRef) toolbarRef.current = localRef.current;
  }, [toolbarRef]);
  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4">
      <div 
        ref={localRef}
        className={`flex flex-row bg-gray-900/90 backdrop-blur-sm rounded-full shadow-xl border border-gray-700 overflow-hidden transition-all duration-300 ${
          open ? 'max-w-4xl' : 'max-w-10'
        }`}
      >
        <button
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Collapse toolbar' : 'Expand toolbar'}
        >
          {open ? '◀' : '▶'}
        </button>
        
        <div className={`flex items-center gap-2 px-2 transition-all duration-300 ${
          open ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'
        }`}>
          <div className="flex items-center space-x-2 pr-2 border-r border-gray-600">
            {TOOLBAR_ICONS.map(({ key, label, tooltip }, idx) => (
              <button
                key={key}
                data-tool={key}
                className={`text-2xl p-2 rounded-full transition-all w-10 h-10 flex items-center justify-center ${
                  tool === key 
                    ? 'bg-cyan-500 text-white scale-110' 
                    : hoveredTool === key 
                      ? 'bg-cyan-200 text-black' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                title={tooltip}
                tabIndex={-1}
                ref={el => gestureSelect && gestureSelect(key, el, idx)}
                onClick={() => {
                  if (key === 'undo') onUndo?.();
                  else if (key === 'redo') onRedo?.();
                  else if (key === 'clear') onClear?.();
                  else if (key === 'save') onSave?.();
                  else if (key === 'mode') setMode?.(mode === 'camera' ? 'mouse' : 'camera');
                  else setTool?.(key);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 px-2">
            {tool === 'pen' && (
              <>
                <div className="relative group" title="Pen Color">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white cursor-pointer shadow-md"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2" title="Pen Thickness">
                  <span className="text-xs text-gray-300">Size</span>
                  <input
                    type="range"
                    min={1}
                    max={24}
                    value={thickness}
                    onChange={e => setThickness(Number(e.target.value))}
                    className="w-20 accent-cyan-500"
                  />
                </div>
              </>
            )}
            {tool === 'eraser' && (
              <div className="flex items-center gap-2" title="Eraser Size">
                <span className="text-xs text-gray-300">Size</span>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={thickness}
                  onChange={e => setThickness(Number(e.target.value))}
                  className="w-20 accent-cyan-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
