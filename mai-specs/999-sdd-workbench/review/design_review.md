# 999 技术方案评审

> 评审对象：[design/TECH_DESIGN.md](../design/TECH_DESIGN.md) | 需求来源：[spec/PRD.md](../spec/PRD.md) | 代码基线：`5da1b68bc9` | 复评：2026-11-22

## 结论

**通过。** 可以进入测试规划。本结论替换首次评审的「需要修改」。PRD、技术方案、Phase 和 ROADMAP 未改。

复评范围是 FR-02、BR-03、AC-04 和 AC-06。方案已改成两个 Workspace 会话，并且未打开 Workspace 时不发起查询。文案「当前会话未打开项目」不再是产品结果。

## 复核

| 首次发现 | 复核 | 依据 |
| --- | --- | --- |
| P0：`recorded` 无法表示未打开 Workspace，且无 `meta.cwd` 会话不能证明 Web 入口 | 已解决 | PRD 用 AC-06 取代该文案。方案第 2.1.2 节写明 `startSession` 在没有 Workspace 时返回，不调用 `sessions.create`。源码仍是 `packages/client/ui-workspace/src/client/navigation.ts` 第 360–367 行：`target === undefined` 时提示「请先选择工作区」或清空主视图，然后 `return` |
| P0：AC-04 用 `workingDirectory.set` 测同一会话换目录 | 已解决 | PRD 的 AC-04 已改为打开另一个 Workspace 的会话。方案第 5 节的 AC-04 创建两个会话，明确不调用 `set`，并要求 Web 上打开 A、打开 B、回到 A。`openWorkspace` 仍经 `connectBlank` 到 `sessions.create({ workspaceId })`，再 `replaceMain`。见同文件第 306–330 行 |
| P1：子项列举没有点名不跟随链接的接口 | 已解决 | 方案第 2.3.1 节改为 `node:fs` 的 `readdir({ withFileTypes: true })`，并禁止 `listDir`、`resolve`、`stat` 和 `realpath` |

### AC-04

方案与 PRD 一致。A 的会话只产生 A 的 `tool/result`。打开 B 得到 B 的会话，该次结果只含 B。回到 A 时，A 的事件没有被第二次调用改写。宿主测试用两个带各自路径的会话；Web 人工步骤覆盖真实打开动作。`workingDirectory.set` 不作为验收。

### AC-06 与 BR-03

方案与 PRD 一致。查询只发生在已打开 Workspace 的会话中。没有 Workspace 时入口不创建会话，因此不调用工具，不读取 `mai-specs/`，也不新增文案。方案把空投影不读磁盘写成工具内部保护，并写明那不是 AC-06。

## 待实现时验证

- 运行中的 Web 尚未复测 `header.cwd` 是否等于 `workspace.path`。源码链路已经支持 AC-04 的设计，不阻塞方案。
- 通用工具卡片是否展示 `render` 文本。不改变查询来自哪个会话。
- `readdir({ withFileTypes: true })` 对目录链接是否只给出链接位。实现时用指向外部的链接确认。

## 可以延后

- `recorded` 对 AC-04 和 AC-06 不是必需的。已打开 Workspace 的会话头里已有路径，`get` 也会返回它。保留 `recorded` 只避免空投影落到启动目录。可以留到实现，不单独加产品行为。
- `execute` 骨架直接读取 `exec.agent.session`。Web 工具调用带有 Agent。缺 Agent 时会在空投影判断之前抛错，不产生已删除的文案。

## 测试规划

可以进入。还没有 `test/TEST_PLAN.md`。规划时应覆盖 AC-01 至 AC-06：AC-04 用两个 Workspace 会话，AC-06 断言现有入口没有调用 `sessions.create`，并且不把「当前会话未打开项目」写成预期结果。

## 首次评审

以下结论针对修订前的方案，已被上面的复核取代。

**需要修改。** 当时不能按该方案进入测试规划。

已打开 Workspace 时，Web 创建会话会把 `workspace.path` 写入会话头，`recorded(session)` 可以读到这个路径。AC-01 至 AC-03 的查询分支与这条路径一致。

两处验证口径不能进入测试规划：

- DA-3 用「没有 `meta.cwd` 的会话」证明不了 Web 入口。真实入口要么不创建会话，要么已经把目录写进会话头。`recorded` 无法认出后者是 `process.cwd()` 回退。
- AC-04 用 `workingDirectory.set` 证明的是同一会话换目录。Web 切换 Workspace 是打开另一个会话，不修改原会话的 cwd。

AC-05 的分支本身能分开「不存在」和「读取失败」，也能在 `lstat` 看到软链接后停住。方案写的 `readdir` 不是 `ctx.fs` 的方法；若实现改用 `listDir`，子链接会被跟随。这要在方案里写死调用，再规划测试。

本评审不改 PRD、技术方案、Phase 和 ROADMAP。

## 已核对且可保留

