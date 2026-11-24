---
description: "Read-only model tool that lists SDD Feature directories in the calling session's mai-specs folder."
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-sdd-workbench

English | [中文](README.zh.md)

## Summary

`dsh-tool-sdd-workbench` adds `sdd_list_features`, a read-only tool that lists the current session's SDD Feature directories. It reads only the workspace recorded for that session and returns each directory name with its `mai-specs/` path. The tool is experimental and is not part of the shipped Web composition.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## Use this package

Mount the plugin in a composition that already has `ctx.fs` and `ctx.workingDirectory`. A local Web overlay is `web.patch.yml` in this package, passed to `dsh web --patch`. The call takes no arguments and does not accept a path from the model.

From this repository, with Node.js 24.9 or newer:

```sh
pnpm install
pnpm run build
pnpm dsh web --patch packages/experimental/tool-sdd-workbench/web.patch.yml --host 127.0.0.1 --port 4173 --no-open
pnpm exec vitest run packages/experimental/tool-sdd-workbench/tests/tool-sdd-workbench.spec.ts packages/session/working-directory/tests/working-directory.spec.ts
```

`pnpm run build` prepares the repository artifacts this launch uses. The Web command mounts this patch only. The Vitest command checks the tool and `recorded`. Acceptance steps are in `mai-specs/999-sdd-workbench/test/TEST_PLAN.md`.

```yaml
- insert:
    - id: tool-sdd-workbench
      name: '@deepseek-ai/dsh-tool-sdd-workbench'
```

-----

<a id="model-experience"></a>
## Model Experience

### Returned list

#### What the model sees

The tool name is `sdd_list_features` and it has no parameters. A list result is text lines alternating the directory name and `mai-specs/<name>`. The other results are exactly `未找到 Feature`, `当前项目没有 mai-specs/ 目录`, or `无法读取当前项目的 mai-specs/`. `features` is present only for a list. The tool description tells the model that a result of `未找到 Feature` or `当前项目没有 mai-specs/ 目录` is replied to with that text alone. The host keeps the rendered tool result and does not delete a later assistant sentence.

#### Token effect

Fixed schema cost while the tool is visible. Each result is one short text block retained in the session until compaction.

#### KV Cache effect

Prefix-stable while the tool definition stays visible. A result is append-only and does not rewrite an earlier result.

## Known Limitations and Deferred Work

- **Direct legal directories only** — files, other names, and symlink directories are skipped, and a symlink `mai-specs` is not entered.
- **One session, one workspace** — opening another Workspace is another session. This tool does not move the calling session.
- **Opt-in** — the shipped Web preset does not mount this plugin.
- **Exact empty copy is a model instruction** — `output.render` is the fixed sentence. A later assistant sentence is model text, and this package does not remove it.
- **Default Workspace is open** — the first-run Workspace titled `default-workspace` is an opened Workspace. No-Workspace means `startSession` has no current, explicit, or recent Workspace and returns before `sessions.create`.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

A session with no recorded workspace fails the call instead of reading the process launch directory. That failure is not a product sentence. The Web entry does not create a session when no Workspace is open.

</details>
