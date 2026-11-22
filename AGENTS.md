<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- RUMBO flow state lives only in browser localStorage with a 24h expiry; persist only anonymous rating rows in `resultados` and click rows in `clics_whatsapp` to keep personal flow data private.
- Keep anonymous WhatsApp writes and conditional growth-answer serialization in `src/lib/rumbo-results.ts` so every app link uses the same narrow data contract.
- AI calls go through server functions in src/lib/rumbo-ai.functions.ts using strict json_schema output; scoring rules (energy, profile, interests, margin) are pure functions in src/lib/rumbo-data.ts covered by src/test/rumbo-rules.test.ts.
- Share validated AI output contracts through `rumbo-output.ts` across server functions, browser state and PDF; accompaniment focus is selected by a pure app rule, never AI.
