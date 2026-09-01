# Asistente Virtual por Voz (Telegram + IA)

Prototipo de un asistente virtual que se controla con **comandos de voz o texto a través de Telegram**, pensado para automatizar tareas rutinarias de un empresario: revisar/responder correos, consultar información relevante de la empresa y su mercado, y consultas de agenda.

## Cómo funciona

```
Voz/Texto en Telegram ──► Whisper (transcripción) ──► Agente GPT (function calling)
                                                           │
                                    ┌──────────────────────┼──────────────────────┐
                                    ▼                       ▼                      ▼
                              Email (listar/leer/enviar)   Noticias/Info empresa   Hora/Agenda
```

1. El usuario envía un mensaje de voz o texto al bot de Telegram.
2. Si es voz, se transcribe con **OpenAI Whisper**.
3. Un **agente LLM** (GPT con *function calling*) decide qué herramienta usar.
4. El agente ejecuta la herramienta y responde de forma natural en español.

## Stack

- **TypeScript** + Node.js
- [grammY](https://grammy.dev) — framework para bots de Telegram
- [OpenAI](https://platform.openai.com) — Whisper (STT) y GPT-4o-mini (agente)
- Servicios de email e información implementados como *proveedores* intercambiables (viene con una implementación `Mock` lista para usar, y una interfaz para conectar Gmail, Notion, CRM, etc.)

## Estructura

```
src/
├── index.ts              # Punto de entrada
├── config.ts             # Configuración desde variables de entorno
├── bot/index.ts          # Bot de Telegram (handlers de texto y voz)
├── stt/index.ts          # Transcripción de voz (Whisper)
├── agent/
│   ├── index.ts          # Bucle del agente con function calling
│   └── tools.ts          # Definición e implementación de herramientas
└── services/
    ├── email.ts          # Proveedor de email (interfaz + MockEmailProvider)
    └── info.ts           # Proveedor de información (interfaz + MockInfoProvider)
```

## Herramientas disponibles

| Herramienta | Descripción |
|---|---|
| `list_emails` | Lista correos recientes / no leídos |
| `read_email` | Lee el contenido de un correo |
| `send_email` | Envía un correo (con confirmación previa) |
| `get_company_news` | Busca noticias/info del mercado |
| `get_company_overview` | Resumen del perfil de una empresa |
| `get_current_time` | Fecha y hora actual |

## Requisitos

- Node.js 18+
- Un bot de Telegram (crearlo con [@BotFather](https://t.me/BotFather))
- Una API key de OpenAI

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
#   - TELEGRAM_BOT_TOKEN: token de @BotFather
#   - OPENAI_API_KEY: clave de https://platform.openai.com/api-keys

# 3. Compilar
npm run build

# 4. Ejecutar
npm start
```

En desarrollo:

```bash
npm run dev   # compila en modo watch
```

## Demo de conversación

**Usuario (voz):** *"¿Tengo correos nuevos?"*
**Asistente:** *Tienes 2 correos sin leer: uno de María López sobre la reunión de cierre y otro de proveedores sobre inventario.*

**Usuario (voz):** *"Lee el correo de María y redacta una respuesta proponiendo el jueves a las 10."*
**Asistente:** redacta un borrador de respuesta y pide confirmación antes de enviarlo.

**Usuario (texto):** *"¿Qué hay de nuevo en el mercado de logística?"*
**Asistente:** resume las noticias relevantes.

## Conectar servicios reales

El prototipo usa proveedores simulados para poder ejecutarse sin credenciales extra. Para conectar servicios reales, implementa las interfaces en `src/services/`:

- **Email real (Gmail):** implementa `EmailProvider` usando la Gmail API (`googleapis`) o IMAP.
- **Información real:** implementa `InfoProvider` con una API de noticias, un CRM o tu base de datos.
- **WhatsApp:** reemplaza el layer de `bot/` por el webhook de la **WhatsApp Business Cloud API** (Meta) manteniendo el mismo `stt` + `agent`.

## Siguientes pasos sugeridos

- Persistencia de sesión/conversación (memoria por usuario).
- Confirmación en dos pasos para envío de correos (ya contemplada en el prompt).
- Integración de Gmail/Google Calendar y Notion.
- Soporte de WhatsApp Business Cloud API.
- Respuesta por voz (TTS) además de texto.

## Nota de seguridad

No subas el archivo `.env` a GitHub. El repositorio ya lo ignora (ver `.gitignore`). Usa `ALLOWED_USER_IDS` para restringir quién puede usar el bot.
