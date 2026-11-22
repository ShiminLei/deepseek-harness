# 999: my-ai-infra SDD 工作台

| 项 | 值 |
|---|---|
| Phase | draft |
| Profile | standard |
| 优先级 | P1 |
| 负责人 | 待填 |
| 目标日期 | 待填 |
| 涉及子系统 | DSH Web |

## 一句话描述

在 DSH Web 中只读列出当前项目 mai-specs/ 下的 Feature 目录名和项目相对路径。

## 背景

打开使用 my-ai-infra 的项目时，需要快速知道有哪些 SDD Feature 以及它们分别在哪里。

## 关键决策

- 只识别 `mai-specs/` 直属的 `NNN-slug` 目录，按编号升序排列。
- 在 DSH Web 当前对话中查询，结果展示目录名和项目相对路径。
- 当前项目是发起查询的会话当时的 workspace 根，只读其下的 `mai-specs/`。
- 需求与验收的维护源是 [PRD](spec/PRD.md)。
- 技术方案见 [design/TECH_DESIGN.md](design/TECH_DESIGN.md)。已打开 Workspace 的会话读取该 Workspace 的路径。打开另一个 Workspace 是另一个会话。未打开时不发起查询。

## 上下文索引

- [素材索引](context/_INDEX.md)
- [PRD](spec/PRD.md)
- [技术方案](design/TECH_DESIGN.md)
- [测试计划](test/TEST_PLAN.md)
