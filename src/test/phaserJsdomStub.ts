// Stubs a minimal 2D canvas context so Phaser's device detection can run under
// jsdom (which has no real canvas backend). Import this BEFORE importing any
// Phaser module so the prototype is patched at eval time.
const noop = () => undefined;

// @ts-expect-error - Spector is a global inject for Phaser WebGLRenderer
globalThis.Spector = {};

HTMLCanvasElement.prototype.getContext = function getContext() {
  return {
    fillStyle: '#000',
    fillRect: noop,
    clearRect: noop,
    getImageData: (_x: number, _y: number, w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    putImageData: noop,
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4),
      width: w,
      height: h,
    }),
    drawImage: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    translate: noop,
    scale: noop,
    rotate: noop,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    imageSmoothingEnabled: true,
  } as unknown as CanvasRenderingContext2D;
} as unknown as HTMLCanvasElement['getContext'];
