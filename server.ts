import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PEDIATRIC_CONDITIONS } from "./src/data/conditions.js"; // Standard relative ESM import
import { WebSocketServer, WebSocket } from "ws";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' })); // Allow larger payloads for base64 images and audio

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } else {
    console.log("No GEMINI_API_KEY found. Running in resilient simulated medical mode.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini Client:", error);
}

// Simple local RAG retrieval helper
function retrieveLocalMedicalContext(query: string): string {
  const normalizedQuery = query.toLowerCase();
  const matched: typeof PEDIATRIC_CONDITIONS = [];

  for (const item of PEDIATRIC_CONDITIONS) {
    // Search keywords or condition name
    const matchName = item.condition.toLowerCase().includes(normalizedQuery);
    const matchSymptom = item.symptoms_asociados.some(s => normalizedQuery.includes(s.toLowerCase()) || s.toLowerCase().includes(normalizedQuery));
    const matchCategory = item.category.toLowerCase().includes(normalizedQuery);
    
    if (matchName || matchSymptom || matchCategory) {
      matched.push(item);
    }
  }

  // If no specific match, return a general pool of reference conditions
  const referenceSet = matched.length > 0 ? matched : PEDIATRIC_CONDITIONS.slice(0, 3);
  
  return referenceSet.map(item => `
--- CONDICIÓN: ${item.condition} ---
Severidad Base: ${item.gravedad}
Categoría: ${item.category}
Pasos a seguir:
${item.pasos_a_seguir.map((p, i) => `${i + 1}. ${p}`).join("\n")}
Señales de Alarma:
${item.señales_de_alarma.map(s => `- ${s}`).join("\n")}
Remedios Naturales Permitidos:
${item.remedios_naturales.map(r => `- ${r}`).join("\n")}
Advertencias sobre Remedios: ${item.advertencias_remedios}
Referencia Oficial: ${item.referencia}
  `).join("\n\n");
}

// 1. API: Get pediatric conditions list (Emergency Library)
app.get("/api/conditions", (req, res) => {
  res.json(PEDIATRIC_CONDITIONS);
});

