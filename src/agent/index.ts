import OpenAI from "openai";
import { config } from "../config";
import { AgentContext, executeTool, toolDefinitions } from "./tools";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const SYSTEM_PROMPT = `Eres el asistente virtual personal de un empresario. 
Ayudas con tareas rutinarias: revisar y responder correos, buscar información relevante de la empresa y su mercado, y consultas generales de agenda.

Reglas:
- Responde siempre en español, de forma concisa y accionable.
- Usa las herramientas disponibles para obtener datos reales antes de responder.
- Para enviar correos: primero redacta el borrador y pide confirmación al usuario; solo envíalo cuando el usuario confirme explícitamente.
- Si no sabes algo, dilo y ofrece alternativas. No inventes datos.`;

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export async function runAgent(
  userMessage: string,
  ctx: AgentContext
): Promise<string> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  const openaiTools = toolDefinitions.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  for (let i = 0; i < 8; i++) {
    const response = await openai.chat.completions.create({
      model: config.openaiModel,
      messages,
      tools: openaiTools,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const choice = response.choices[0];
    if (!choice) {
      return "No pude procesar tu solicitud. Intenta de nuevo.";
    }

    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: message.content ?? "",
        tool_calls: message.tool_calls,
      });

      for (const call of message.tool_calls) {
        if (!("function" in call)) {
          continue;
        }
        const args = call.function.arguments
          ? JSON.parse(call.function.arguments)
          : {};
        const result = await executeTool(call.function.name, args, ctx);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }
      continue;
    }

    return message.content ?? "Listo.";
  }

  return "La tarea requirió demasiados pasos. Reformula tu solicitud.";
}
