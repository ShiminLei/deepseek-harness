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

The tool name is `sdd_list_features` and it has no parameters. A list result is text lines alternating the directory name and `mai-specs/<name>`. The other results are exactly `未找到 Feature`, `当前项目没有 mai-specs/ 目录`, or `无法读取当前项目的 mai-specs/`. When the result is `未找到 Feature` or `当前项目没有 mai-specs/ 目录`, the reply to the user is that text alone.

#### Token effect

Fixed schema cost while the tool is visible. Each result is one short text block retained in the session until compaction.

#### KV Cache effect

Prefix-stable while the tool definition stays visible. A result is append-only and does not rewrite an earlier result.

## Known Limitations and Deferred Work

- **Direct legal directories only** — files, other names, and symlink directories are skipped, and a symlink `mai-specs` is not entered.
- **One session, one workspace** — opening another Workspace is another session. This tool does not move the calling session.
- **Opt-in** — the shipped Web preset does not mount this plugin.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

A session with no recorded workspace fails the call instead of reading the process launch directory. That failure is not a product sentence. The Web entry does not create a session when no Workspace is open.

</details>
