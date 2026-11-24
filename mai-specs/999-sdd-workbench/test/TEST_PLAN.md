# 业务测试计划

[返回需求简报](../BRIEF.md)

预期来自 [spec/PRD.md](../spec/PRD.md) 的 AC-01 至 AC-06。2026-11-22 20:51–21:02（UTC+8）在本地 DSH Web 执行了 TC-01 至 TC-06。21:14–21:16 用同一启动命令复验了 TC-02 和 TC-03。界面版本是 `0.2.3-alpha.1-5da1b68-dirty`，基线 HEAD 为 `5da1b68`，工作区含未提交的 `sdd_list_features` 实现。启动命令是 `pnpm dsh web --patch packages/experimental/tool-sdd-workbench/web.patch.yml --patch apps/web/tests/pin-browse-picker.overlay.yml --host 127.0.0.1 --port 4173 --no-open`。模型是 DeepSeek-V4.1-Flash，推理等级 High。数据在 `/tmp/dsh-sdd-accept-tkdI` 的 `tc01`、`tc02`、`tc03`、`tc04a`、`tc04b`、`tc06`。

2026-11-22 的页面观察里，TC-01、TC-02、TC-03、TC-04、TC-05 通过。当天的 TC-06 使用了已经显示「默认工作区」的首屏，该次记录作废。2026-11-24 起，TC-06 改为 Workspace 列表为空，证据是现有客户端测试。按修订后的 AC-06，TC-06 通过。本次修订没有重跑模型对话。

## 范围与依据

在 DSH Web 已打开 Workspace 的当前对话中，只读看到该会话 workspace 根下的 Feature 目录名和相对路径。打开另一个 Workspace 后，在那个 Workspace 的会话里查询，原会话的结果保留。Workspace 列表为空时，现有入口不发起查询。已经显示的「默认工作区」是已打开的 Workspace，目录为 Documents 下的 `deepseek-harness/default-workspace`。

不验收：编辑 Feature、固定查询口令、独立页面、未打开 Workspace 时的新文案，以及在同一会话内把 workspace 根改成另一个 Workspace。

## 已有测试覆盖

| 需求 / 业务行为 | 已有测试或入口 | 覆盖范围及结果依据 | 仍需补验的部分 |
|---|---|---|---|
| AC-01 至 AC-06 | `packages/experimental/tool-sdd-workbench/tests/tool-sdd-workbench.spec.ts` | 开发测试覆盖工具返回、排序、空目录、缺目录、两个会话和软链接不跟随。它不能代替本次 Web 对话观察 | 本次 Web 结果见各用例 |
| 未打开 Workspace 不发起查询 | `packages/client/ui-workspace/tests/workspaces-service.client.spec.ts` 中「opens nothing when a New Session request has no Workspace to open」和「requests a Workspace without clearing the current selection when no Workspace is available」 | 空列表时 `sessions.create` 不被调用。有待写入草稿时提示选择工作区，否则清空主视图 | TC-06。不覆盖已经显示「默认工作区」的首屏 |

## 待验业务用例

### TC-01：多个 Feature 按编号展示并跳过其他条目

- 关联需求：AC-01
- 前提与数据：DSH Web 已打开一个 Workspace，并且当前对话能查询 SDD Feature。该 Workspace 根下有 `mai-specs/010-beta/`、`mai-specs/001-alpha/`、`mai-specs/002-gamma/`，以及 `_templates/`、`README.md`、`ROADMAP.md` 和一个不符合 `NNN-slug` 的直属目录。
- 操作步骤：
  1. 打开该 Workspace 的当前对话。
  2. 在这条对话中请求列出当前项目的 SDD Feature。
- 预期结果：同一条对话按 `001-alpha`、`002-gamma`、`010-beta` 展示三项。每一项都能看到目录名，以及 `mai-specs/001-alpha`、`mai-specs/002-gamma`、`mai-specs/010-beta`。结果中没有被跳过的条目，也没有「未找到 Feature」或「当前项目没有 mai-specs/ 目录」。
- 验证方式与证据：人工在 DSH Web 当前对话观察顺序和两项字段。保留对话截图。
- 本次结果：通过。20:51，工作区 `tc01`。同一条对话按 `001-alpha`、`002-gamma`、`010-beta` 展示，路径分别是 `mai-specs/001-alpha`、`mai-specs/002-gamma`、`mai-specs/010-beta`。对话中没有 `_templates`、`notes`、`README.md`、`ROADMAP.md`，也没有「未找到 Feature」或「当前项目没有 mai-specs/ 目录」。模型在表格前后加了英文说明。轨迹显示调用了 `sdd_list_features`。

### TC-02：有 mai-specs 但没有合法 Feature

- 关联需求：AC-02
- 前提与数据：DSH Web 已打开一个 Workspace。其 `mai-specs/` 里只有 `_templates/`、`README.md`、`ROADMAP.md` 或不符合规则的条目。
- 操作步骤：
  1. 打开该 Workspace 的当前对话。
  2. 请求列出当前项目的 SDD Feature。
