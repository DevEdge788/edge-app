// Camada de abstração de providers de notificação.
// Hoje: providers simulados (mock). Amanhã: basta trocar a implementação
// por Twilio / WhatsApp Business API / SMTP-Sendgrid sem alterar o resto do código.

export type Channel = "sms" | "whatsapp" | "email";

export interface SendInput {
  to: string;
  subject?: string;
  body: string;
}

export interface SendResult {
  provider: string;
  status: "simulado" | "enviado" | "falhado";
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationProvider {
  name: string;
  channel: Channel;
  send(input: SendInput): Promise<SendResult>;
}

function mockProvider(channel: Channel, name: string): NotificationProvider {
  return {
    name,
    channel,
    async send(input: SendInput): Promise<SendResult> {
      if (!input.to) {
        return { provider: name, status: "falhado", error: "Destinatário em falta" };
      }
      console.log(`[${name}] (simulado) -> ${input.to}: ${input.body}`);
      return {
        provider: name,
        status: "simulado",
        metadata: { simulated: true, to: input.to, subject: input.subject ?? null },
      };
    },
  };
}

// Registo de providers por canal. Substituir aqui pela implementação real.
export const providers: Record<Channel, NotificationProvider> = {
  sms: mockProvider("sms", "mock-sms"),
  whatsapp: mockProvider("whatsapp", "mock-whatsapp"),
  email: mockProvider("email", "mock-email"),
};

export function getProvider(channel: Channel): NotificationProvider {
  return providers[channel];
}
