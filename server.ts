import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get GoogleGenAI client with optional custom API key from request headers
function getAiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("MOCK_MODE_ENABLED");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `Eres Amapola Alerta, un asistente virtual experto en primeros auxilios pediátricos de alta fidelidad y máxima precisión. Tu objetivo es responder preguntas de los padres y cuidadores sobre emergencias y primeros auxilios de forma calmada, clara, estructurada y extremadamente segura.

IMPORTANTE: Toda instrucción o guía de primeros auxilios debe basarse prioritariamente en el siguiente contexto estructurado de Guía Pediátrica de Primeros Auxilios (RAG):

CONTEXTO DE GUÍA PEDIÁTRICA DE PRIMEROS AUXILIOS:
1. Reanimación Cardiopulmonar (RCP):
   - Lactantes (menores de 1 año): 30 compresiones firmes en el centro del pecho (mitad inferior del esternón) con 2 dedos (aprox. 4 cm de profundidad, ritmo 100-120 por minuto) y 2 ventilaciones cubriendo boca y nariz.
   - Niños (1 año a pubertad): 30 compresiones con el talón de una o dos manos en el centro del pecho (aprox. 5 cm de profundidad, ritmo 100-120 por minuto) y 2 ventilaciones de rescate (boca a boca pinzando la nariz).
   - Siempre llamar a emergencias de inmediato (123 o 911). Si se está solo, hacer 2 minutos de RCP antes de llamar.
2. Atragantamiento / Obstrucción de Vías Aéreas (Maniobra de Heimlich):
   - Lactantes (menores de 1 año): Colocar boca abajo sobre el antebrazo inclinado hacia abajo (sosteniendo la mandíbula). Dar 5 palmadas firmes en la espalda con el talón de la mano. Gira boca arriba y realiza 5 compresiones torácicas con 2 dedos. Repetir. Nunca hacer barridos a ciegas con el dedo.
   - Niños (mayores de 1 año): Colocarse detrás, rodear cintura, puño cerrado arriba del ombligo y debajo del esternón. Presionar hacia adentro y hacia arriba en forma de "J". Repetir hasta expulsión o pérdida de conciencia (en cuyo caso iniciar RCP).
3. Quemaduras:
   - Qué hacer: Enfriar de inmediato con agua corriente templada o fría por 10-15 minutos. Cubrir suavemente con gasa estéril o paño limpio húmedo.
   - Qué NO hacer: No aplicar hielo, pasta dental, aceites, cremas ni mantequilla. No reventar ampollas. No retirar ropa adherida.
4. Fiebre y Convulsiones Febriles:
   - Qué hacer: Recostar al niño de lado en una superficie despejada y segura (posición lateral de seguridad) para evitar asfixia. Desvestirlo para refrescar. Tomar el tiempo de duración.
   - Qué NO hacer: No introducir nada en la boca (dedos, cucharas, trapos). No dar medicamentos durante la convulsión. No bañar con agua fría/helada ni alcohol.
5. Heridas y Hemorragias:
   - Qué hacer: Aplicar presión directa continua con gasa o paño limpio por 5-10 minutos. Elevar la extremidad si no hay fractura sospechada. Lavar con agua abundante y jabón de tocador / jabón neutro.
   - Qué NO hacer: Evitar torniquetes salvo sangrado masivo incontrolable. No aplicar algodón directo.
6. Traumatismos Craneales (Golpes en la cabeza):
   - Qué hacer: Aplicar frío local indirecto. Observar comportamiento durante 24-48 horas.
   - Signos de alerta inmediata: Vómitos repetidos, somnolencia extrema, pupilas desiguales, desorientación, pérdida de equilibrio, sangrado por oído o nariz.
7. Intoxicaciones:
   - Qué hacer: Identificar el tóxico, llamar a emergencias o toxicología de inmediato.
   - Qué NO hacer: No provocar el vómito. No administrar leche o agua sin consejo profesional.
8. Fracturas y Esguinces:
   - Qué hacer: Inmovilizar en la posición encontrada. Aplicar frío local indirecto.

Pautas de comportamiento en el chat:
- Siempre transmite calma y tranquilidad a través de un tono empático pero decidido.
- Da instrucciones paso a paso utilizando listas numeradas fáciles de leer en situaciones de estrés.
- Destaca de manera visual (usando negritas y advertencias claras) las acciones prohibidas o peligrosas (lo que NO se debe hacer).
- Si la situación suena a emergencia médica crítica (p. ej. inconsciencia, no respira, hemorragia masiva, asfixia completa), inserta de manera prominente al inicio una advertencia roja/llamativa recomendando marcar de inmediato a las líneas de emergencia (123 / 911).
- Utiliza la herramienta de búsqueda de Google (googleSearch) integrada cuando el usuario consulte sobre otros temas o requiera información detallada adicional, pero da prioridad absoluta al contexto de la guía para los temas cubiertos arriba.
- Limita tus respuestas a un tamaño comprensible y directo (el usuario puede estar bajo presión).`;
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint to test custom API key connection
app.post("/api/test-connection", async (req, res) => {
  try {
    const customApiKey = req.headers["x-gemini-api-key"] as string;
    if (!customApiKey) {
      return res.status(400).json({ success: false, error: "Clave API no proporcionada." });
    }
    
    const ai = getAiClient(customApiKey);
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Hola, responde únicamente con la palabra 'OK' para verificar la conexión.",
    });
    
    if (response.text) {
      res.json({ success: true, text: response.text.trim() });
    } else {
      res.status(400).json({ success: false, error: "No se recibió respuesta de la API." });
    }
  } catch (error: any) {
    console.error("Test connection error:", error);
    res.status(400).json({ success: false, error: error.message || "Error al conectar con Gemini." });
  }
});

