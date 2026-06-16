## Contexto importante antes do plano

As atividades exibidas no site **não vêm da tabela `activities` do banco** — elas vêm do `data.json` no GitHub (apenas community submissions vão para a tabela). Por isso "reaprovar tudo agora" no sentido de marcar `is_approved=false` não funciona para o conteúdo que você está vendo problemático.

Boa notícia: já existe a tabela `crawler_overrides` com campo `hidden` por `event_key`. É o mecanismo certo para ocultar atividades específicas vindas do JSON. O plano abaixo usa isso e conecta com os reports.

PDF como fonte: hoje o link "Originalquelle ansehen" abre `source_url` em nova aba sem distinção. Vou detectar `.pdf` e mostrar "PDF öffnen" com ícone de documento.

---

## 1. Formulário de report na página da atividade

Novo componente `ActivityReportForm.tsx` inserido em `ActivityDetail.tsx`, dentro de um `<details>` colapsável estilo nativo com o design do site (chevron animado, bordas suaves).

**Header colapsável:** "Etwas zu dieser Aktivität melden" + chevron.

**Conteúdo (visível só quando aberto):**
- Radio: **Ich bin Besucher:in** / **Ich bin Veranstalter:in**
- Checkboxes (multi-select) com 4 opções pré-definidas + "Sonstiges":
  - Aktivität hat verspätet begonnen
  - Aktivität hat nicht stattgefunden
  - Aktivität existiert nicht mehr
  - Informationen sind falsch
  - Sonstiges
- Textarea opcional para comentário livre (max 1000 chars, validação zod)
- Botão "Melden"

**Auth obrigatório:** se usuário não logado, mostrar mensagem "Bitte melde dich an, um etwas zu melden" + botão que abre o `AuthDialog`. Após login, form aparece.

Após submit: toast "Danke für dein Feedback!" e fecha o details.

## 2. Tabela `activity_reports` (migration)

```
activity_reports
  id uuid pk
  activity_id text            -- aceita ID composto (uuid__timestamp)
  activity_title text          -- snapshot (atividade pode sumir do JSON)
  activity_source_url text     -- snapshot
  reporter_user_id uuid → auth.users (NOT NULL)
  reporter_role text           -- 'visitor' | 'organizer'
  issues text[]                -- ex: ['late','did_not_happen',...]
  comment text
  status text default 'open'   -- 'open' | 'resolved' | 'dismissed'
  resolved_by uuid
  resolved_at timestamptz
  created_at, updated_at
```

RLS:
- `INSERT`: usuário autenticado pode criar com `reporter_user_id = auth.uid()`
- `SELECT/UPDATE/DELETE`: apenas admins (`has_role`)
- GRANTs apropriados (`authenticated` insert, `service_role` all)

## 3. Aba "Reports" no Admin

Nova tab em `src/pages/Admin.tsx` (`tab: "reports"`) com:
- Lista cards ordenados por `created_at desc`
- Filtro: Open / Resolved / Dismissed
- Cada card mostra: título da atividade (link para `/activity/:id`), reporter role, issues como chips, comentário, data, email do reporter
- Ações por report:
  - **Aktivität ausblenden** → upsert em `crawler_overrides` com `hidden=true` usando o ID base (sem `__suffix`) como `event_key`, e marca report como `resolved`
  - **Erledigt** → marca `resolved`
  - **Verwerfen** → marca `dismissed`

## 4. Limpeza one-time (resposta honesta)

Não vou marcar atividades como pending porque elas não estão no banco. Em vez disso, o fluxo prático fica:
- Reports chegam → você abre a aba Reports → 1 clique para ocultar via crawler_overrides
- Para os casos atuais que você já viu (não-infantis, anmeldung errado), a melhor abordagem é você mesmo enviar reports ou eu adicionar um botão "Ocultar" direto no card de atividade da aba "Freigegeben"/"Crawler-Daten". Já existe `CrawlerOverridesAdmin` para gerenciar manualmente — posso adicionar busca/filtro lá se quiser, mas isso fica fora deste plano.

## 5. PDF detection na página de detalhe

Em `ActivityDetail.tsx`, detectar se `source_url` termina em `.pdf` (ou contém `.pdf?`) e renderizar "PDF öffnen" com ícone `FileText` em vez de "Originalquelle ansehen" com `ExternalLink`.

---

## Arquivos afetados

- **Migration nova** — tabela `activity_reports` + RLS + GRANTs + trigger updated_at
- **Novo** `src/components/ActivityReportForm.tsx`
- **Edit** `src/pages/ActivityDetail.tsx` — adicionar form + PDF detection
- **Novo** `src/components/ReportsAdmin.tsx`
- **Edit** `src/pages/Admin.tsx` — nova aba "Reports"
- **Novo** `src/lib/reports.ts` — helpers de insert/list/resolve

Confirma para eu seguir?