// 2. API: Guided Symptom Assessment with Gemini RAG, Search Grounding, Thinking, and Visuals
app.post("/api/assess", async (req, res) => {
  const { messages, childProfile, image, thinkingMode } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Mensajes de consulta vacíos o inválidos" });
  }

  const latestMessage = messages[messages.length - 1].text;
  const childInfoContext = childProfile
    ? `Información del niño/a: Nombre: ${childProfile.name}, Edad: ${childProfile.birthDate ? calculateAgeText(childProfile.birthDate) : 'Desconocida'}, Peso: ${childProfile.weightKg ? childProfile.weightKg + 'kg' : 'Desconocido'}, Alergias: ${childProfile.allergies || 'Ninguna'}, Condiciones: ${childProfile.chronicConditions || 'Ninguna'}`
    : "Información del niño/a: No especificado (edad asumida entre 0 y 10 años).";

  // Retrieve matching medical guidelines as RAG Context
  const ragContext = retrieveLocalMedicalContext(latestMessage);

  if (!ai) {
    // Simulation mode if API key is missing
    console.log("Simulating symptom assessment response (no API key available)");
    const simulation = getSimulatedMedicalResponse(latestMessage, childProfile);
    return res.json(simulation);
  }

  try {
    const systemInstruction = `Eres "Amapola", un pediatra y especialista en primeros auxilios sumamente empático, calmado y riguroso. Tu misión es orientar a padres de niños (0 a 10 años) con base en las directrices médicas oficiales AAP y AHA 2026 más recientes.
    
REGLAS DE ORO:
1. Valida de inmediato el estado de ansiedad de la madre o padre. Sé empático y claro ("Es normal sentir angustia, pero mantengamos la calma, estoy aquí para guiarte").
2. No inventes dosis de medicamentos ni diagnostiques enfermedades complejas. Di siempre que esto es una guía de orientación primaria y no sustituye al pediatra.
3. Clasifica la severidad con base en el contexto médico en: "leve" (cuidados en casa), "moderada" (requiere consulta pediátrica regular o vigilancia de cerca) o "severa" (requiere acudir a urgencias de inmediato).
4. Si hay señales de peligro o shock, adviértelo con mayúsculas y coloca las señales de alarma primero.
5. Los remedios naturales recomendados solo deben provenir del contexto oficial de la base de conocimiento o fuentes médicas comprobadas y seguras. Nunca recomiendes remedios dañinos o sin sustento (como alcohol, vinagre o mantequilla en quemaduras).
6. Incorpora los datos del perfil del niño (si están disponibles) en las recomendaciones.
7. Si hay una imagen provista, analiza con sumo cuidado los signos visuales (ej. tipo de sarpullido, picadura, color de piel) y reporta lo que ves con cautela clínica.
8. Aplica estrictamente los protocolos de la AAP/AHA 2026:
   - FIEBRE: El confort del niño es el principal objetivo, no bajar la temperatura a la fuerza. Dosis de antipiréticos (paracetamol o ibuprofeno) se calculan estrictamente por peso actual, no por edad. No alternar paracetamol e ibuprofeno de forma rutinaria por peligro de sobredosis y confusión. Totalmente contraindicado frotar con alcohol, compresas con hielo o baños helados. Cualquier fiebre ≥38°C en bebés <3 meses requiere urgencias de inmediato.
   - ATRAGANTAMIENTO (Consciente): Lactantes (<1 año) recibirán ciclos de 5 golpes en la espalda y 5 compresiones de pecho. Niños (≥1 año) recibirán la Maniobra de Heimlich.
   - RCP (Inconsciente): 30 compresiones a 2 ventilaciones (30:2). Ritmo de 100-120 por minuto, profundidad de 1/3 del tórax (4 cm en bebés, 5 cm en niños). Permitir expansión completa del pecho. Durante RCP o rescate respiratorio, la ventilación es de 1 insuflación cada 2 a 3 segundos (20-30 ventilaciones/minuto). En atragantados inconscientes, mirar la boca al abrir la vía aérea para ver el objeto y removerlo si es visible, jamás hacer barridos a ciegas con los dedos.

CONVECIONES DE DATOS:
Debes responder estrictamente en formato JSON utilizando el esquema responseSchema definido.`;

    const contentsParts: any[] = [];
    
    // Add visual if present
    if (image && image.data && image.mimeType) {
      contentsParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }

    contentsParts.push({
      text: `
CONTEXTO MÉDICO OFICIAL DE REFERENCIA (RAG):
${ragContext}

${childInfoContext}

HISTORIAL DE CONSULTA (CHAT ANTERIOR):
${messages.map(m => `${m.role === 'user' ? 'Padre' : 'Amapola'}: ${m.text}`).join("\n")}

ÚLTIMA CONSULTA DEL PADRE:
"${latestMessage}"
${image ? "[UNA FOTO DE LA AFECTACIÓN MÉDICA SE ADJUNTA PARA TU ANÁLISIS VISUAL]" : ""}

Genera una respuesta pediátrica estructurada y empática siguiendo el esquema JSON.`
    });

    // Determine model and configuration based on visual or thinkingMode
    const useImage = !!(image && image.data);
    const modelToUse = (useImage || thinkingMode) ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";
    
    const config: any = {
      systemInstruction,
      temperature: thinkingMode ? 0.6 : 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          severity: {
            type: Type.STRING,
            description: "La severidad evaluada: 'leve', 'moderada' o 'severa'."
          },
          summary: {
            type: Type.STRING,
            description: "Resumen clínico simplificado de los síntomas descritos e indicios visuales (si aplica)."
          },
          reassurance: {
            type: Type.STRING,
            description: "Mensaje empático de calma y validación emocional para el padre."
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de pasos inmediatos y ordenados de primeros auxilios y cuidados en casa."
          },
          redFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Señales de alarma críticas e inequívocas por las cuales deben acudir a urgencias."
          },
          naturalRemedies: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Remedios tradicionales o naturistas seguros (ej. paños tibios, manzanilla en >1 año) que apliquen a la condición."
          },
          remediesWarning: {
            type: Type.STRING,
            description: "Advertencia médica de no usar remedios peligrosos (ej. no alcohol en fiebre, no mantequilla en quemaduras) o notas sobre medicamentos."
          },
          references: {
            type: Type.STRING,
            description: "Referencia a las fuentes de guías clínicas oficiales aplicadas (ej. AHA/AAP 2026, OMS)."
          },
          conversationalResponse: {
            type: Type.STRING,
            description: "Una respuesta redactada de forma fluida y conversacional que une todo lo anterior de forma comprensible para que el chat continúe de forma natural."
          }
        },
        required: ["severity", "summary", "reassurance", "steps", "redFlags", "naturalRemedies", "remediesWarning", "references", "conversationalResponse"]
      }
    };

    if (thinkingMode && !useImage) {
      // Use Thinking Mode for complex cases
      config.thinkingConfig = {
        thinkingLevel: "HIGH"
      };
    } else if (!useImage) {
      // Use Search Grounding for up to date, accurate reference checks on non-visual queries
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [
        { role: "user", parts: contentsParts }
      ],
      config
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (err: any) {
    console.error("Gemini assessment error:", err);
    // Fallback if API crashes or rates out
    const simulation = getSimulatedMedicalResponse(latestMessage, childProfile);
    res.json({
      ...simulation,
      conversationalResponse: `Disculpa, he tenido una desconexión momentánea de mi base de datos principal, pero aquí tienes una orientación de primeros auxilios basada en mis protocolos locales seguros: ${simulation.conversationalResponse}`
    });
  }
});

