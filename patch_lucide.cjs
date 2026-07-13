const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldImport = `import { 
  Heart, Calendar, ShieldCheck, CheckCircle2, Sparkles, BookOpen,
  TrendingUp, Plus, Trash2, RotateCcw, BarChart3, Lightbulb, Download,
  Bell, BellOff, Share2, Search, Award, Star, Medal, Trophy,
  Wind, Flame, Activity, Stethoscope, ChevronRight, ChevronDown, Maximize, Minimize,
  Timer, Play, Pause, Square, Mic, MicOff, Volume2, Zap, Dumbbell, Moon, Sun
} from 'lucide-react';`;

const newImport = `import { 
  Heart, Calendar, ShieldCheck, CheckCircle2, Sparkles, BookOpen,
  TrendingUp, Plus, Trash2, RotateCcw, BarChart3, Lightbulb, Download,
  Bell, BellOff, Share2, Search, Award, Star, Medal, Trophy,
  Wind, Flame, Activity, Stethoscope, ChevronRight, ChevronDown, Maximize, Minimize,
  Timer, Play, Pause, Square, Mic, MicOff, Volume2, Zap, Dumbbell, Moon, Sun,
  Bath, BedDouble, Sofa, Utensils, Baby, Droplet, Car, TreePine, Home, Edit3, Image, LayoutGrid
} from 'lucide-react';`;

code = code.replace(oldImport, newImport);

const typeOld = `  expandedInfo: string;
}`;
const typeNew = `  expandedInfo: string;
  selectedIcon?: string;
}`;
code = code.replace(typeOld, typeNew);

fs.writeFileSync('src/App.tsx', code);