- 有 Workspace 时的来源可靠。`createInWorkspace` 只调用 `sessions.create({ workspaceId })`。Host 取 `workspace.path`，`createAgent` 把它写入 `meta.cwd`。投影初始值是 `header.cwd`。`recorded` 返回该值，不会再套一层 `defaultDirectory`。
- 不改 `get`、`ensure` 和 `SessionCommandController.create`。现有调用方行为不变。
- AC-01 至 AC-03 的排序、跳过项和两句 PRD 文案有对应分支。
- `tool/result` 按次追加。后一次调用不回写前一次 payload。这只证明日志不改写，不证明 Web 的切换手势。

## 发现

### P0：`recorded` 认不出 Web 未打开 Workspace 时的启动目录

**影响：** DA-3 要求没有 workspace 根时提示「当前会话未打开项目」，并且不得用进程启动目录代替。按当前方案实现后，Web 上不会出现这句提示。若有调用方不带 Workspace 创建会话，工具会去读启动目录下的 `mai-specs/`。方案里的无 `meta.cwd` 测试只能证明投影可以为空，不能证明真实入口。

**源码依据：**

- Web 没有 Workspace 时不创建会话。`UiWorkspaceService.startSession` 在当前、显式和最近 Workspace 都没有时直接返回：有草稿则提示「请先选择工作区」，否则清空主视图。两条都不调用 `sessions.create`，因此不会调用工具。见 `packages/client/ui-workspace/src/client/navigation.ts` 第 360–367 行。
- Web 有 Workspace 时，`createNamed` 只传 `workspaceId`。见同文件第 254–271 行。客户端组包也不会再附带 cwd。见 `packages/api/session-controller/src/client/sessions/manager.ts` 第 502–505 行。
- Host 在没有 Workspace、也没有请求 cwd 时使用构造时传入的 `defaultCwd`。生产构造传入 `process.cwd()`。见 `packages/api/session-controller/src/commands.ts` 第 133 行，`packages/api/session-controller/src/index.ts` 第 167 行。既有测试 `creates in the default cwd...` 已证明 `create({})` 会把该缺省目录交给创建逻辑。见 `packages/api/session-controller/tests/commands-create-fork.host.spec.ts` 第 63–75 行。
- `createAgent` 总是 `mkdir` 后把规范路径写入 `meta.cwd`。见 `packages/api/session-controller/src/agent.ts` 第 437–449 行。投影 `init` 使用 `header.cwd ?? null`。头里已经有路径时，`recorded` 返回的是字符串，不是 `null`。
- 即使人为造出空投影，正常回合组装系统提示时会调用 `ensure`。投影为 `null` 时，`ensure` 把 `get()` 的结果写进 `workspace-root/change`，而 `get()` 在空投影时返回 `defaultDirectory`，缺省仍是 `process.cwd()`。见 `packages/session/working-directory/src/index.ts` 第 105、128–131、155–157、176–178 行。工具执行发生在这之后。

**对应：** DA-3。不改变 AC-01 至 AC-03 在已打开 Workspace 上的行为。

**最小修正：**

- 保留 `recorded`，只用来避免工具自己再调用 `get` 或 `ensure`。不要修改 `SessionCommandController.create`、`get` 或 `ensure`。改缺省 cwd 会影响所有不传 Workspace 的创建方，包括现有 CLI 和 SDK；改 `ensure` 会改变每个回合的目录恢复。
- 方案删掉「用无 `meta.cwd` 会话验收 DA-3」。写明 Web 未打开 Workspace 时没有会话、也没有这次工具调用；已有提示是 Workspace 的「请先选择工作区」，不是本工具的结果。
- 不要用「路径等于 `process.cwd()`」判断未打开项目。用户可以正是打开了进程启动目录。

### P0：AC-04 的 `set` 不是 Web 切换 Workspace

**影响：** 按方案测试会通过，但用户在 Web 里切换 Workspace 后，看不到「同一条对话里先是 A、再查出 B」。新查询发生在另一个会话。把 `set` 写成 AC-04 的验收，会把错误手势写进测试计划。

**源码依据：**

- `openWorkspace` 调用 `connectBlank`，再 `sessions.create({ workspaceId })`，然后 `replaceMain` 切换当前显示的会话。见 `navigation.ts` 第 306–330 行和第 244–258 行。
- 这次创建给新会话写入的是目标 Workspace 的路径。原会话的 `header.cwd` 和已有 `tool/result` 都不修改。
- 客户端和生产 Host 都没有把 `workingDirectory.set` 暴露给 Web 会话操作。`set` 的调用方是子代理、SDK、worktree 和测试。它追加 `workspace-root/change`，并注入一条目录已变更的消息。见 `packages/session/working-directory/src/index.ts` 第 204–210、233–238 行。

**`set` 实际证明的：** 同一会话下一次工具调用读到新路径；第一次 `tool/result` 的 payload 还在。它不证明用户点了另一个 Workspace。

**真实 Web 操作能证明的：**

1. 在 Workspace A 的对话里查询，结果只含 A。
2. 打开 Workspace B。主视图变为 B 的会话，而不是仍停在 A 的对话里。
3. 在 B 的当前对话查询，结果只含 B。
4. 再打开原来的 A 会话，A 的结果仍是当时的列表，日志里没有 B 的 Feature。

