import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import type { AddressObject } from "mailparser";
import type { EmailMessage, EmailProvider } from "./email";

export interface GmailEmailProviderOptions {
  user: string;
  appPassword: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
}

export class GmailEmailProvider implements EmailProvider {
  private readonly options: GmailEmailProviderOptions;

  constructor(options: GmailEmailProviderOptions) {
    this.options = options;
  }

  private async connect(): Promise<ImapFlow> {
    const client = new ImapFlow({
      host: this.options.imapHost ?? "imap.gmail.com",
      port: this.options.imapPort ?? 993,
      secure: true,
      auth: {
        user: this.options.user,
        pass: this.options.appPassword,
      },
      logger: false,
    });
    await client.connect();
    return client;
  }

  async listEmails(options: { max?: number; unreadOnly?: boolean } = {}): Promise<EmailMessage[]> {
    const client = await this.connect();
    try {
      const lock = await client.getMailboxLock("INBOX");
      try {
        const result = await client.search(
          options.unreadOnly ? { seen: false } : { all: true },
          { uid: true }
        );
        const uids = Array.isArray(result) ? result : [];
        const recentUids = uids.slice(-(options.max ?? 10));
        return await this.fetchMessages(client, recentUids);
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async getEmail(id: string): Promise<EmailMessage | null> {
    const uid = Number(id);
    if (Number.isNaN(uid)) {
      return null;
    }
    const client = await this.connect();
    try {
      const lock = await client.getMailboxLock("INBOX");
      try {
        const messages = await this.fetchMessages(client, [uid]);
        return messages[0] ?? null;
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async markAsRead(id: string): Promise<void> {
    const uid = Number(id);
    if (Number.isNaN(uid)) {
      return;
    }
    const client = await this.connect();
    try {
      const lock = await client.getMailboxLock("INBOX");
      try {
        await client.messageFlagsAdd([uid], ["\\Seen"], { uid: true });
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async sendEmail(options: { to: string; subject: string; body: string }): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.options.smtpHost ?? "smtp.gmail.com",
      port: this.options.smtpPort ?? 465,
      secure: true,
      auth: {
        user: this.options.user,
        pass: this.options.appPassword,
      },
    });

    await transporter.sendMail({
      from: this.options.user,
      to: options.to,
      subject: options.subject,
      text: options.body,
    });
  }

  private async fetchMessages(client: ImapFlow, uids: number[]): Promise<EmailMessage[]> {
    if (uids.length === 0) {
      return [];
    }
    const emails: EmailMessage[] = [];
    for await (const message of client.fetch(
      uids,
      { uid: true, flags: true, source: true },
      { uid: true }
    )) {
      if (!message.source) {
        continue;
      }
      const parsed = await simpleParser(message.source);
      const seen = message.flags?.has("\\Seen") ?? false;
      emails.push({
        id: String(message.uid),
        from: formatAddress(parsed.from),
        to: formatAddress(parsed.to),
        subject: parsed.subject ?? "(sin asunto)",
        body: parsed.text ?? parsed.textAsHtml ?? "",
        date: (parsed.date ?? new Date()).toISOString(),
        unread: !seen,
      });
    }
    return emails.sort((a, b) => b.date.localeCompare(a.date));
  }
}

function formatAddress(addr?: AddressObject | AddressObject[]): string {
  const list = Array.isArray(addr) ? addr : addr ? [addr] : [];
  if (list.length === 0) {
    return "";
  }
  const a = list[0]?.value?.[0];
  if (!a) {
    return "";
  }
  if (a.name) {
    return `${a.name} <${a.address}>`;
  }
  return a.address ?? "";
}
