type Props = {
  className?: string;
};

/** Контур куба линиями — декоративный мотив «IT-куба» для обложек и аватаров */
export function CubeOutline({ className }: Props) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className} aria-hidden="true">
      {/* Шестиугольник — внешний контур куба */}
      <path d="M50 5 L89 27.5 L89 72.5 L50 95 L11 72.5 L11 27.5 Z" />
      {/* Три ребра из центра — делят куб на верхнюю, левую и правую грани */}
      <path d="M50 50 L89 27.5 M50 50 L11 27.5 M50 50 L50 95" />
    </svg>
  );
}
