// Utility to get bounding boxes for toolbar buttons
export function getToolbarButtonRects(toolbarRef) {
  if (!toolbarRef.current) return [];
  return Array.from(toolbarRef.current.querySelectorAll('button[data-tool]')).map(btn => {
    const rect = btn.getBoundingClientRect();
    return {
      key: btn.getAttribute('data-tool'),
      rect,
    };
  });
}
