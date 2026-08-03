# Be.Ark Skill Data Scopes

> Transparency reference for security reviewers and enterprise assessments.
> Last verified: 2026-08-03 · against the skills shipped in the Be.Ark desktop app.
> Each shipped skill declares `beark_data_scope` in its `SKILL.md` frontmatter — this table can be diffed against the installed app's `skills/` directory at any time.

## Scope definitions

| Scope | Meaning |
|---|---|
| `local-only` | Reads/writes data only on the user's machine. No network access. |
| `user-data` | Works with user content stored locally (files, memory, documents, schedules). Network use, if any, is limited to the user's own connected accounts. |
| `user-cookies` | Uses the user's own login session (cookies in an app-scoped webview) to act on the user's behalf, with per-action user approval. |
| `web-public` | Fetches publicly available web content only. |

## Declared scopes (11 skills)

| Skill | Scope |
|---|---|
| kakao-sync | `local-only` |
| living-files | `user-data` |
| memory-curation | `user-data` |
| email-digest | `user-data` |
| document-registry | `user-data` |
| scheduling | `user-data` |
| dev-log | `user-data` |
| heartbeat | `user-data` |
| sns-publish | `user-cookies` |
| video-ingest | `web-public` |
| web-clip | `web-public` |

## Notes

- Skills run inside the desktop app; user data is stored locally (local-first). No skill uploads user content to Be.Ark-operated servers.
- `sns-publish` never stores platform passwords; it drives the user's own logged-in session and every publish passes a user approval step (the first publish always shows a preview modal, even when auto-publish is opted in).
- Approval model: tool calls that modify external state require conversational user approval in-app; unregistered tools default to "ask first" (fail-safe).
