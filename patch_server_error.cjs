const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldChatPost = `    if (error.message === "MOCK_MODE_ENABLED") {
      // Pedagogical fallback for pilot
      return res.json({
        reply: "Para garantizar tu seguridad en esta versión de **prueba piloto**, el Asistente de IA está desactivado (falta configurar la clave API).\\n\\nPara emergencias, consulta directamente las **Guías Oficiales** en el panel principal (RCP, atragantamiento, quemaduras) que están 100% verificadas por pediatras.\\n\\n⚠️ Si tu hijo presenta dificultad grave para respirar, pérdida de conciencia o dolor intenso, por favor **Llama a la Línea de Emergencias Inmediatamente (123 o 911)**.",
        sources: []
      });
    }
    res.status(500).json({
      error: "Ocurrió un error de conexión con Amapola Alerta. Por favor, intenta de nuevo.",
    });`;

const newChatPost = `    // Always fallback to pedagogical text for pilot if ANY AI error occurs (key missing, invalid, quota, etc.)
    return res.json({
      reply: "Para garantizar tu seguridad en esta versión de **prueba piloto**, el Asistente de IA está temporalmente desactivado o experimentando intermitencias.\\n\\nPara emergencias, consulta directamente las **Guías Oficiales** en el panel principal (RCP, atragantamiento, quemaduras) que están 100% verificadas por pediatras.\\n\\n⚠️ Si tu hijo presenta dificultad grave para respirar, pérdida de conciencia o dolor intenso, por favor **Llama a la Línea de Emergencias Inmediatamente (123 o 911)**.",
      sources: []
    });`;

code = code.replace(oldChatPost, newChatPost);

const oldEdu = `    } catch (error: any) {
      if (error.message === "MOCK_MODE_ENABLED") {
        responseText = \`Tip de Prevención: \${guideline}\`;
      } else {
        throw error;
      }
    }`;

const newEdu = `    } catch (error: any) {
      responseText = \`Tip de Prevención: \${guideline}\`;
    }`;
code = code.replace(oldEdu, newEdu);

const oldTips = `    } catch (error: any) {
      if (error.message === "MOCK_MODE_ENABLED") {
        tipsText = \`• Mantén todo químico o medicamento fuera del alcance.\\n• Instala detectores de humo y monóxido de carbono.\\n• Revisa los enchufes eléctricos regularmente.\`;
      } else {
        throw error;
      }
    }`;

const newTips = `    } catch (error: any) {
      tipsText = \`• Mantén todo químico o medicamento fuera del alcance.\\n• Instala detectores de humo y monóxido de carbono.\\n• Revisa los enchufes eléctricos regularmente.\`;
    }`;
code = code.replace(oldTips, newTips);

fs.writeFileSync('server.ts', code);
