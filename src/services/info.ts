export interface CompanyInfo {
  title: string;
  summary: string;
  source: string;
  date: string;
}

export interface InfoProvider {
  getCompanyNews(query: string, options?: { max?: number }): Promise<CompanyInfo[]>;
  getCompanyOverview(companyName: string): Promise<string>;
}

export class MockInfoProvider implements InfoProvider {
  async getCompanyNews(query: string, options: { max?: number } = {}): Promise<CompanyInfo[]> {
    const max = options.max ?? 5;
    return seedNews(query).slice(0, max);
  }

  async getCompanyOverview(companyName: string): Promise<string> {
    return (
      `${companyName} — perfil resumido (datos simulados):\n` +
      `- Sector: tecnología y servicios\n` +
      `- Tamaño: 50-200 empleados\n` +
      `- Mercados: Latam y Europa\n` +
      `- Crecimiento estimado último trimestre: +12% interanual\n`
    );
  }
}

function seedNews(query: string): CompanyInfo[] {
  const q = query || "mercado";
  return [
    {
      title: `${q}: resultados del último trimestre superan expectativas`,
      summary: `El sector vinculado a "${q}" reportó un crecimiento interanual del 12%, impulsado por la demanda de nuevos clientes.`,
      source: "Simulado / Demo",
      date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      title: `Novedades regulatorias que impactan a ${q}`,
      summary: "Se anunciaron cambios normativos que podrían afectar costos y plazos de operación durante el próximo semestre.",
      source: "Simulado / Demo",
      date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    },
    {
      title: `Competencia en ${q}: nuevos actores entran al mercado`,
      summary: "Dos competidores internacionales anunciaron su llegada a la región, lo que anticipa mayor presión de precios.",
      source: "Simulado / Demo",
      date: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
    },
  ];
}
