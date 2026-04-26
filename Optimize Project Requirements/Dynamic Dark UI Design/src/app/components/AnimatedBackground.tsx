import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let offset = 0;
    const gridSize = 40;

    const animate = () => {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      offset += 0.5;
      if (offset >= gridSize) offset = 0;

      const mouseInfluence = 60;

      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1;

      for (let x = -gridSize; x < canvas.width + gridSize; x += gridSize) {
        for (let y = -gridSize; y < canvas.height + gridSize; y += gridSize) {
          const dx = mousePos.current.x - (x + offset);
          const dy = mousePos.current.y - (y + offset);
          const dist = Math.sqrt(dx * dx + dy * dy);

          const influenceFactor = Math.max(0, 1 - dist / 300);
          const displaceX = (dx / dist) * mouseInfluence * influenceFactor || 0;
          const displaceY = (dy / dist) * mouseInfluence * influenceFactor || 0;

          const finalX = x + offset + displaceX;
          const finalY = y + offset + displaceY;

          if (dist < 200) {
            const glowIntensity = 1 - dist / 200;
            ctx.strokeStyle = `rgba(124, 58, 237, ${glowIntensity * 0.4})`;
          } else {
            ctx.strokeStyle = '#1a1a2e';
          }

          ctx.strokeRect(finalX, finalY, gridSize, gridSize);
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
