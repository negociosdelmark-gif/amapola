import { EmergencyCondition } from '../types';

export const PEDIATRIC_CONDITIONS: EmergencyCondition[] = [
  {
    id: "fiebre_001",
    condition: "Fiebre en niños (Temperatura >38°C)",
    symptoms_asociados: ["temperatura mayor a 38°C", "escalofríos", "irritabilidad", "decaimiento", "sudoración", "piel roja y caliente"],
    gravedad: "moderada",
    pasos_a_seguir: [
      "El objetivo principal es el confort y bienestar del niño, no normalizar la temperatura a la fuerza.",
      "Mide la temperatura corporal con un termómetro digital axilar o rectal.",
      "Mantén al niño bien hidratado ofreciéndole líquidos de forma constante (agua, leche materna, suero oral) en pequeñas cantidades.",
      "Vístelo con ropa ligera y mantén la habitación fresca (aprox 21-22°C), evitando corrientes de aire.",
      "Si el pediatra lo ha indicado previamente, administra antipiréticos (paracetamol o ibuprofeno) calculando la dosis exacta por el peso actual del niño, no por la edad.",
      "NUNCA alternes ni combines de forma rutinaria paracetamol e ibuprofeno por el alto riesgo de confusión, sobredosis y daño hepático/renal, a menos que el pediatra lo recete explícitamente.",
      "NUNCA uses aspirina (ácido acetilsalicílico) en niños ni adolescentes por el riesgo de Síndrome de Reye.",
      "Monitorea el estado de alerta, nivel de actividad y patrón respiratorio del niño cada 30 minutos."
    ],
    señales_de_alarma: [
      "Fiebre en bebés menores de 3 meses de edad (cualquier temperatura ≥38°C es una emergencia absoluta).",
      "Fiebre superior a 40°C o que no baja tras administrar el antipirético adecuado por peso.",
      "Dificultad evidente para respirar, respiración muy rápida (taquipnea) o hundimiento de costillas.",
      "Rigidez de nuca, letargo (cuesta mucho despertarlo), somnolencia extrema o irritabilidad inconsolable.",
      "Aparición de manchas moradas o pequeños puntos rojos que no desaparecen al presionar (petequias).",
      "Convulsión, desmayo o pérdida de conocimiento."
    ],
    remedios_naturales: [
      "Compresas húmedas con agua tibia (NO fría) colocadas únicamente para confort en la frente, axilas e ingle si el niño lo tolera de forma agradable.",
      "Baño corto de agua templada (NO fría) asegurando que el ambiente no tenga corrientes de aire y solo si el niño se siente cómodo."
    ],
    advertencias_remedios: "NUNCA utilices alcohol para frotar, compresas frías, hielo ni baños helados. Esto causa descensos bruscos peligrosos, escalofríos severos que aumentan internamente la temperatura corporal (efecto rebote) y riesgo grave de intoxicación por inhalación de vapores de alcohol.",
    referencia: "Guías AAP (Academia Americana de Pediatría) 2026 - Manejo Clínico de la Fiebre Infantil y Enfoque en el Confort del Niño.",
    category: "fiebre",
    icon: "Thermometer"
  },
  {
    id: "atragantamiento_002",
    condition: "Atragantamiento u Obstrucción de Vías Aéreas",
    symptoms_asociados: ["tos ineficaz", "imposibilidad de hablar o llorar", "cianosis (labios o cara morados)", "ruido agudo al respirar", "pánico", "pérdida de conciencia"],
    gravedad: "severa/emergencia",
    pasos_a_seguir: [
      "Evalúa rápidamente si la tos es eficaz (deja toser y anímalo). Si la tos es ineficaz (no hace ruido o no respira), actúa de inmediato.",
      "Si el niño es MENOR DE 1 AÑO (Lactante consciente):",
      "  - Coloca al bebé boca abajo a lo largo de tu antebrazo, apoyando su cabeza con tu mano (cabeza más baja que el tronco).",
      "  - Aplica 5 golpes firmes y rápidos en la espalda (entre los omóplatos) con el talón de tu mano.",
      "  - Gíralo boca arriba sosteniendo la cabeza e imparte 5 compresiones lentas en el pecho (con dos dedos justo debajo de la línea interpezonaria).",
      "  - Repite el ciclo (5 golpes / 5 compresiones) hasta expulsar el objeto o que el lactante quede inconsciente.",
      "Si el niño es MAYOR DE 1 AÑO (Niño consciente):",
      "  - Aplica la Maniobra de Heimlich (compresiones abdominales).",
      "  - Colócate detrás del niño (de rodillas si es necesario), rodea su cintura.",
      "  - Haz un puño con una mano y colócalo arriba de su ombligo y bien abajo del esternón. Presiona con la otra mano realizando un movimiento rápido y firme hacia adentro y hacia arriba.",
      "  - Continúa hasta que expulse el objeto o pierda el conocimiento.",
      "Si el niño o bebé queda INCONSCIENTE:",
      "  - Llama de inmediato al número de emergencias local (ej. 123 o 911).",
      "  - Inicia RCP de inmediato comenzando con 30 compresiones de pecho.",
      "  - Cada vez que abras la vía aérea para dar ventilaciones, mira dentro de la boca. Si el objeto obstruyente es claramente visible y accesible, retíralo con cuidado con los dedos. NUNCA realices barridos a ciegas con los dedos.",
      "  - Si tienes que dar respiraciones de rescate (o ventilaciones durante RCP), realiza 1 ventilación cada 2 a 3 segundos (20 a 30 respiraciones/min) conforme a las directrices actualizadas de la AHA 2026."
    ],
    señales_de_alarma: [
      "Incapacidad absoluta de respirar, emitir sonidos, llorar o toser.",
      "Color azulado (cianosis) alrededor de los labios, cara o uñas.",
      "Pérdida súbita del conocimiento o flacidez muscular.",
      "Cualquier sospecha de inhalación de cuerpo extraño aunque el niño parezca recuperado."
    ],
    remedios_naturales: [],
    advertencias_remedios: "NUNCA intentes meter los dedos a ciegas en la garganta del niño para extraer el objeto, ya que podrías empujarlo más adentro de la vía aérea, empeorando fatalmente la obstrucción.",
    referencia: "Directrices de RCP y Atención Cardiovascular de Emergencia Pediátrica de la AHA (Asociación Americana del Corazón) 2026.",
    category: "respiratorio",
    icon: "Activity"
  },
  {
    id: "trauma_003",
    condition: "Golpes en la Cabeza (Trauma Craneal)",
    symptoms_asociados: ["chichón o hematoma", "dolor de cabeza", "llanto inmediato", "somnolencia ligera", "irritabilidad corta"],
    gravedad: "moderada",
    pasos_a_seguir: [
      "Tranquiliza al niño y haz que se siente o recueste con la cabeza elevada.",
      "Aplica frío local inmediatamente (hielo envuelto en un paño grueso) sobre la zona del golpe durante 10-15 minutos para disminuir la inflamación.",
      "Limpia con agua y jabón suave si hay una herida superficial o raspón ligero.",
      "Observa atentamente la conducta, el habla, el equilibrio y la marcha del niño de forma continua durante las próximas 24 a 48 horas.",
      "Puedes dejarlo dormir si coincide con su hora de siesta o noche, pero despiértalo cada 2 a 3 horas para comprobar que responde con normalidad (abre los ojos, habla coherente, reconoce a sus padres).",
      "Evita darle analgésicos fuertes de inmediato sin consultar al pediatra, ya que podrían enmascarar síntomas neurológicos graves."
    ],
    señales_de_alarma: [
      "Pérdida de la conciencia por cualquier lapso de tiempo.",
      "Vómitos repetidos (más de dos ocasiones tras el golpe).",
      "Somnolencia excesiva o dificultad extrema para despertarlo.",
      "Irritabilidad extrema, llanto persistente inconsolable o cambios inusuales en su conducta.",
      "Falta de equilibrio al caminar, descoordinación o debilidad en brazos o piernas.",
      "Salida de líquido transparente o sangre por la nariz o los oídos.",
      "Pupilas de tamaños diferentes (anisocoria) o convulsiones."
    ],
    remedios_naturales: [
      "Aplicación de pomada de Árnica (solo si la piel está intacta, sin heridas abiertas) para reducir el hematoma y el dolor.",
      "Compresas frías de infusión de manzanilla para desinflamar la zona de forma suave."
    ],
    advertencias_remedios: "No utilices remedios calientes sobre el golpe, ni realices masajes fuertes sobre la zona afectada. Nunca apliques pomadas o sustancias caseras sobre heridas abiertas.",
    referencia: "Consenso de la AAP (Academia Americana de Pediatría) 2026 sobre el Manejo del Traumatismo Craneoencefálico Leve.",
    category: "trauma",
    icon: "ShieldAlert"
  },
  {
    id: "quemadura_004",
    condition: "Quemaduras Térmicas (Líquidos calientes, fuego, surfaces)",
    symptoms_asociados: ["piel enrojecida", "dolor intenso", "ampollas", "inflamación local"],
    gravedad: "moderada",
    pasos_a_seguir: [
      "Retira la fuente de calor del niño de inmediato.",
      "Enfría la zona afectada colocando la quemadura bajo un chorro suave de agua fría de la llave (NO helada ni con hielo) durante al menos 10 a 20 minutos.",
      "No retires la ropa si está adherida a la piel quemada; corta alrededor con cuidado si es necesario.",
      "Cubre la quemadura de forma holgada con una gasa estéril húmeda o un paño limpio que no deje pelusas.",
      "Si aparecen ampollas, déjalas intactas para proteger la piel subyacente de infecciones.",
      "Ofrécele abundante agua para prevenir la deshidratación debida a la pérdida de líquidos por la piel."
    ],
    señales_de_alarma: [
      "Quemaduras que afectan la cara, cuello, manos, pies, genitales o articulaciones principales.",
      "Quemaduras profundas donde la piel luce blanca, carbonizada, coriácea o insensible.",
      "Quemaduras que cubren un área mayor a la palma de la mano del niño.",
      "Presencia de ampollas rotas infectadas (con pus, mal olor o aumento de enrojecimiento).",
      "Quemaduras químicas, eléctricas o causadas por inhalación de humo."
    ],
    remedios_naturales: [
      "Gel de Aloe Vera puro (sábila) aplicado suavemente SOLO en quemaduras leves de primer grado (piel roja sin ampollas ni heridas abiertas) una vez enfriada la zona.",
      "Compresa húmeda con té de caléndula frío para calmar el ardor superficial."
    ],
    advertencias_remedios: "NUNCA apliques pasta de dientes, mantequilla, aceite, clara de huevo, tomate o café sobre una quemadura. Estos productos caseros atrapan el calor en la piel, agravan la lesión y favorecen infecciones bacterianas graves de difícil tratamiento.",
    referencia: "Guías de la AAP y la OMS 2026 sobre Prevención y Manejo de Quemaduras en la Infancia.",
    category: "trauma",
    icon: "Flame"
  },
  {
    id: "deshidratacion_005",
    condition: "Deshidratación por Vómito o Diarrea",
    symptoms_asociados: ["boca seca", "ausencia de lágrimas", "ojos hundidos", "menos pañales mojados", "irritabilidad", "letargo"],
    gravedad: "moderada",
    pasos_a_seguir: [
      "Inicia terapia de rehidratación oral (SRO - Suero de Rehidratación Oral) de inmediato. Evita el agua simple como único recurso en deshidrataciones moderadas.",
      "Ofrece el suero oral en cucharaditas o con jeringa pediátrica poco a poco: 5 ml (una cucharadita) cada 2 a 3 minutos.",
      "Si el niño vomita, espera 15 a 20 minutos y vuelve a ofrecer el suero oral aún más despacio (una cucharada cada 5 minutos).",
      "Continúa con la lactancia materna o fórmula habitual a libre demanda.",
      "No restrinjas la alimentación una vez tolerados los líquidos; ofrece alimentos suaves y de fácil digestión (plátano, manzana, arroz, pollo cocido) sin forzar al niño.",
      "No administres medicamentos para detener la diarrea (antidiarreicos) ni antibióticos sin prescripción médica formal."
    ],
    señales_de_alarma: [
      "El niño rechaza por completo los líquidos o vomita absolutamente todo lo que ingiere.",
      "Ausencia de orina en un lapso de más de 6-8 horas (o pañales completamente secos en bebés).",
      "Ojos visiblemente hundidos y llanto sin lágrimas.",
      "Letargo significativo: el niño está muy débil, somnoliento, le cuesta responder o sostener la mirada.",
      "Fontanela (mollera) hundida en bebés.",
      "Presencia de sangre o moco en el vómito o las deposiciones (diarrea disentérica)."
    ],
    remedios_naturales: [
      "Agua de arroz tostado (hervir arroz con agua y una pizca de sal) para asentar el estómago y aportar almidón.",
      "Suero casero de emergencia (solo si no hay acceso a farmacias): 1 litro de agua hervida, 2 cucharadas soperas de azúcar, media cucharadita de sal, media cucharadita de bicarbonato y el jugo de un limón."
    ],
    advertencias_remedios: "NUNCA rehidrates a un niño con bebidas energéticas deportivas, refrescos gaseosos, jugos de fruta industriales o tés azucarados. Estas bebidas contienen excesiva azúcar y baja concentración de sodio, lo cual empeora osmóticamente la diarrea y puede causar alteraciones graves de electrolitos.",
    referencia: "Estrategias de Rehidratación Oral de la OMS y Guías AAP 2026.",
    category: "digestivo",
    icon: "GlassWater"
  },
  {
    id: "convulsion_006",
    condition: "Convulsiones Febriles",
    symptoms_asociados: ["pérdida de conciencia", "movimientos espasmódicos", "rigidez corporal", "ojos en blanco", "fiebre alta"],
    gravedad: "severa/emergencia",
    pasos_a_seguir: [
      "Mantén la calma. La mayoría de las convulsiones febriles duran menos de 2 a 3 minutos y no causan daño neurológico.",
      "Coloca al niño en el suelo o sobre una superficie segura, lejos de objetos duros o afilados.",
      "Acuéstalo de lado (Posición Lateral de Seguridad) para evitar que se asfixie con saliva o vómito.",
      "Afloja la ropa alrededor del cuello y pecho para facilitar su respiración.",
      "Toma el tiempo exacto de duración de la convulsión.",
      "Permanece a su lado en todo momento protegiendo su cabeza de impactos.",
      "Una vez que cese la convulsión, si el niño tiene fiebre, puedes colocar compresas tibias en axilas y frente para ayudar a refrescarlo suavemente."
    ],
    señales_de_alarma: [
      "La convulsión dura más de 5 minutos seguidos.",
      "El niño tiene problemas para respirar después del episodio o se torna morado (cianótico).",
      "Es la primera convulsión del niño o se repite en menos de 24 horas.",
      "El niño no recupera el conocimiento o sigue extremadamente desorientado 15 minutos después.",
      "La convulsión se acompaña de rigidez de nuca persistente o vómitos severos."
    ],
    remedios_naturales: [],
    advertencias_remedios: "NUNCA intentes sujetar al niño con fuerza para detener los movimientos, NUNCA introduzcas ningún objeto (cuchara, dedos, pañuelo) en su boca, ya que podrías romper sus dientes, obstruir su respiración o recibir una mordedura. NUNCA intentes darle medicamentos o agua por la boca mientras convulsiona o esté somnoliento.",
    referencia: "Guías Clínicas AAP 2026: Diagnóstico y Manejo de las Convulsiones Febriles.",
    category: "fiebre",
    icon: "Zap"
  },
  {
    id: "alergia_007",
    condition: "Reacciones Alérgicas y Anafilaxia",
    symptoms_asociados: ["ronchas o urticaria", "picazón intensa", "hinchazón de ojos o labios", "tos de perro", "dificultad para tragar", "silbido al respirar"],
    gravedad: "severa/emergencia",
    pasos_a_seguir: [
      "Retira inmediatamente al niño del contacto con el alérgeno sospechoso (alimento, picadura, planta o medicamento).",
      "Si los síntomas son LEVES (solo ronchas localizadas en la piel, sin tos ni dificultad respiratoria):",
      "  - Aplica compresas frías sobre la zona afectada para calmar la picazón.",
      "  - Si tienes indicación previa de su pediatra, administra un antihistamínico oral según la dosis recomendada por peso.",
      "Si los síntomas son SEVEROS o sistémicos (afectan respiración o deglución - Anafilaxia):",
      "  - Si el niño tiene recetado un autoinyector de adrenalina (EpiPen), úsalo de inmediato en la cara externa del muslo.",
      "  - Llama inmediatamente al servicio de emergencias o traslada al niño al centro de salud más cercano sin perder un segundo.",
      "Mantén al niño sentado para facilitarle la respiración, o acostado boca arriba con las piernas elevadas si se siente débil o mareado."
    ],
    señales_de_alarma: [
      "Dificultad evidente para respirar, silbido en el pecho (sibilancias) o ronquera súbita.",
      "Sensación de opresión en la garganta, tongue inflamada o dificultad severa para tragar saliva.",
      "Mareo, debilidad extrema, palidez marcada o pérdida de conocimiento.",
      "Urticaria generalizada que se propaga con extrema rapidez por todo el cuerpo.",
      "Vómitos intensos y repentinos acompañados de ronchas tras comer algún alimento sospechoso."
    ],
    remedios_naturales: [
      "Compresas con infusión de avena fría sobre la piel irritada para aliviar de forma inmediata la picazón y el enrojecimiento.",
      "Baño corto con agua templada y almidón de maíz disuelto."
    ],
    advertencias_remedios: "NUNCA ignores una dificultad respiratoria esperando que pase sola, ni intentes resolver una alergia severa (anafilaxia) únicamente con remedios caseros o antihistamínicos orales. La anafilaxia es una emergencia de riesgo vital que requiere adrenalina médica inmediata.",
    referencia: "Consenso Global AAP 2026 sobre el Manejo del Shock Anafiláctico en Pediatría.",
    category: "otros",
    icon: "HeartHandshake"
  }
];
