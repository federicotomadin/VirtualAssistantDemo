import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  telegramBotToken: required("TELEGRAM_BOT_TOKEN"),
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  whisperModel: process.env.WHISPER_MODEL ?? "whisper-1",
  sttLanguage: process.env.STT_LANGUAGE ?? "es",
  allowedUserIds: (process.env.ALLOWED_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  emailAddress: process.env.EMAIL_ADDRESS ?? "",
  emailAppPassword: process.env.EMAIL_APP_PASSWORD ?? "",
};
