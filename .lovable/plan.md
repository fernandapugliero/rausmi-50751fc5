## Ordem de implementação

Grupo A — quick wins puros (sem DB novo)
1. **Contador na home**: "X Aktivitäten diese Woche in Neukölln" em texto discreto abaixo do hero. Query: `activities` aprovadas com próxima ocorrência nos próximos 7 dias.
2. **Badge "Neu"**: adiciono badge laranja em `ActivityCard` quando `created_at > now() - 7 dias`.
3. **WhatsApp share rico**: em `ActivityCard`, mudo o texto do WhatsApp para incluir título + próxima data/hora + local + link (ao invés de só URL).
4. **Fallback empático em resultados vazios**: em `/jetzt`, `/heute`, `/morgen` quando 0 resultados → mostrar mensagem simpática + sugestão "Vielleicht magst du einen Kindercafé besuchen?" com 2-3 cafés e link pro próximo dia com atividades.

Grupo B — precisa de tabela nova
5. **Histórico "Zuletzt angesehen"** no /konto:
   - Nova tabela `user_activity_views` (user_id, activity_id, viewed_at) — só últimos 20 por usuário.
   - Grava em `ActivityDetail` quando logado.
   - Exibe em `/konto` acima dos bookmarks.

Grupo C — filtro Wetter (indoor/outdoor)
6. **Coluna `weather_suitability`** em `activities` com enum ('indoor', 'outdoor', 'both'). Default 'both'.
   - Prompt de extração (`extract-source`) atualizado para inferir do texto.
   - Backfill: heurística SQL simples baseada em keywords ("Park", "Spielplatz", "draußen" → outdoor; "Halle", "Zentrum", "Bibliothek" → indoor).
   - Novo filtro em `/jetzt`, `/heute`, `/morgen`: toggle "☔ Bei Regen" que filtra `indoor` + `both`.

Grupo D — perfil funcional
7. **Pré-filtro por idade quando logado**:
   - Se usuário tem `child_ages` no profile, na home pré-seleciono a age range mais próxima antes de navegar.
   - Aviso discreto: "Gefiltert für dein Kind (3 J.) — [alle zeigen]".

Grupo E — magazin editorial
8. **Nova rota `/magazin`** (index) + `/magazin/bei-regen-in-berlin` (primeiro post):
   - Arquivos MDX/TSX estáticos (sem CMS por enquanto — 1 arquivo por post).
   - Layout limpo: hero image, título, chapéu, corpo, CTA no fim ("Finde jetzt Aktivitäten bei Regen →" com filtro pré-aplicado).
   - Link "Magazin" no header ao lado de "Mein Konto".
   - **Texto do post**: eu escrevo o rascunho em alemão, você aprova antes de subir online.
   - JSON-LD Article, entra no sitemap.

## Decisão sobre o texto do post

Eu escrevo o rascunho completo em alemão como um componente TSX comentado com `// DRAFT — não indexar até aprovação`. Adiciono `<meta name="robots" content="noindex">` na página até você liberar. Você me diz "publica" e eu tiro o noindex e adiciono ao sitemap.

## Detalhes técnicos

**Migração 1** — `user_activity_views`:
```sql
CREATE TABLE public.user_activity_views (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, activity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_activity_views TO authenticated;
GRANT ALL ON public.user_activity_views TO service_role;
ALTER TABLE public.user_activity_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own views select" ON public.user_activity_views FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own views insert" ON public.user_activity_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own views update" ON public.user_activity_views FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own views delete" ON public.user_activity_views FOR DELETE TO authenticated USING (user_id = auth.uid());
```

**Migração 2** — coluna `weather_suitability`:
```sql
CREATE TYPE public.weather_suit AS ENUM ('indoor','outdoor','both');
ALTER TABLE public.activities ADD COLUMN weather_suitability public.weather_suit NOT NULL DEFAULT 'both';
-- Backfill heurístico
UPDATE public.activities SET weather_suitability = 'outdoor'
  WHERE lower(title||' '||coalesce(description,'')||' '||coalesce(location_name,''))
    ~ '(park|spielplatz|draußen|freibad|garten|wiese|hof|open air)';
UPDATE public.activities SET weather_suitability = 'indoor'
  WHERE lower(title||' '||coalesce(description,'')||' '||coalesce(location_name,''))
    ~ '(halle|bibliothek|zentrum|café|kirche|hallenbad|indoor|drinnen|saal)'
  AND weather_suitability = 'both';
```

## Escopo intencionalmente fora

- Não crio CMS pro magazin (1 arquivo TSX por post é suficiente pros próximos 5-10 posts).
- Não crio página `/magazin/kategorie/*` — só index + posts individuais.
- Não mexo em Kindercafés x Atividades unificados (isso ficou pra depois).

## Ordem de execução

1. Grupo A (4 itens paralelizáveis)
2. Grupo B (migração + UI)
3. Grupo C (migração + prompt + UI)
4. Grupo D (UI apenas)
5. Grupo E (rotas + draft do post pra você revisar)

Ao final te mando o rascunho do post pra você aprovar antes de eu remover o `noindex`.
