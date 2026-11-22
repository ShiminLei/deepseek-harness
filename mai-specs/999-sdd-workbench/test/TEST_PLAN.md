# 业务测试计划

[返回需求简报](../BRIEF.md)

预期来自 [spec/PRD.md](../spec/PRD.md) 的 AC-01 至 AC-06。2026-11-22 20:51–21:02（UTC+8）在本地 DSH Web 执行了 TC-01 至 TC-06。21:14–21:16 用同一启动命令复验了 TC-02 和 TC-03。界面版本是 `0.2.3-alpha.1-5da1b68-dirty`，基线 HEAD 为 `5da1b68`，工作区含未提交的 `sdd_list_features` 实现。启动命令是 `pnpm dsh web --patch packages/experimental/tool-sdd-workbench/web.patch.yml --patch apps/web/tests/pin-browse-picker.overlay.yml --host 127.0.0.1 --port 4173 --no-open`。模型是 DeepSeek-V4.1-Flash，推理等级 High。数据在 `/tmp/dsh-sdd-accept-tkdI` 的 `tc01`、`tc02`、`tc03`、`tc04a`、`tc04b`、`tc06`。

本次范围未通过。TC-01、TC-02、TC-03、TC-04、TC-05 通过。TC-06 失败。

## 范围与依据

在 DSH Web 已打开 Workspace 的当前对话中，只读看到该会话 workspace 根下的 Feature 目录名和相对路径。打开另一个 Workspace 后，在那个 Workspace 的会话里查询，原会话的结果保留。没有已打开的 Workspace 时，现有入口不发起查询。

不验收：编辑 Feature、固定查询口令、独立页面、未打开 Workspace 时的新文案，以及在同一会话内把 workspace 根改成另一个 Workspace。

## 已有测试覆盖

| 需求 / 业务行为 | 已有测试或入口 | 覆盖范围及结果依据 | 仍需补验的部分 |
|---|---|---|---|
| AC-01 至 AC-06 | `packages/experimental/tool-sdd-workbench/tests/tool-sdd-workbench.spec.ts` | 开发测试覆盖工具返回、排序、空目录、缺目录、两个会话和软链接不跟随。它不能代替本次 Web 对话观察 | 本次 Web 结果见各用例 |
| 未打开 Workspace 不发起查询 | `packages/client/ui-workspace/tests/workspaces-service.client.spec.ts` 中无 Workspace 时不调用 `sessions.create` 的用例 | 只覆盖客户端服务调用，不覆盖本次 Web 首屏 | TC-06 |

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
- 预期结果：同一条对话显示整句「未找到 Feature」。不显示 Feature 列表，也不再追加别的句子。
- 验证方式与证据：人工核对当前对话文案。保留截图。
- 本次结果：通过。21:14，工作区 `tc02` 的新会话，输入「列出当前项目的 SDD Feature」。轨迹只有 `sdd_list_features`。助手回复的正文只有「未找到 Feature」。20:59 那次失败已作废：当时同一条对话在原句之外追加了说明、被跳过的名称和新建提议。

### TC-03：没有 mai-specs

- 关联需求：AC-03
- 前提与数据：DSH Web 已打开一个 Workspace。该 Workspace 根下没有 `mai-specs/`。
- 操作步骤：
  1. 打开该 Workspace 的当前对话。
  2. 请求列出当前项目的 SDD Feature。
- 预期结果：同一条对话显示整句「当前项目没有 mai-specs/ 目录」。不显示 Feature 列表，也不再追加别的句子。
- 验证方式与证据：人工核对当前对话文案。保留截图。
- 本次结果：通过。21:16，工作区 `tc03` 的新会话，输入「列出当前项目的 SDD Feature」。轨迹只有 `sdd_list_features`。助手回复的正文只有「当前项目没有 mai-specs/ 目录」。21:01 那次失败已作废：当时同一条对话在原句之外追加了原因，并写出绝对路径 `/private/tmp/dsh-sdd-accept-tkdI/tc03`。

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

### TC-06：未打开 Workspace 时不发起查询

- 关联需求：AC-06
- 前提与数据：DSH Web 没有已打开的 Workspace。准备一个含有合法 Feature 的目录，但它没有被打开成 Workspace。
- 操作步骤：
  1. 使用现有 Web 入口准备对话，或请求列出 SDD Feature。
  2. 查看当前界面。
- 预期结果：不发起这次查询。不出现 Feature 列表，不出现「未找到 Feature」，也不出现「当前项目没有 mai-specs/ 目录」。没有读取那个未打开目录的 `mai-specs/`。本功能不要求出现一句新的提示。
- 验证方式与证据：人工在未打开 Workspace 时使用现有入口，确认没有产生本次查询结果。保留界面记录。
- 本次结果：失败。打开 Web 后首屏已经是「默认工作区」，没有出现未打开 Workspace 的界面。在该入口新建会话并发送「列出当前项目的 SDD Feature」后，进入标题为 `default-workspace` 的会话并开始一轮。该轮失败，界面显示 `working-directory: directory does not exist: "/Users/leishimin/Documents/deepseek-harness/default-workspace"`。没有 Feature 列表，没有「未找到 Feature」，也没有「当前项目没有 mai-specs/ 目录」。准备好的 `tc06` 没有被打开，其文件快照与查询前一致。已观察到的入口发起了回合，因此不满足「不发起这次查询」。

## 待确认与补齐事项

- 本次 Web 通过本地 patch 加载功能，发布组合仍未包含它。
- 查询没有固定口令。本次实际输入是「列出当前项目的 SDD Feature」。
- PRD 仍把「名称匹配的软链接不计入」和「`mai-specs` 存在但不可读」标为待确认。这两项不作为本计划的通过条件，本次也未执行。
- 21:14 和 21:16 的复验里，TC-02、TC-03 的助手正文分别只有规定原句。TC-06 仍失败，发布入口没有改。
- Phase 仍是 draft。本次改了工具描述和本计划的结果记录，没有改需求或 ROADMAP。