- 预期结果：工具结果文本精确为「未找到 Feature」。不显示 Feature 列表。工具描述要求模型之后只回复这句。宿主不删除模型后来写下的句子。
- 验证方式与证据：人工核对当前对话文案。保留截图。
- 本次结果：通过。21:14，工作区 `tc02` 的新会话，输入「列出当前项目的 SDD Feature」。轨迹只有 `sdd_list_features`。助手回复的正文只有「未找到 Feature」。这是该模型在工具描述约束下的一次观察。20:59 那次失败已作废：当时同一条对话在原句之外追加了说明、被跳过的名称和新建提议。

### TC-03：没有 mai-specs

- 关联需求：AC-03
- 前提与数据：DSH Web 已打开一个 Workspace。该 Workspace 根下没有 `mai-specs/`。
- 操作步骤：
  1. 打开该 Workspace 的当前对话。
  2. 请求列出当前项目的 SDD Feature。
- 预期结果：工具结果文本精确为「当前项目没有 mai-specs/ 目录」。不显示 Feature 列表。工具描述要求模型之后只回复这句。宿主不删除模型后来写下的句子。
- 验证方式与证据：人工核对当前对话文案。保留截图。
- 本次结果：通过。21:16，工作区 `tc03` 的新会话，输入「列出当前项目的 SDD Feature」。轨迹只有 `sdd_list_features`。助手回复的正文只有「当前项目没有 mai-specs/ 目录」。这是该模型在工具描述约束下的一次观察。21:01 那次失败已作废：当时同一条对话在原句之外追加了原因，并写出绝对路径 `/private/tmp/dsh-sdd-accept-tkdI/tc03`。

### TC-04：两个 Workspace 分别查询，原会话结果保留

- 关联需求：AC-04
- 前提与数据：Workspace A 和 Workspace B 都能在 DSH Web 打开，两者的合法 Feature 不同。例如 A 只有 `001-alpha`，B 只有 `002-beta`。
- 操作步骤：
  1. 打开 Workspace A，在 A 的会话中请求列出 SDD Feature。
  2. 打开 Workspace B，进入 B 的会话，再次请求列出 SDD Feature。
  3. 回到 A 的原会话。
- 预期结果：A 的会话只显示 A 的 Feature。B 的该次结果只显示 B 的 Feature，按编号升序，不包含只存在于 A 的 Feature。回到 A 的原会话后，第 1 步的查询结果仍在，没有被改成 B 的列表。
- 验证方式与证据：人工按顺序操作，并分别查看 A、B 两个会话。保留两次结果和回到 A 之后的截图。
- 本次结果：通过。A 是 `tc04a`，B 是 `tc04b`。20:56 在 A 的会话查询，只显示 `001-alpha` 和 `mai-specs/001-alpha`。20:57 在 B 的原会话再次查询，只显示 `002-beta` 和 `mai-specs/002-beta`，没有 `001-alpha`。回到 A 的原会话后，20:56 的结果仍是 `001-alpha`，没有变成 B 的列表。B 在 A 之前还有一次 20:54 的查询，结果同样只有 `002-beta`；上面的通过结论依据 A 之后的那一次。

### TC-05：查询不改动文件

- 关联需求：AC-05
- 前提与数据：使用 TC-01、TC-02 或 TC-03 的同一个已打开 Workspace。查询前记下 Workspace 根和 `mai-specs/` 的文件名称、存在性和内容。
- 操作步骤：
  1. 在该 Workspace 的当前对话中完成一次查询。
  2. 再次查看 Workspace 根和 `mai-specs/`。
- 预期结果：文件的内容、名称和存在性与查询前一致。对话里列出的路径都以 `mai-specs/` 开头，不以 `/` 开头，也不含 `..`。
- 验证方式与证据：人工比较查询前后的文件。TC-02、TC-03 没有列表时，确认对话中没有出现 `mai-specs/` 以外的项目路径。保留比较记录。
- 本次结果：通过，依据 TC-01。查询后 `tc01` 的目录名、文件名和 SHA-256 与查询前的 `tc01.before.txt` 一致。对话列出的路径都以 `mai-specs/` 开头，不以 `/` 开头，不含 `..`。`tc02`、`tc03`、`tc04a`、`tc04b`、`tc06` 的文件快照也与查询前一致。TC-03 对话另出现了绝对路径，该问题记在 TC-03，不把 TC-03 当作本条的通过依据。

### TC-06：Workspace 列表为空时不发起查询

- 关联需求：AC-06
- 前提与数据：DSH Web 的 Workspace 列表为空。没有当前、显式或最近 Workspace。准备一个含有合法 Feature 的目录，但它没有被打开成 Workspace。界面已经显示「默认工作区」时，不使用本用例。
- 操作步骤：
  1. 在空列表上使用现有 Web 入口新建会话，或请求列出 SDD Feature。
  2. 查看是否调用 `sessions.create`。