这满足「新查询来自 B」和「A 的历史保留」，但是两条会话。它不满足 AC-04 写的「同一条对话」和「该会话的 workspace 根切换」。

**对应：** FR-02、AC-04、BR-03。产品要求同一会话换根；Web 手势是换会话。二者冲突，需负责人选择，本评审不改 PRD。

**最小修正：** 方案把两种证据分开写。`set` 只作为同一会话投影的宿主测试。Web 人工步骤按上面的打开 Workspace 写。若产品坚持同一条对话换根，那是新增 Web 操作，当前界面没有这个动作，不应算进本次可规划的测试。

### P1：AC-05 的停住条件成立，但方案点名的列举接口不存在

**影响：** `mai-specs` 自身是软链接时，按方案先 `lstat`、类型不是目录就返回，不会列举目标，这条边界成立。直属子项若改用 `ctx.fs.listDir`，链接目标会被 `realpath` 和 `stat` 碰到，名称匹配的目录链接会被当成 Feature。AC-05 和 BR-01 同时失败。

**源码依据：**

- `FileSystem.lstat` 不跟随最后一层链接。本地实现调用 `probeNoFollow`，即 `node:fs` 的 `lstat`。软链接类型来自 `isSymbolicLink()`。不存在和父级不是目录都返回 `undefined`；其他 IO 错误抛出。见 `packages/fs/fs/src/index.ts` 第 200–214 行，`packages/fs/fs-local/src/index.ts` 第 180–187 行，`packages/fs/fs-local/src/fsio.ts` 第 238–255、274–287 行。
- `ctx.fs` 没有返回 `Dirent` 的 `readdir`。`listDir` 对每个子项 `resolveLocalTarget`，而该方法对存在的路径做 `realpath`；分类再用 `stat`。见 `fsio.ts` 第 179–184、305–336 行。`FsDirEntry.type` 也没有 `symlink`。见 `packages/fs/fs/src/types.ts` 第 104–108 行。
- 方案第 2.3.1 节写的是 `readdir(..., { withFileTypes: true })`。这是 Node 的目录项接口，不是注入的 `ctx.fs`。

**读取范围：**

| 步骤 | 实际读取 | 是否碰到链接目标 |
| --- | --- | --- |
| `lstat('mai-specs', { cwd: root })` | 只取该路径最后一层的类型 | 否。软链接停在链接本身 |
| 类型不是 `directory`，或 `lstat` 抛错 | 不再调用 `resolve`、`listDir`、`readdir` | 否 |
| 真实目录上的 `readdir({ withFileTypes: true })` | 只读 `mai-specs` 这一层的名字和目录项类型 | 否。目录项的链接位来自 `lstat` 语义，`isSymbolicLink()` 为真时不能再 `stat` 或 `realpath` |
| `listDir` 或 `resolve` | 会 `realpath` 子项 | 是。不能用于本工具 |

**缺失与失败没有被方案写成同一结果：** `lstat` 得到 `undefined` 是 `missing`，文案是「当前项目没有 mai-specs/ 目录」。抛错、以及类型为 `symlink`、`file`、`other`，是 `unreadable`，文案是「无法读取当前项目的 mai-specs/」。真实目录没有合法子目录是 `empty`。三者分开。

有一个窄例外：`probeNoFollow` 把 `ENOTDIR` 也变成 `undefined`。Workspace 根本身不是目录时，会显示成「没有 mai-specs/」。Web 打开的根是 Workspace 目录，正常查询不会走到这里。

**对应：** AC-05、DA-1、DA-2、BR-01。

**最小修正：** 方案写明子项只用 `node:fs` 的 `readdir({ withFileTypes: true })`，并且禁止 `ctx.fs.listDir`、`resolve` 和 `stat`。跳过 `isSymbolicLink()` 为真的子项，不读取链接文本，不计算 realpath。相对路径仍写 `mai-specs/<name>`。

**验证：** 桩或包装记录调用。`mai-specs` 指向外部目录时，只有一次 `lstat`，结果是 `unreadable`，记录中没有目标里的 Feature 名。真实 `mai-specs` 里放一个指向外部的合规目录链接时，结果不包含它，记录里没有该目标的 `realpath`、`stat` 或文件读取。另外用「没有该路径」得到 `missing`，用去掉读权限的真实目录得到 `unreadable`，确认两句文案不同。

## 可以延后

- 通用工具卡片是否展示 `render` 文本。实现后用一次 Web 查询确认即可，不改变查询来源。
- `ENOTDIR` 被显示成缺目录。当前 Web 根是目录，不单独加文案。

## 保持现状

- 不把插件放进已发布 Web preset。
- 不新增会话事件类型。
- 不改 `get`、`ensure`、`set` 的现有语义。
- AC-01 至 AC-03 的文案和排序规则。

## 首次评审时的测试规划

当时不能进入。方案先按上面两项 P0 改验证口径，并写明 AC-05 使用的列举接口。AC-04 的「同一条对话」还是「Web 打开另一个 Workspace」需要负责人选择。

选择之后，可以规划 AC-01、AC-02、AC-03 和修正后的 AC-05。DA-3 不作为 Web 工具结果规划，除非产品决定新增一种 Web 今天没有的会话。
