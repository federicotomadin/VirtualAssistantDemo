import type { EmailProvider } from "../services/email";
import type { InfoProvider } from "../services/info";

export interface AgentContext {
  email: EmailProvider;
  info: InfoProvider;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "list_emails",
    description:
      "Lista los correos recientes del buzón. Útil para '¿tengo correos nuevos?' o 'revisa mi email'.",
    parameters: {
      type: "object",
      properties: {
        max: { type: "number", description: "Cantidad máxima de correos a listar (default 10)" },
        unreadOnly: { type: "boolean", description: "Solo correos no leídos (default false)" },
      },
    },
  },
  {
    name: "read_email",
    description: "Lee el contenido completo de un correo por su id.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "Id del correo a leer" },
      },
      required: ["id"],
    },
  },
  {
    name: "send_email",
    description:
      "Envía un correo. Se usa después de que el usuario confirme el contenido de un borrador.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Dirección de correo del destinatario" },
        subject: { type: "string", description: "Asunto del correo" },
        body: { type: "string", description: "Cuerpo del correo" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "get_company_news",
    description:
      "Busca noticias o información relevante del mercado/empresa. Útil para '¿qué hay de nuevo sobre X?'",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Tema, empresa o mercado a buscar" },
        max: { type: "number", description: "Cantidad máxima de resultados (default 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_company_overview",
    description: "Devuelve un resumen del perfil de una empresa.",
    parameters: {
      type: "object",
      properties: {
        companyName: { type: "string", description: "Nombre de la empresa" },
      },
      required: ["companyName"],
    },
  },
  {
    name: "get_current_time",
    description: "Devuelve la fecha y hora actual. Útil para consultas de agenda o programación.",
    parameters: { type: "object", properties: {} },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AgentContext
): Promise<string> {
  switch (name) {
    case "list_emails": {
      const emails = await ctx.email.listEmails({
        max: (args.max as number) ?? 10,
        unreadOnly: (args.unreadOnly as boolean) ?? false,
      });
      return JSON.stringify(emails);
    }
    case "read_email": {
      const email = await ctx.email.getEmail(args.id as string);
      await ctx.email.markAsRead(args.id as string);
      return email ? JSON.stringify(email) : "No se encontró el correo con ese id.";
    }
    case "send_email": {
      await ctx.email.sendEmail({
        to: args.to as string,
        subject: args.subject as string,
        body: args.body as string,
      });
      return `Correo enviado a ${args.to} con asunto "${args.subject}".`;
    }
    case "get_company_news": {
      const items = await ctx.info.getCompanyNews(args.query as string, {
        max: (args.max as number) ?? 5,
      });
      return JSON.stringify(items);
    }
    case "get_company_overview": {
      return await ctx.info.getCompanyOverview(args.companyName as string);
    }
    case "get_current_time": {
      return new Date().toISOString();
    }
    default:
      return `Herramienta desconocida: ${name}`;
  }
}
