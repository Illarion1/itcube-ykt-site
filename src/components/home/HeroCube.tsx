import type { CSSProperties } from 'react';

// Грани куба: подпись, цвет и поворот грани в пространстве
const faces = [
  { label: 'Python', className: 'bg-accent text-ink', rotate: 'rotateY(0deg)' },
  { label: 'Роботы', className: 'bg-ink text-white', rotate: 'rotateY(90deg)' },
  { label: 'VR/AR', className: 'bg-surface-strong text-ink', rotate: 'rotateY(180deg)' },
  { label: 'Web', className: 'bg-ink text-accent', rotate: 'rotateY(-90deg)' },
  { label: 'Дизайн', className: 'bg-white text-ink', rotate: 'rotateX(90deg)' },
  { label: '3D', className: 'bg-accent text-ink', rotate: 'rotateX(-90deg)' },
];

/**
 * Вращающийся 3D-куб — символ «IT-куба», сделан только на CSS.
 * Каждая грань повёрнута (rotateX/rotateY) и выдвинута вперёд на половину ребра (translateZ),
 * а весь куб медленно вращается анимацией cube-spin (см. styles/index.css).
 */
export function HeroCube() {
  return (
    <div className="hero-cube-scene" aria-hidden="true">
      <div className="hero-cube">
        {faces.map((face, index) => {
          const style: CSSProperties = { transform: `${face.rotate} translateZ(calc(var(--cube) / 2))` };
          return (
            <div key={face.label} className={`hero-cube__face ${face.className}`} style={style}>
              <span className="text-xs opacity-60">0{index + 1}</span>
              <span>{face.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
