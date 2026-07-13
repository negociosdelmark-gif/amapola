import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized GoogleGenAI client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("MOCK_MODE_ENABLED");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Endpoint for generating educational summary for voice synthesis
app.post("/api/generate-educational-summary", async (req, res) => {
  try {
    const { topicName, expandedInfo, guideline } = req.body;
    if (!topicName || (!expandedInfo && !guideline)) {
      return res.status(400).json({ error: "Faltan parámetros requeridos (topicName, y expandedInfo o guideline)." });
    }

    const ai = getAiClient();
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

    const ai = getAiClient();
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

// Chat endpoint with full history mapping and search grounding
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "El cuerpo de la solicitud debe incluir un array de 'messages'." });
    }

    const ai = getAiClient();

    // Map message history to the format required by @google/genai
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const reply = response.text || "Lo siento, no pude procesar una respuesta.";
    
    // Extract grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
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
