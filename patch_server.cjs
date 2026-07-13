const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldClient = `function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La variable de entorno GEMINI_API_KEY no está configurada.");
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
}`;

const newClient = `function getAiClient(): GoogleGenAI {
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
}`;
code = code.replace(oldClient, newClient);

// Update /api/chat endpoint to return pedagogical fallback
const oldChatPost = `app.post("/api/chat", async (req, res) => {
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
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: error.message || "Ocurrió un error inesperado en el servidor.",
    });
  }
});`;

const newChatPost = `app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "El cuerpo de la solicitud debe incluir un array de 'messages'." });
    }

    const ai = getAiClient();
    
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
    console.error("Error in /api/chat:", error);
    if (error.message === "MOCK_MODE_ENABLED") {
      // Pedagogical fallback for pilot
      return res.json({
        reply: "Para garantizar tu seguridad en esta versión de **prueba piloto**, el Asistente de IA está desactivado (falta configurar la clave API).\n\nPara emergencias, consulta directamente las **Guías Oficiales** en el panel principal (RCP, atragantamiento, quemaduras) que están 100% verificadas por pediatras.\n\n⚠️ Si tu hijo presenta dificultad grave para respirar, pérdida de conciencia o dolor intenso, por favor **Llama a la Línea de Emergencias Inmediatamente (123 o 911)**.",
        sources: []
      });
    }
    res.status(500).json({
      error: "Ocurrió un error de conexión con Amapola Alerta. Por favor, intenta de nuevo.",
    });
  }
});`;
code = code.replace(oldChatPost, newChatPost);

// Update /api/generate-educational-summary
const oldEdu = `    const ai = getAiClient();
    const prompt = \`Escribe un resumen auditivo breve (máximo 2 o 3 oraciones cortas, muy directo y sin introducciones) diseñado para ser leído en voz alta por un sistema de texto a voz (TTS). El objetivo es explicar a los padres por qué el riesgo asociado a "\${topicName}" es crítico para el desarrollo y seguridad infantil. Usa el siguiente contexto pediátrico como base, no inventes datos fuera de este enfoque médico:\\n\\nContexto: \${expandedInfo || guideline}\`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // Fast and sufficient for this summary task
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Eres un experto en salud y seguridad pediátrica. Tu tono es directo, educativo, empático y diseñado específicamente para ser escuchado en voz alta (fácil de procesar por el oído humano).",
      },
    });

    res.json({ text: response.text?.trim() || (expandedInfo || guideline) });`;

const newEdu = `    let responseText = "";
    try {
      const ai = getAiClient();
      const prompt = \`Escribe un resumen auditivo breve (máximo 2 o 3 oraciones cortas, muy directo y sin introducciones) diseñado para ser leído en voz alta por un sistema de texto a voz (TTS). El objetivo es explicar a los padres por qué el riesgo asociado a "\${topicName}" es crítico para el desarrollo y seguridad infantil. Usa el siguiente contexto pediátrico como base, no inventes datos fuera de este enfoque médico:\\n\\nContexto: \${expandedInfo || guideline}\`;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "Eres un experto en salud y seguridad pediátrica. Tu tono es directo, educativo, empático y diseñado específicamente para ser escuchado en voz alta.",
        },
      });
      responseText = response.text?.trim() || (expandedInfo || guideline);
    } catch (error: any) {
      if (error.message === "MOCK_MODE_ENABLED") {
        responseText = \`Tip de Prevención: \${guideline}\`;
      } else {
        throw error;
      }
    }
    res.json({ text: responseText });`;
code = code.replace(oldEdu, newEdu);

// Update /api/generate-pro-tips
const oldTips = `    const ai = getAiClient();
    const prompt = \`Escribe 3 "Pro-tips" o consejos expertos muy breves y prácticos para mejorar la seguridad en "\${topicName}". Basado en este contexto pediátrico: \${expandedInfo || guideline}. Devuelve solo los 3 tips en formato de lista (bullet points), sin saludos, ni texto extra.\`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Eres un pediatra experto en seguridad doméstica dando consejos (pro-tips) concisos, ingeniosos y extremadamente prácticos para padres.",
      },
    });

    res.json({ tips: response.text?.trim() || "No se pudieron generar tips." });`;

const newTips = `    let tipsText = "";
    try {
      const ai = getAiClient();
      const prompt = \`Escribe 3 "Pro-tips" o consejos expertos muy breves y prácticos para mejorar la seguridad en "\${topicName}". Basado en este contexto pediátrico: \${expandedInfo || guideline}. Devuelve solo los 3 tips en formato de lista (bullet points), sin saludos, ni texto extra.\`;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "Eres un pediatra experto en seguridad doméstica dando consejos (pro-tips) concisos, ingeniosos y extremadamente prácticos para padres.",
        },
      });
      tipsText = response.text?.trim() || "No se pudieron generar tips.";
    } catch (error: any) {
      if (error.message === "MOCK_MODE_ENABLED") {
        tipsText = \`• Mantén todo químico o medicamento fuera del alcance.\\n• Instala detectores de humo y monóxido de carbono.\\n• Revisa los enchufes eléctricos regularmente.\`;
      } else {
        throw error;
      }
    }
    res.json({ tips: tipsText });`;
code = code.replace(oldTips, newTips);

fs.writeFileSync('server.ts', code);
