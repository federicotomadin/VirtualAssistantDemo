export interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  unread: boolean;
}

export interface EmailProvider {
  listEmails(options?: { max?: number; unreadOnly?: boolean }): Promise<EmailMessage[]>;
  getEmail(id: string): Promise<EmailMessage | null>;
  sendEmail(options: { to: string; subject: string; body: string }): Promise<void>;
  markAsRead(id: string): Promise<void>;
}

export interface MockEmailProviderOptions {
  seed?: EmailMessage[];
}

export class MockEmailProvider implements EmailProvider {
  private emails: EmailMessage[];

  constructor(options: MockEmailProviderOptions = {}) {
    this.emails = options.seed ?? seedInbox();
  }

  async listEmails(options: { max?: number; unreadOnly?: boolean } = {}): Promise<EmailMessage[]> {
    let result = [...this.emails].sort((a, b) => b.date.localeCompare(a.date));
    if (options.unreadOnly) {
      result = result.filter((e) => e.unread);
    }
    return result.slice(0, options.max ?? 10);
  }

  async getEmail(id: string): Promise<EmailMessage | null> {
    return this.emails.find((e) => e.id === id) ?? null;
  }

  async sendEmail(options: { to: string; subject: string; body: string }): Promise<void> {
    const sent: EmailMessage = {
      id: `sent-${Date.now()}`,
      from: "me@empresa.com",
      to: options.to,
      subject: options.subject,
      body: options.body,
      date: new Date().toISOString(),
      unread: false,
    };
    this.emails.push(sent);
  }

  async markAsRead(id: string): Promise<void> {
    const email = this.emails.find((e) => e.id === id);
    if (email) {
      email.unread = false;
    }
  }
}

function seedInbox(): EmailMessage[] {
  return [
    {
      id: "1",
      from: "maria.lopez@cliente.com",
      to: "me@empresa.com",
      subject: "Reunión de cierre - propuesta",
      body: "Hola, ¿podemos agendar una reunión esta semana para revisar la propuesta final? Quería confirmar los números del presupuesto antes del viernes.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      unread: true,
    },
    {
      id: "2",
      from: "proveedores@logistica.com",
      to: "me@empresa.com",
      subject: "Actualización de inventario",
      body: "Le informamos que el stock del producto X se encuentra en niveles bajos y recomendamos reordenar en los próximos días.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      unread: true,
    },
    {
      id: "3",
      from: "facturacion@contabilidad.com",
      to: "me@empresa.com",
      subject: "Factura pendiente de pago",
      body: "Adjuntamos la factura N° 2024-118 por un total de $4.500 con vencimiento el próximo lunes.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      unread: false,
    },
    {
      id: "4",
      from: "rrhh@empresa.com",
      to: "me@empresa.com",
      subject: "Recordatorio: evaluaciones de desempeño",
      body: "Recordatorio de que las evaluaciones de desempeño del equipo deben completarse antes del 15 de este mes.",
      date: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      unread: false,
    },
  ];
}
