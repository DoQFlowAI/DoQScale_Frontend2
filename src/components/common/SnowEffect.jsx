import { useEffect, useRef } from 'react';

// 마우스를 움직이면 커서 주변에서 눈송이가 흩날리는 배경 효과입니다. 로그인·회원가입 화면에서 씁니다
// 화면 전체를 덮는 canvas 이고 pointer-events 를 막아 두어 입력창·버튼 클릭에는 영향이 없습니다
const MAX_FLAKES = 160;
const SPAWN_DISTANCE = 14; // 마우스가 이만큼 움직일 때마다 눈송이를 만듭니다
const FLAKE_CORE = '226, 241, 255'; // 눈송이 가운데: 하늘색이 살짝 도는 흰색
const FLAKE_COLOR = '186, 218, 250';
const FLAKE_EDGE = '150, 195, 238'; // 배경(--color-page)이 밝아서 가장자리를 하늘색으로 둘러 눈송이가 보이게 합니다

export default function SnowEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    // 움직임을 줄이도록 설정한 사용자에게는 효과를 보이지 않습니다
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotion.matches) return undefined;

    let width = 0;
    let height = 0;
    let frame = 0;
    let last = { x: null, y: null };
    let flakes = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (x, y) => {
      for (let i = 0; i < 2; i += 1) {
        flakes.push({
          x: x + (Math.random() - 0.5) * 24,
          y: y + (Math.random() - 0.5) * 24,
          r: 1.5 + Math.random() * 3,
          vx: (Math.random() - 0.5) * 1.6, // 처음에 옆으로 흩어지는 속도
          vy: 0.4 + Math.random() * 0.9,
          phase: Math.random() * Math.PI * 2,
          life: 1,
          decay: 0.004 + Math.random() * 0.006,
        });
      }
      if (flakes.length > MAX_FLAKES) flakes = flakes.slice(flakes.length - MAX_FLAKES);
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      flakes = flakes.filter((f) => f.life > 0 && f.y < height + 10);
      for (const f of flakes) {
        f.phase += 0.04;
        f.vx *= 0.985; // 흩어지는 속도는 점점 줄어듭니다
        f.x += f.vx + Math.sin(f.phase) * 0.4; // 좌우로 살랑이며 내려옵니다
        f.y += f.vy;
        f.life -= f.decay;

        // 가운데는 흰색, 가장자리는 하늘색으로 번지는 둥근 눈송이 (속이 빈 고리로 보이지 않게 채웁니다)
        const alpha = Math.max(f.life, 0);
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 1.6);
        grad.addColorStop(0, `rgba(${FLAKE_CORE}, ${alpha})`);
        grad.addColorStop(0.7, `rgba(${FLAKE_COLOR}, ${alpha})`);
        grad.addColorStop(1, `rgba(${FLAKE_EDGE}, 0)`);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      // 눈송이가 없으면 그리기를 멈추고, 다음 마우스 움직임에서 다시 시작합니다
      frame = flakes.length > 0 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e) => {
      if (last.x !== null && Math.hypot(e.clientX - last.x, e.clientY - last.y) < SPAWN_DISTANCE) return;
      last = { x: e.clientX, y: e.clientY };
      spawn(e.clientX, e.clientY);
      if (!frame) frame = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
