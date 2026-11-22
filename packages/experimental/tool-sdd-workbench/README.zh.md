---
description: "只读模型工具，列出调用会话的 mai-specs 目录中的 SDD Feature。"
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-sdd-workbench

[English](README.md) | 中文

## 摘要

`dsh-tool-sdd-workbench` 提供只读工具 `sdd_list_features`，列出当前会话的 SDD Feature 目录。它只读取该会话已记录的 workspace，并返回每个目录名和 `mai-specs/` 路径。该工具是实验能力，不属于已发布的 Web 组合。

## 目录

- [使用本包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与后续工作](#known-limitations-and-deferred-work)

-----

<a id="use-this-package"></a>
## 使用本包

在已经提供 `ctx.fs` 和 `ctx.workingDirectory` 的组合中挂载本插件。本地 Web 覆盖文件是本包的 `web.patch.yml`，通过 `dsh web --patch` 传入。调用没有参数，也不接受模型传来的路径。

```yaml
- insert:
    - id: tool-sdd-workbench
      name: '@deepseek-ai/dsh-tool-sdd-workbench'
```

-----

<a id="model-experience"></a>
## 模型体验

### 返回列表

#### 模型看到的内容

工具名是 `sdd_list_features`，没有参数。列表结果是目录名和 `mai-specs/<name>` 交替的文本行。其余结果精确为 `未找到 Feature`、`当前项目没有 mai-specs/ 目录` 或 `无法读取当前项目的 mai-specs/`。结果为 `未找到 Feature` 或 `当前项目没有 mai-specs/ 目录` 时，给用户的回复只有这句原文。

#### 标记开销

工具可见时，模式的开销是固定的。每次结果是会话中保留到压缩之前的一小段文本。

#### KV Cache 影响

工具定义保持可见时，前缀稳定。一次结果只追加，不改写更早的结果。

## 已知限制与后续工作

- **只含直属合法目录** — 文件、其他名称和软链接目录会被跳过，软链接形式的 `mai-specs` 不会被进入。
- **一个会话对应一个 workspace** — 打开另一个 Workspace 是另一个会话。本工具不移动调用会话。
- **按需挂载** — 已发布的 Web preset 不包含本插件。

<a id="dev-note"></a>
### 开发注记

<details>
<summary>维护者工作上下文 — 点击展开</summary>

没有已记录 workspace 的会话会使调用失败，而不是去读进程启动目录。这个失败不是产品文案。Web 在没有打开 Workspace 时不会创建会话。

</details>