// 3. API: Generate spoken instruction report (TTS)
app.post("/api/generate-voice", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Falta el texto para la síntesis de voz." });
  }

  if (!ai) {
    return res.json({ error: "No disponible en modo simulación (falta API key)" });
  }

  try {
    console.log("Generating premium TTS using gemini-3.1-flash-tts-preview...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Por favor lee estas instrucciones de primeros auxilios de forma muy clara, calmada, pausada y comprensible para un padre preocupado: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm female medical speaker
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(500).json({ error: "No se pudo recuperar los datos de audio de la API de Gemini." });
    }
  } catch (err: any) {
    console.error("Error generating TTS:", err);
    res.status(500).json({ error: "Fallo la síntesis de voz premium", details: err.message });
  }
});

// 4. API: Transcribe audio recordings using gemini-3.5-flash
app.post("/api/transcribe", async (req, res) => {
  const { audio } = req.body; // { data: string, mimeType: string }
  if (!audio || !audio.data || !audio.mimeType) {
    return res.status(400).json({ error: "Falta el archivo de audio para transcribir." });
  }

  if (!ai) {
    return res.json({ text: "Consulta de voz de prueba (el laringólogo reporta tos de perro en el pequeño)." });
  }

  try {
    console.log("Transcribing audio using gemini-3.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: audio.data,
            mimeType: audio.mimeType
          }
        },
        {
          text: "Transcribe exactamente el mensaje de voz hablado por el padre sobre la salud de su hijo. Retorna únicamente la transcripción directa en español y nada más. Si no se escucha nada, retorna un string vacío."
        }
      ]
    });

    res.json({ text: response.text?.trim() || "" });
  } catch (err: any) {
    console.error("Error transcribing audio:", err);
    res.status(500).json({ error: "Error al transcribir el audio", details: err.message });
  }
});

// Helper: Calculate child age text
function calculateAgeText(birthDateStr: string): string {
  try {
    const birthDate = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    if (years === 0) {
      return `${months} meses`;
    }
    return `${years} años y ${months} meses`;
  } catch {
    return "0 años";
  }
}

