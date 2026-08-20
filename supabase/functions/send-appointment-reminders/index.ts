import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getProvider, type Channel } from "../_shared/notification-providers.ts";

const CHANNELS: Channel[] = ["sms", "whatsapp", "email"];

function fmt(dt: string) {
  const d = new Date(dt);
  return {
    date: d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Lisbon" }),
    time: d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let daysAhead = 1;
    let channels = CHANNELS;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.days_ahead === "number" && body.days_ahead >= 0 && body.days_ahead <= 30) {
        daysAhead = Math.floor(body.days_ahead);
      }
      if (Array.isArray(body?.channels)) {
        const picked = body.channels.filter((c: string) => CHANNELS.includes(c as Channel));
        if (picked.length) channels = picked as Channel[];
      }
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + daysAhead);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const { data: appts, error } = await supabase
      .from("appointments")
      .select("id, starts_at, patient_id, status, patients(full_name, phone, email), professionals(full_name), rooms(name), specialties(name)")
      .gte("starts_at", start.toISOString())
      .lt("starts_at", end.toISOString())
      .in("status", ["agendada", "confirmada"]);

    if (error) throw new Error(error.message);

    const results: unknown[] = [];

    for (const a of appts ?? []) {
      const p: any = (a as any).patients ?? {};
      const { date, time } = fmt((a as any).starts_at);
      const prof = (a as any).professionals?.full_name ?? "a nossa equipa";
      const sala = (a as any).rooms?.name ? ` · Gabinete ${(a as any).rooms.name}` : "";

      for (const channel of channels) {
        const to = channel === "email" ? p.email : p.phone;

        const { data: conf, error: confErr } = await supabase
          .from("appointment_confirmations")
          .insert({ appointment_id: (a as any).id, channel })
          .select("id, token")
          .single();
        if (confErr) {
          console.error("Falha a criar confirmação:", confErr.message);
          continue;
        }

        const body =
          `Clínica EDGE+ · Lembrete de consulta\n` +
          `Olá ${p.full_name ?? "paciente"}, tem consulta a ${date} às ${time} com ${prof}${sala}.\n` +
          `Confirme a sua presença: ${Deno.env.get("SUPABASE_URL")}/functions/v1/confirm-appointment?token=${conf.token}&resposta=confirmada`;

        const provider = getProvider(channel);
        const res = await provider.send({ to, subject: "Lembrete de consulta · Clínica EDGE+", body });

        await supabase.from("notification_logs").insert({
          appointment_id: (a as any).id,
          patient_id: (a as any).patient_id,
          confirmation_id: conf.id,
          channel,
          provider: res.provider,
          template: "lembrete_consulta",
          recipient: to ?? null,
          content: body,
          status: res.status,
          error_message: res.error ?? null,
          metadata: res.metadata ?? {},
        });

        results.push({ appointment_id: (a as any).id, channel, status: res.status });
      }
    }

    return new Response(
      JSON.stringify({ target_date: start.toISOString().slice(0, 10), appointments: appts?.length ?? 0, sent: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-appointment-reminders:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
