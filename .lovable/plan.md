## Objetivo

Substituir a digitação manual de atividades por um pipeline semi-automatizado:
**Site/PDF do Familienzentrum → IA extrai → você revisa em 1 tela → publica**.

Você nunca digita do zero. Só clica "aprovar", "editar" ou "rejeitar".

---

## Como vai funcionar (visão da Fernanda)

1. Você acessa `/admin/quellen` (Fontes)
2. Cadastra 1x cada Familienzentrum:
   - Nome (ex: "FaNN")
   - URL do site (ex: `http://www.fann-berlin.de/`)
   - Bairro, endereço, geo (preenchidos 1x)
   - (Opcional) URLs extras: PDF do programa mensal, newsletter, página de Instagram
3. Toda segunda 8h um job automático roda: pra cada fonte, baixa o conteúdo e manda pra IA
4. IA devolve uma lista estruturada de atividades + exceções
5. Você abre `/admin/revisao` e vê uma fila tipo Tinder:
   - ✅ Aprovar (publica)
   - ✏️ Editar e aprovar
   - ❌ Rejeitar
   - 🔁 "Já existe" (mescla com versão atual)
6. Atividades aprovadas vão pra base `activities` e aparecem no site nas seções Jetzt/Heute/Morgen

**Tempo seu estimado:** 15–30 min/semana pra revisar 50 centros (vs. ~10h pra digitar tudo manualmente)

---

## Arquitetura técnica

```text
┌──────────────────┐
│ sources (DB)     │  ← você cadastra venues 1x
│  - url, venue,   │
│    geo, bairro   │
└────────┬─────────┘
         │ cron semanal
         ▼
┌──────────────────┐
│ Edge function:   │
│ extract-source   │  ← baixa HTML/PDF + chama Gemini
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ extractions (DB) │  ← saída bruta da IA, status=pending
│  + diff vs. atual│
└────────┬─────────┘
         │ você revisa em /admin/revisao
         ▼
┌──────────────────┐
│ activities (DB)  │  ← versão publicada (já existe)
└────────┬─────────┘
         │
         ▼
   Site público (Jetzt/Heute/Morgen)
```

### Mudanças no app
- **Aposentar** `data.json` no GitHub e o `crawler_overrides` (decisão já tomada)
- `activities` vira a única fonte de verdade
- `src/lib/airtable.ts` → renomear pra `src/lib/activities.ts` e ler do Supabase
- Recorrência (`weekly`, `monthly Nth weekday`, `once`) já está modelada — mantemos

### Novas tabelas
- `sources` — Familienzentren cadastrados (URL + metadata fixa)
- `extractions` — output da IA, status: pending / approved / rejected / merged
- `source_runs` — log de cada execução (pra debug e custo)

### Novas edge functions
- `extract-source` — recebe `source_id`, busca conteúdo, chama Gemini com tool calling, salva extractions
- `run-weekly-extractions` — chamada pelo cron, dispara `extract-source` pra todas as fontes ativas
- (Opcional) `notify-pending-review` — manda email pra fixmydiaper@gmail.com toda segunda dizendo "X novas extrações pra revisar"

### IA
- **Lovable AI Gateway** (sem API key extra), modelo **google/gemini-3-flash-preview**
- Tool calling com schema estruturado (atividade, exceção, evento único)
- Custo: ~€0,001 por fonte → €0,05/semana pra 50 fontes
- Cabe folgado no plano free do Lovable AI

### Cron
- `pg_cron` + `pg_net` no Supabase, todo domingo 22h

---

## Telas novas no admin

1. **`/admin/quellen`** — lista de fontes (Familienzentren), botão "Adicionar fonte" e "Rodar agora"
2. **`/admin/revisao`** — fila de extrações pending com diff visual (verde = nova, amarelo = mudou, vermelho = removida)

---

## Fora do escopo desta fase

- Formulário público "envie sua atividade" — fica desativado por enquanto (você decide depois se reativa)
- Integração com Airtable — vamos com Lovable Cloud como banco principal (já tá conectado, sem novo serviço pra manter)
- Login dos próprios Familienzentren (opção 1 da conversa anterior) — fica pra v2

---

## Riscos e mitigações

- **IA inventa horário** → tool calling com schema rígido + você revisa antes de publicar
- **Site do centro muda layout** → o cron loga sucesso/falha; se 0 extrações sair, marco a fonte como "needs attention"
- **PDF complicado** → suportamos PDF via parser do próprio Gemini (multimodal); se falhar, você atualiza manualmente daquela fonte

---

## Pra confirmar antes de eu começar

1. **Começamos com quantas fontes piloto?** Sugiro 3–5 Familienzentren em 1–2 bairros pra validar antes de escalar.
2. **Tudo bem aposentar `data.json` e `crawler_overrides` já nessa fase** ou prefere manter como backup até a nova base estar populada?
3. **Notificação por email às segundas com link "X coisas pra revisar"** — quer agora ou só depois?