# SDKs kLog

Esta carpeta es un monorepo Turborepo: los seis clientes viven aquí y la raíz orquesta `lint`, `test` y `build`. Cada lenguaje conserva su herramienta (`tsc`, `go`, `pytest`, `composer`, `mvn`, `make`).

```bash
npm install
npm run check
```

El pipeline de git está en `.github/workflows/ci.yml`. No publica paquetes.

| Carpeta | Qué es |
|---------|--------|
| `javascript/` | Workspaces npm: core, `@klog/sdk-node`, `@klog/sdk-web` |
| `go/` | Módulo Go `klog/sdk-go` |
| `python/` | Paquete `klog-sdk` |
| `php/` | Paquete Composer `klog/sdk-php` |
| `java/` | Artefacto Maven `io.klog:klog-sdk` |
| `esp/` | Biblioteca C/C++ para ESP32 (Arduino y ESP-IDF) |

## Invariantes

- Solo ingesta REST. GraphQL y la consola no viven aquí.
- Identificadores públicos UUIDv7; API token `klog_…`.
- 201 creado / 202 dropped; sin reintentos en 400/401/403.
- El contrato HTTP está en `../api/openapi/ingest.yaml`. Cada SDK define sus propios tipos.
- No reintroducir NATS, ClickHouse, una API en Node ni un RBAC de un solo rol.

Al editar un SDK, seguir el `AGENTS.md` de esa subcarpeta.

Responder en español.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
