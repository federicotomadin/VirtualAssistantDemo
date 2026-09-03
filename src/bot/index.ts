import { Bot } from "grammy";
import { config } from "../config";
import { transcribeAudio } from "../stt";
import { runAgent } from "../agent";
import { AgentContext } from "../agent/tools";
import { MockEmailProvider } from "../services/email";
import { GmailEmailProvider } from "../services/gmail";
import { MockInfoProvider } from "../services/info";

const bot = new Bot(config.telegramBotToken);

const emailProvider =
  config.emailAddress && config.emailAppPassword
    ? new GmailEmailProvider({
        user: config.emailAddress,
        appPassword: config.emailAppPassword,
      })
    : new MockEmailProvider();

const agentContext: AgentContext = {
  email: emailProvider,
  info: new MockInfoProvider(),
};

function isAuthorized(userId: number): boolean {
  if (config.allowedUserIds.length === 0) {
    return true;
  }
  return config.allowedUserIds.includes(String(userId));
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Hola, soy tu asistente virtual. 👋\n\n" +
      "Puedes escribirme o enviarme un mensaje de voz para:\n" +
      "📧 Revisar y responder correos\n" +
      "📰 Consultar información relevante de tu empresa/mercado\n" +
      "🗓️ Consultas de agenda\n\n" +
      "Prueba con: \"¿tengo correos nuevos?\""
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "Ejemplos de lo que puedes pedirme:\n" +
      "- ¿Tengo correos nuevos?\n" +
      "- Lee el correo de María y redacta una respuesta\n" +
      "- ¿Qué hay de nuevo en el mercado de X?\n" +
      "- Dame un resumen de la empresa Y"
  );
});

bot.on("message:text", async (ctx) => {
  if (!isAuthorized(ctx.from?.id ?? 0)) {
    await ctx.reply("No tienes acceso a este asistente.");
    return;
  }

  const text = ctx.message.text;
  const typing = ctx.replyWithChatAction("typing");
  try {
    const reply = await runAgent(text, agentContext);
    await typing;
    await ctx.reply(reply);
  } catch (error) {
    console.error("Error procesando mensaje de texto:", error);
    await ctx.reply("Ocurrió un error al procesar tu solicitud.");
  }
});

bot.on("message:voice", async (ctx) => {
  if (!isAuthorized(ctx.from?.id ?? 0)) {
    await ctx.reply("No tienes acceso a este asistente.");
    return;
  }

  const voice = ctx.message.voice;
  const file = await ctx.api.getFile(voice.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${file.file_path}`;

  await ctx.replyWithChatAction("typing");

  try {
    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      throw new Error(`No se pudo descargar el audio: ${audioResponse.status}`);
    }
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    await ctx.reply("🎙️ Transcribiendo tu mensaje...");
    const transcript = await transcribeAudio(audioBuffer, "voice.ogg");

    const reply = await runAgent(transcript, agentContext);
    await ctx.reply(`Tú dijiste: "${transcript}"\n\n${reply}`);
  } catch (error) {
    console.error("Error procesando mensaje de voz:", error);
    await ctx.reply("Ocurrió un error al procesar tu mensaje de voz.");
  }
});

export function startBot(): void {
  bot.start({
    onStart: (botInfo) => {
      console.log(`🤖 Bot iniciado como @${botInfo.username}`);
    },
  });
}