- 预期结果：不调用 `sessions.create`。没有待写入草稿时清空主视图；有待写入草稿时提示「请先选择工作区」。不出现 Feature 列表，不出现「未找到 Feature」，也不出现「当前项目没有 mai-specs/ 目录」。没有读取那个未打开目录的 `mai-specs/`。本功能不要求出现一句新的提示。
- 验证方式与证据：`packages/client/ui-workspace/tests/workspaces-service.client.spec.ts` 的两个空列表用例。
- 2026-11-22 记录：作废。当时首屏已经是「默认工作区」。在该入口新建会话后进入标题为 `default-workspace` 的会话，回合失败，界面显示 `working-directory: directory does not exist: "/Users/leishimin/Documents/deepseek-harness/default-workspace"`。该目录是已打开的默认 Workspace，不是空列表。准备好的 `tc06` 没有被打开，其文件快照与查询前一致。
- 本次结果：通过。空列表时新建会话不调用 `sessions.create`。无草稿时清空主视图；有待写入草稿时提示先选择工作区，并且不调用 `sessions.create`。默认工作区首屏不再作为本条证据。

## 待确认与补齐事项

- 本次 Web 通过本地 patch 加载功能，发布组合仍未包含它。
- 查询没有固定口令。本次实际输入是「列出当前项目的 SDD Feature」。
- PRD 仍把「名称匹配的软链接不计入」和「`mai-specs` 存在但不可读」标为待确认。这两项不作为本计划的通过条件，本次也未执行。
- 21:14 和 21:16 的复验里，TC-02、TC-03 的助手正文分别只有规定原句。该观察属于 DeepSeek-V4.1-Flash、推理等级 High。工具结果文本由测试保证。宿主不删除模型后来写下的句子。
- 2026-11-24 修订了 AC-06、CP-01、CP-02 和本计划。发布入口仍然不包含本插件。Phase 为 review。
- 启动、安装和测试命令写在仓库根 [README.md](../../../README.md) 的 Course assignment，以及 [插件 README](../../../packages/experimental/tool-sdd-workbench/README.md)。
- 文件指纹见下方「修订指纹」。本次没有新的模型对话，因此没有新的页面截图。2026-11-22 的页面结论仍以本节各用例文字为准。

## 修订指纹

2026-11-24 16:04（UTC+8），仓库根目录，退出码 0。

`pnpm exec vitest run packages/experimental/tool-sdd-workbench/tests/tool-sdd-workbench.spec.ts packages/session/working-directory/tests/working-directory.spec.ts`

2 个文件，30 通过，耗时 567ms。其中工具测试 9 项，`working-directory` 21 项。没有调用模型。

同一时刻另跑空列表入口：`packages/client/ui-workspace/tests/workspaces-service.client.spec.ts` 中「opens nothing when a New Session request has no Workspace to open」和「requests a Workspace without clearing the current selection when no Workspace is available」，2 项通过。

| 路径 | SHA-256 |
|---|---|
| `packages/experimental/tool-sdd-workbench/src/index.ts` | `0045bbf8cbe31436953f80e8c50d5a71d3c5b079da7660c0ba4ac73e99f78d30` |
| `packages/experimental/tool-sdd-workbench/tests/tool-sdd-workbench.spec.ts` | `094584a3b4ebe185d42048e2da72a9707fae99aeff8bcee50e5792c82a61e82b` |
| `packages/experimental/tool-sdd-workbench/README.md` | `53ac476fe232d3b30068676a46f83e8c4d3febac4c044f29698acd47ac9f484e` |
| `packages/experimental/tool-sdd-workbench/README.zh.md` | `015a92eaec52b92a41c56829f42ef282c0359b07e259d35a6d71fdabc0ab63a6` |
| `packages/experimental/tool-sdd-workbench/web.patch.yml` | `80d47dc2f9529f0aacc7c58b496ef4f76a8044fdbf454d47d16d2db40287923f` |
| `packages/session/working-directory/src/index.ts` | `d8ce9723a943ff4c0ecfe5dfdf172371b8eaa58f826a2a446228893bbe1b1069` |
| `README.md` | `bef98eee3053c736f4656f29fa98cb279988adbd6fd062326744ea55c5bdd146` |
| `README.zh.md` | `88d4b2a0e56d851cdc58c4b2dfc57d3dfa68b4c1a0e83b4e12a0a7bc6df5fce1` |
| `mai-specs/999-sdd-workbench/spec/PRD.md` | `bef75abf3f30bb1dbb64fd15e09d1d6383ea8025a5f11f83c39bf7ae49367cc6` |
| `mai-specs/999-sdd-workbench/design/TECH_DESIGN.md` | `b2309ca31d09150c834b2d513e268155fc215f4dcd1c30da428eee387de248ad` |
| `mai-specs/999-sdd-workbench/BRIEF.md` | `b041786b8a8dd11c0a5afd614bcffbd9a6bf37d6cca43bd0f1a5e3939079f374` |

`web.patch.yml` 和 `recorded` 的指纹与 2026-11-22 代码评审相同。`src/index.ts` 已变：非列表结果不再返回 `features`。渲染函数接受模式推断出的可选 `features`，宿主类型检查可以通过。
