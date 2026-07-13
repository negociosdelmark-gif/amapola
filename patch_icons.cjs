const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const amapolaIconsStr = `
const AMAPOLA_ICONS: Record<string, { icon: any, label: string, color: string, bgColor: string }> = {
  Utensils: { icon: Utensils, label: 'Cocina', color: 'text-amber-500', bgColor: 'bg-amber-100' },
  Bath: { icon: Bath, label: 'Baño', color: 'text-cyan-500', bgColor: 'bg-cyan-100' },
  Sofa: { icon: Sofa, label: 'Sala', color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  BedDouble: { icon: BedDouble, label: 'Dormitorio', color: 'text-violet-500', bgColor: 'bg-violet-100' },
  Baby: { icon: Baby, label: 'Bebé', color: 'text-rose-500', bgColor: 'bg-rose-100' },
  Droplet: { icon: Droplet, label: 'Agua/Limpieza', color: 'text-blue-500', bgColor: 'bg-blue-100' },
  Flame: { icon: Flame, label: 'Calor/Fuego', color: 'text-orange-500', bgColor: 'bg-orange-100' },
  Zap: { icon: Zap, label: 'Eléctrico', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  Car: { icon: Car, label: 'Garaje/Auto', color: 'text-slate-500', bgColor: 'bg-slate-100' },
  TreePine: { icon: TreePine, label: 'Jardín', color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
  Home: { icon: Home, label: 'General', color: 'text-rose-500', bgColor: 'bg-rose-100' },
  ShieldCheck: { icon: ShieldCheck, label: 'Seguridad', color: 'text-blue-500', bgColor: 'bg-blue-100' }
};
`;

code = code.replace(/const INITIAL_HISTORY: SafetyHistoryRecord\[\] = \[/, amapolaIconsStr + '\nconst INITIAL_HISTORY: SafetyHistoryRecord[] = [');

const stateOld = `const [completedAreaId, setCompletedAreaId] = useState<string | null>(null);`;
const stateNew = `const [completedAreaId, setCompletedAreaId] = useState<string | null>(null);
  const [iconModalOpenId, setIconModalOpenId] = useState<string | null>(null);`;
code = code.replace(stateOld, stateNew);

fs.writeFileSync('src/App.tsx', code);
