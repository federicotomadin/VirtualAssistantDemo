import OpenAI from "openai";
import { toFile } from "openai";
import { config } from "../config";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function transcribeAudio(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const file = await toFile(buffer, fileName, { type: "audio/ogg" });
  const response = await openai.audio.transcriptions.create({
    file,
    model: config.whisperModel,
    language: config.sttLanguage || undefined,
  });
  return response.text;
}
