import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const VALID = ["confirmada", "recusada", "reagendar"] as const;

function page(title: string, message: string) {
  return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Clínica EDGE+</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#F5F7FA;color:#0B1F33;display:grid;place-items:center;height:100vh}
.card{background:#fff;border-radius:18px;padding:40px;max-width:420px;text-align:center;box-shadow:0 12px 40px rgba(0,59,122,.12)}
h1{color:#003B7A;font-size:22px;margin:0 0 12px}p{color:#4A5B6B;line-height:1.5;margin:0}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const html = { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" };

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token") ?? "";
    let resposta = url.searchParams.get("resposta") ?? "confirmada";

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      token = typeof body?.token === "string" ? body.token : token;
      resposta = typeof body?.resposta === "string" ? body.resposta : resposta;
    }

    if (!token || token.length < 8 || !VALID.includes(resposta as typeof VALID[number])) {
      return new Response(page("Pedido inválido", "O link de confirmação não é válido. Contacte a receção."), { status: 400, headers: html });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: conf } = await supabase
      .from("appointment_confirmations")
      .select("id, appointment_id, status")
      .eq("token", token)
      .maybeSingle();

    if (!conf) {
      return new Response(page("Link expirado", "Não encontrámos este pedido de confirmação."), { status: 404, headers: html });
    }

    await supabase
      .from("appointment_confirmations")
      .update({ status: resposta, responded_at: new Date().toISOString(), response_source: "link" })
      .eq("id", conf.id);

    if (resposta === "confirmada") {
      await supabase.from("appointments").update({ status: "confirmada" }).eq("id", conf.appointment_id);
    } else if (resposta === "recusada") {
      await supabase.from("appointments").update({ status: "cancelada" }).eq("id", conf.appointment_id);
    }

    await supabase.from("notification_logs").insert({
      appointment_id: conf.appointment_id,
      confirmation_id: conf.id,
      channel: "email",
      provider: "resposta-paciente",
      template: "resposta_confirmacao",
      content: `Resposta do paciente: ${resposta}`,
      status: "enviado",
    });

    const msg: Record<string, string> = {
      confirmada: "Obrigado! A sua presença ficou confirmada. Até breve na Clínica EDGE+.",
      recusada: "A sua consulta foi cancelada. Se quiser remarcar, contacte-nos.",
      reagendar: "Recebemos o seu pedido de remarcação. A receção entrará em contacto.",
    };
    const titulo: Record<string, string> = {
      confirmada: "Consulta confirmada",
      recusada: "Consulta cancelada",
      reagendar: "Pedido registado",
    };

    if (req.method === "POST") {
      return new Response(JSON.stringify({ ok: true, status: resposta }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(page(titulo[resposta], msg[resposta]), { headers: html });
  } catch (e) {
    console.error("confirm-appointment:", e);
    return new Response(page("Erro", "Ocorreu um erro a processar a sua resposta."), { status: 500, headers: html });
  }
});
