import type { LucideIcon } from 'lucide-react';
import {
  Atom,
  Binary,
  Bot,
  Box,
  Brain,
  Building2,
  Calculator,
  Camera,
  CircuitBoard,
  Clapperboard,
  Code,
  Cpu,
  Crown,
  Database,
  Gamepad2,
  Glasses,
  Globe,
  Languages,
  Lightbulb,
  Microscope,
  Music,
  Network,
  Palette,
  PenTool,
  Plane,
  Puzzle,
  Rocket,
  Satellite,
  Server,
  ShieldCheck,
  Sigma,
  Smartphone,
  Trophy,
  Wrench,
} from 'lucide-react';

/**
 * Значки для категорий направлений. Название значка хранится в поле icon категории
 * и выбирается в админ-панели; label — подпись в списке выбора.
 */
export const categoryIcons: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: 'code', label: 'Код', Icon: Code },
  { name: 'bot', label: 'Робот', Icon: Bot },
  { name: 'smartphone', label: 'Смартфон', Icon: Smartphone },
  { name: 'server', label: 'Сервер', Icon: Server },
  { name: 'puzzle', label: 'Пазл', Icon: Puzzle },
  { name: 'glasses', label: 'VR-очки', Icon: Glasses },
  { name: 'globe', label: 'Интернет', Icon: Globe },
  { name: 'palette', label: 'Палитра', Icon: Palette },
  { name: 'gamepad', label: 'Геймпад', Icon: Gamepad2 },
  { name: 'box', label: '3D-модель', Icon: Box },
  { name: 'clapperboard', label: 'Кино', Icon: Clapperboard },
  { name: 'satellite', label: 'Спутник', Icon: Satellite },
  { name: 'building', label: 'Здание', Icon: Building2 },
  { name: 'binary', label: 'Двоичный код', Icon: Binary },
  { name: 'sigma', label: 'Математика', Icon: Sigma },
  { name: 'crown', label: 'Шахматы', Icon: Crown },
  { name: 'cpu', label: 'Процессор', Icon: Cpu },
  { name: 'circuit', label: 'Электроника', Icon: CircuitBoard },
  { name: 'brain', label: 'Искусственный интеллект', Icon: Brain },
  { name: 'network', label: 'Сеть', Icon: Network },
  { name: 'database', label: 'Данные', Icon: Database },
  { name: 'shield', label: 'Безопасность', Icon: ShieldCheck },
  { name: 'rocket', label: 'Ракета', Icon: Rocket },
  { name: 'plane', label: 'Беспилотники', Icon: Plane },
  { name: 'atom', label: 'Физика', Icon: Atom },
  { name: 'microscope', label: 'Наука', Icon: Microscope },
  { name: 'calculator', label: 'Калькулятор', Icon: Calculator },
  { name: 'pen', label: 'Дизайн', Icon: PenTool },
  { name: 'camera', label: 'Фото', Icon: Camera },
  { name: 'music', label: 'Музыка', Icon: Music },
  { name: 'languages', label: 'Языки', Icon: Languages },
  { name: 'wrench', label: 'Инструменты', Icon: Wrench },
  { name: 'lightbulb', label: 'Идея', Icon: Lightbulb },
  { name: 'trophy', label: 'Соревнования', Icon: Trophy },
];

const icons = Object.fromEntries(categoryIcons.map((i) => [i.name, i.Icon]));

type Props = {
  // Название значка из categoryIcons; если не задано или неизвестно — значок «Код»
  name?: string;
  size?: number;
  className?: string;
};

export function CategoryIcon({ name, size = 22, className }: Props) {
  const Icon = (name && icons[name]) || Code;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