// Endpoint for generating educational summary for voice synthesis
app.post("/api/generate-educational-summary", async (req, res) => {
  try {
    const { topicName, expandedInfo, guideline } = req.body;
    if (!topicName || (!expandedInfo && !guideline)) {
      return res.status(400).json({ error: "Faltan parámetros requeridos (topicName, y expandedInfo o guideline)." });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string;
    const ai = getAiClient(customApiKey);
    const prompt = `Escribe un resumen auditivo breve (máximo 2 o 3 oraciones cortas, muy directo y sin introducciones) diseñado para ser leído en voz alta por un sistema de texto a voz (TTS). El objetivo es explicar a los padres por qué el riesgo asociado a "${topicName}" es crítico para el desarrollo y seguridad infantil. Usa el siguiente contexto pediátrico como base, no inventes datos fuera de este enfoque médico:\n\nContexto: ${expandedInfo || guideline}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // Fast and sufficient for this summary task
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Eres un experto en salud y seguridad pediátrica. Tu tono es directo, educativo, empático y diseñado específicamente para ser escuchado en voz alta (fácil de procesar por el oído humano).",
      },
    });

    res.json({ text: response.text?.trim() || (expandedInfo || guideline) });
  } catch (error: any) {
    res.json({ text: `Tip de Prevención: ${guideline || expandedInfo}` });
  }
});

// Endpoint for generating pro-tips for a room
app.post("/api/generate-pro-tips", async (req, res) => {
  try {
    const { topicName, expandedInfo, guideline } = req.body;
    if (!topicName || (!expandedInfo && !guideline)) {
      return res.status(400).json({ error: "Faltan parámetros requeridos." });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string;
    const ai = getAiClient(customApiKey);
    const prompt = `Escribe 3 "Pro-tips" o consejos expertos muy breves y prácticos para mejorar la seguridad en "${topicName}". Basado en este contexto pediátrico: ${expandedInfo || guideline}. Devuelve solo los 3 tips en formato de lista (bullet points), sin saludos, ni texto extra.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Eres un pediatra experto en seguridad doméstica dando consejos (pro-tips) concisos, ingeniosos y extremadamente prácticos para padres.",
      },
    });

    res.json({ tips: response.text?.trim() || "No se pudieron generar tips." });
  } catch (error: any) {
    res.json({ tips: "• Mantén todo químico o medicamento fuera del alcance.\n• Instala detectores de humo y monóxido de carbono.\n• Revisa los enchufes eléctricos regularmente." });
  }
});