// Medical Rule-based fallbacks for offline resilience
function getSimulatedMedicalResponse(query: string, childProfile: any): any {
  const q = query.toLowerCase();
  let selected = PEDIATRIC_CONDITIONS[0]; // Default to fever

  if (q.includes("atragant") || q.includes("ahogo") || q.includes("obstru") || q.includes("respir") || q.includes("tragar")) {
    selected = PEDIATRIC_CONDITIONS[1];
  } else if (q.includes("golpe") || q.includes("cabeza") || q.includes("caida") || q.includes("chichon") || q.includes("trauma")) {
    selected = PEDIATRIC_CONDITIONS[2];
  } else if (q.includes("quemadura") || q.includes("fuego") || q.includes("caliente") || q.includes("quemo")) {
    selected = PEDIATRIC_CONDITIONS[3];
  } else if (q.includes("deshidrata") || q.includes("vomito") || q.includes("diarrea") || q.includes("suero") || q.includes("boca seca")) {
    selected = PEDIATRIC_CONDITIONS[4];
  } else if (q.includes("convulsion") || q.includes("tiembla") || q.includes("blanco") || q.includes("espasm")) {
    selected = PEDIATRIC_CONDITIONS[5];
  } else if (q.includes("alergia") || q.includes("roncha") || q.includes("hinch") || q.includes("intoxic") || q.includes("picadura")) {
    selected = PEDIATRIC_CONDITIONS[6];
  }

  const childName = childProfile ? childProfile.name : "tu pequeño";

  return {
    severity: selected.gravedad,
    summary: `Orientación local sobre: ${selected.condition}`,
    reassurance: `Hola, entiendo perfectamente que te preocupes por ${childName}. Ante una situación de ${selected.condition.toLowerCase()}, lo más importante es mantener la calma para actuar con rapidez y eficacia. Estoy aquí para acompañarte paso a paso.`,
    steps: selected.pasos_a_seguir,
    redFlags: selected.señales_de_alarma,
    naturalRemedies: selected.remedios_naturales,
    reremediesWarning: selected.advertencias_remedios,
    remediesWarning: selected.advertencias_remedios,
    references: selected.referencia,
    conversationalResponse: `He evaluado los síntomas para ${childName}. Basándome en los protocolos de la ${selected.referencia}, esto parece clasificarse con severidad de nivel ${selected.gravedad.toUpperCase()}. 
    
Lo primero que debes hacer es: ${selected.pasos_a_seguir[0]}
Recuerda mantenerlo hidratado y vigilar las señales de alarma, como: ${selected.señales_de_alarma[0]}. ¿Hay algún otro síntoma que notes?`
  };
}

// 5. Vite Dev Server & Static Asset Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring Static Production Build Asset Serving...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Amapola Server is running on http://localhost:${PORT}`);
  });

  // Attach real-time Live Voice WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", async (ws: WebSocket) => {
    console.log("WebSocket client connected for Live API");
    let session: any = null;

    try {
      if (!ai) {
        ws.send(JSON.stringify({ error: "Gemini API no configurada en el servidor de voz." }));
        ws.close();
        return;
      }

      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }, // warm female speaker
          },
          systemInstruction: "Eres 'Amapola', un pediatra virtual experto en primeros auxilios pediátricos sumamente empático, calmado y directo. Guías a padres preocupados de forma verbal basándote estrictamente en las pautas AAP/AHA 2026. Tus respuestas deben ser sumamente breves y directas al grano (1 a 3 frases máximo) para ser fluidas por audio.",
        },
        callbacks: {
          onmessage: (message: any) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
              ws.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              ws.send(JSON.stringify({ interrupted: true }));
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            try { ws.close(); } catch (e) {}
          },
          onerror: (err: any) => {
            console.error("Gemini Live error:", err);
            try { ws.send(JSON.stringify({ error: err.message || "Error en Gemini Live" })); } catch (e) {}
          }
        }
      });

      ws.on("message", async (data: any) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio && session) {
            await session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" }
            });
          }
        } catch (e: any) {
          console.error("WS message parsing/sending error:", e);
        }
      });

      ws.on("close", () => {
        console.log("Client WS closed");
        if (session) {
          try {
            session.close();
          } catch (e) {}
        }
      });

    } catch (err: any) {
      console.error("WS live initialization failed:", err);
      try {
        ws.send(JSON.stringify({ error: "Error al iniciar Live Voice API: " + err.message }));
        ws.close();
      } catch (e) {}
    }
  });

  server.on('upgrade', (request, socket, head) => {
    // Only upgrade WebSocket requests
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === '/api/live-ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
}

startServer();
