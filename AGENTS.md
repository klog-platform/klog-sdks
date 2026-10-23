# SDKs kLog

Monorepo Turborepo de clientes de ingesta. Org GitHub/npm: **`kriverdevice`**. Team/producto: **`klog`**.

```bash
npm install
npm run check
```

- **CI** (`.github/workflows/ci.yml`): lint + test + build; **no publica**.
- **Deploy** (`.github/workflows/deploy.yml`): publica a npm, PyPI, Go proxy, Packagist, GH Packages, releases ESP.

| Carpeta | Qué es |
|---------|--------|
| `javascript/` | `@kriverdevice/klog-core`, `@kriverdevice/klog-node`, `@kriverdevice/klog-web` |
| `go/` | Módulo `github.com/klog-platform/klog-sdks/go` |
| `python/` | PyPI `klog-sdk` (import `klog_sdk`) |
| `php/` | Composer `kriverdevice/klog-sdk-php` |
| `java/` | Maven `com.kriverdevice:klog-sdk` |
| `esp/` | Biblioteca C/C++ ESP32 (Arduino + ESP-IDF) |

## Agentes de feature

| Feature | Agente | Foco |
|---------|--------|------|
| SDKs | `klog-sdks` | Los 6 clientes en Turborepo |
| Ingesta | `klog-ingesta` | Contrato OpenAPI y códigos HTTP |
| IoT | `klog-iot` | ESP32 y telemetría |
| Code review local | `klog-code-review` | Diff vs `main`, checks y veredicto 🔴/🟡/🟢 |

## Skills

| Acción | Skill |
|--------|-------|
| Revisar cambios locales (diff, tests, lint) | `klog-code-review` |
| Desarrollar o alinear un cliente | `klog-feature-sdks` |
| Contrato OpenAPI de ingesta | `klog-feature-ingesta` |
| Biblioteca ESP32 | `klog-feature-iot` |
| Arquitectura | `klog-arquitectura` |
| Jira / Confluence | `klog-atlassian` |
| Diagramas | `klog-diagramas-confluence` |
| Sync Atlassian | `klog-sincronizacion-atlassian` |

En workspace local polyrepo: `python3 ../docs/harness/sync.py`. En clone standalone del repo GitHub, el arnés vive en el repo hermano `klog-docs`.

## Invariantes

- Fuente de verdad operativa: Confluence `KLOG` y Jira `KL`. Backup: repo `docs`.
- Solo ingesta REST. GraphQL y consola no viven aquí.
- UUIDv7 públicos; API token `klog_…`.
- `201` creado / `202` dropped; sin reintentos en `400`/`401`/`403`.
- Contrato HTTP: [openapi/ingest.yaml](https://github.com/kriverdevice/klog-api/blob/main/openapi/ingest.yaml) (local: repo hermano `api/openapi/ingest.yaml`).
- Dominios: docs `klog.krisskira.com` · API `klog-api.krisskira.com` · staging `klog-api-staging.krisskira.com`.
- No reintroducir NATS, ClickHouse, API en Node ni RBAC de un solo rol.

Al editar un SDK, seguir el `AGENTS.md` de esa subcarpeta.

Responder en español.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