// Endpoint for generating an executive vulnerability summary of all rooms
app.post("/api/generate-summary-report", async (req, res) => {
  try {
    const { preventionTopics } = req.body;
    if (!preventionTopics || !Array.isArray(preventionTopics)) {
      return res.status(400).json({ error: "Faltan parámetros requeridos o preventionTopics no es un array válido." });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string;
    
    // Check if API key exists. If not, trigger fallback immediately to avoid throwing unhandled error.
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackReport = generateFallbackSummary(preventionTopics);
      return res.json({ summary: fallbackReport });
    }

    const ai = getAiClient(customApiKey);
    const prompt = `Analiza el estado de seguridad infantil del hogar y redacta un informe ejecutivo estructurado, empático y profesional (máximo 400 palabras) en formato Markdown.
Aquí tienes el estado de las habitaciones y las medidas preventivas:
${JSON.stringify(preventionTopics, null, 2)}

Tu informe debe incluir:
1. **Un resumen de la situación actual**: Menciona el porcentaje de seguridad general y cuántas medidas se han tomado (completado) de un total de cuántas.
2. **Vulnerabilidades Críticas Detectadas**: Agrupa por habitación las medidas de prioridad 'Alta' o 'Media' que aún están PENDIENTES (completed: false). Explica de forma concisa el riesgo clínico/pediátrico de cada una para concientizar a los padres.
3. **Plan de Acción Prioritario**: Da un orden lógico de 3 a 4 pasos inmediatos para resolver los peligros más urgentes.
4. **Mensaje de aliento**: Termina con un mensaje empático y motivador para los padres sobre la importancia de la prevención pediátrica doméstica.

Usa un tono profesional de pediatra experto en prevención de accidentes domésticos. Sé directo y estructurado, usando negritas, listas y emojis para que el informe sea altamente legible. No incluyas explicaciones de que eres una IA ni introducciones fuera de tema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Eres un pediatra experto en prevención de accidentes domésticos infantiles de alta fidelidad. Tu misión es redactar un resumen ejecutivo claro, estructurado, empático e informativo.",
      },
    });

    res.json({ summary: response.text?.trim() || generateFallbackSummary(preventionTopics) });
  } catch (error: any) {
    console.error("Error generating summary report:", error);
    try {
      const fallbackReport = generateFallbackSummary(req.body.preventionTopics || []);
      res.json({ summary: fallbackReport });
    } catch (fallbackError) {
      res.status(500).json({ error: "Error interno al generar el informe." });
    }
  }
});

// Helper function to generate fallback markdown report when Gemini API is unavailable
function generateFallbackSummary(preventionTopics: any[]): string {
  let totalTasks = 0;
  let completedTasks = 0;
  const criticalVulnerabilities: { room: string; text: string; urgency: string; rationale?: string }[] = [];

  for (const topic of preventionTopics) {
    if (topic.hazards && Array.isArray(topic.hazards)) {
      for (const hazard of topic.hazards) {
        totalTasks++;
        if (hazard.completed) {
          completedTasks++;
        } else if (hazard.urgency === 'Alta' || hazard.urgency === 'Media') {
          criticalVulnerabilities.push({
            room: topic.room,
            text: hazard.text,
            urgency: hazard.urgency,
            rationale: hazard.rationale
          });
        }
      }
    }
  }

  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  let report = `### 📋 Informe Ejecutivo de Seguridad Infantil (Modo Seguro / Local)\n\n`;
  report += `**Estado General de la Casa**: El hogar cuenta con un **${percentage}% de seguridad** (${completedTasks} de ${totalTasks} medidas completadas).\n\n`;

  if (criticalVulnerabilities.length === 0) {
    report += `🎉 **¡Felicidades!** No se han detectado vulnerabilidades críticas pendientes de prioridad Alta o Media en las habitaciones analizadas. Has creado un entorno sumamente seguro para tus hijos. Sigue así y realiza chequeos preventivos regularmente.\n`;
    return report;
  }

  report += `⚠️ **Vulnerabilidades Críticas Pendientes**:\n`;
  const groupedByRoom: Record<string, typeof criticalVulnerabilities> = {};
  for (const vul of criticalVulnerabilities) {
    if (!groupedByRoom[vul.room]) {
      groupedByRoom[vul.room] = [];
    }
    groupedByRoom[vul.room].push(vul);
  }

  for (const [room, items] of Object.entries(groupedByRoom)) {
    report += `\n* **En ${room}**:\n`;
    for (const item of items) {
      report += `  - **[Prioridad ${item.urgency}]** ${item.text}\n`;
      if (item.rationale) {
        report += `    *Justificación Médica:* ${item.rationale}\n`;
      }
    }
  }

  report += `\n### 🛡️ Plan de Acción Recomendado:\n`;
  report += `1. **Atiende primero las áreas de prioridad Alta**: Comienza hoy mismo por resolver los riesgos de prioridad Alta, especialmente en Baño y Cocina donde los incidentes pueden ser graves.\n`;
  report += `2. **Involucra a la familia**: Comparte estas tareas pendientes con otros cuidadores de la casa para distribuir la adecuación de espacios.\n`;
  report += `3. **Mantén una supervisión activa**: Mientras realizas las adecuaciones físicas, redobla la supervisión visual en las áreas identificadas como críticas.\n\n`;
  report += `*La prevención de accidentes pediátricos en el hogar es la herramienta más poderosa para proteger la vida y el bienestar de tus pequeños. ¡Cada pequeña medida que aseguras cuenta enormemente! 🌸*`;

  return report;
}

// Chat endpoint with full history mapping and search grounding
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "El cuerpo de la solicitud debe incluir un array de 'messages'." });
    }

    const customApiKey = req.headers["x-gemini-api-key"] as string;
    const ai = getAiClient(customApiKey);

    // Map message history to the format required by @google/genai
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    let response;
    let usedGrounding = true;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (searchError: any) {
      console.warn("Retrying chat without googleSearch due to error:", searchError.message || searchError);
      usedGrounding = false;
      // Retry without search tool (which might be disabled or restricted on developer keys)
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
    }

    const reply = response.text || "Lo siento, no pude procesar una respuesta.";
    
    // Extract grounding sources if available (only if search was used and succeeded)
    const groundingChunks = usedGrounding ? response.candidates?.[0]?.groundingMetadata?.groundingChunks : null;
    const sources = groundingChunks
      ? groundingChunks
          .map((chunk: any) => {
            if (chunk.web) {
              return {
                title: chunk.web.title || "Fuente de búsqueda",
                uri: chunk.web.uri,
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];

    res.json({
      reply,
      sources,
    });
  } catch (error: any) {
    console.error("Critical error in /api/chat:", error);
    const errorMessage = error.message || "";
    const customApiKey = req.headers["x-gemini-api-key"] as string;

    if (customApiKey) {
      if (
        errorMessage.includes("quota") ||
        errorMessage.includes("limit") ||
        errorMessage.includes("credits") ||
        errorMessage.includes("depleted") ||
        errorMessage.includes("429")
      ) {
        return res.json({
          reply: "La clave de API de Gemini provista se ha quedado sin saldo o créditos. Por favor, verifica tu facturación en Google AI Studio (https://aistudio.google.com/).",
          sources: [],
        });
      }

      if (
        errorMessage.includes("API key not valid") ||
        errorMessage.includes("invalid") ||
        errorMessage.includes("API_KEY_INVALID")
      ) {
        return res.json({
          reply: "La clave de API de Gemini provista no es válida. Por favor, revísala e ingrésala de nuevo en el menú de Configuración.",
          sources: [],
        });
      }

      // Other custom key error
      return res.json({
        reply: `El asistente de IA experimentó un error con tu clave API provista: ${errorMessage || "Error de conexión"}. Por favor verifica su estado.`,
        sources: [],
      });
    }

    // Always fallback to pedagogical text for pilot if ANY AI error occurs (key missing, invalid, quota, etc.)
    res.json({
      reply: "Para garantizar tu seguridad en esta versión de **prueba piloto**, el Asistente de IA está temporalmente desactivado o experimentando intermitencias (sin créditos / clave).\n\nPara emergencias, consulta directamente las **Guías Oficiales** en el panel principal (RCP, atragantamiento, quemaduras) que están 100% verificadas por pediatras.\n\n⚠️ Si tu hijo presenta dificultad grave para respirar, pérdida de conciencia o dolor intenso, por favor **Llama a la Línea de Emergencias Inmediatamente (123 o 911)**.",
      sources: []
    });
  }
});

// Setup Vite Dev Server / Static Asset Serving
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrap();
