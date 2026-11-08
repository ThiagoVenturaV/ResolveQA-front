#!/usr/bin/env node
/**
 * Seed ResolveQA cases on a live/local backend so the production front
 * can poll them via RESOLVEQA_CASE_IDS.
 *
 * Usage:
 *   RESOLVEQA_API_URL=https://d2f79ulrlhg51j.cloudfront.net node scripts/seed-backend-cases.mjs
 *
 * Prints CASE_IDS=... for copy into repo variables / .env.local.
 */
const api = (process.env.RESOLVEQA_API_URL || "").replace(/\/$/, "");
const origin =
  process.env.RESOLVEQA_FRONT_ORIGIN ||
  "https://d10ry6ff7l79jo.cloudfront.net";

if (!api) {
  console.error("RESOLVEQA_API_URL is required");
  process.exit(1);
}

const reports = [
  ["Acme Commerce", "acme/checkout", "Cupom de 10% não altera o total da compra"],
  ["Acme Commerce", "acme/checkout", "Exportação de CSV gera arquivo vazio"],
  ["Acme Commerce", "acme/profile", "Sessão expira ao atualizar o perfil"],
  ["Acme Commerce", "acme/search", "Busca ignora palavras com acento"],
  ["Acme Commerce", "acme/uploads", "Upload de comprovante retorna erro 500"],
  ["Acme Commerce", "acme/orders", "Data do pedido desconsidera o fuso horário"],
  ["Acme Commerce", "acme/checkout", "Botão salvar não responde no Firefox"],
  ["Acme Commerce", "acme/checkout", "Resumo do checkout diverge do pedido"],
];

const ids = [];
for (const [client_id, repo_ref, report_text] of reports) {
  const res = await fetch(`${api}/api/cases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ client_id, repo_ref, report_text }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${text}`);
    process.exit(1);
  }
  const payload = JSON.parse(text);
  const id = payload?.case?.case_id;
  if (!id) {
    console.error("Response missing case.case_id:", text);
    process.exit(1);
  }
  ids.push(id);
  console.log(`${id}\t${payload.case.state}\t${report_text}`);
}

console.log(`CASE_IDS=${ids.join(",")}`);
console.log(
  "Set repository variable RESOLVEQA_CASE_IDS (or .env.local) then rebuild/redeploy the front.",
);
