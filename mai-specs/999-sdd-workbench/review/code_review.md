# 999 代码评审

> 比较基线：HEAD `5da1b68bc92776a7b8bef37a61b94261f80a34f0`，加上当前工作区。本次范围是 [spec/PRD.md](../spec/PRD.md) 的 AC-02、AC-03，以及 2026-11-22 21:14–21:16 的 Web 复验。设计见 [design/TECH_DESIGN.md](../design/TECH_DESIGN.md)。TC-06 不在本次范围。本评审不改源码、测试、Phase 或 ROADMAP。

## 总体结论

本次范围建议合并。`empty` 和 `missing` 的工具结果分别是「未找到 Feature」和「当前项目没有 mai-specs/ 目录」。21:14、21:16 的新会话里，助手正文也只有这两句，轨迹只有 `sdd_list_features`。没有新的 P0 或 P1。

上一轮「先完成 TC-02、TC-03 页面观察」的条件已经由这次复验关闭。TC-06 仍失败，发布入口没有改；该条不在本次范围，不作为本次阻断。

## 范围与证据

工作区相对 HEAD 的相关文件：

| 路径 | 状态 | SHA-256 |
|---|---|---|
| `packages/experimental/tool-sdd-workbench/src/index.ts` | 未跟踪 | `b7913cc33488e5c5f9c7403cd1c895b53934e9fa9e509b4b48587a421062c586` |
| `packages/experimental/tool-sdd-workbench/tests/tool-sdd-workbench.spec.ts` | 未跟踪 | `dbd5bd1d820cba9dde6b955330c45ff913590e52b144da130d8a5d8779bfb625` |
| `packages/experimental/tool-sdd-workbench/README.md` | 未跟踪 | `009a0a7088296d1a7fe2e686626a3c30ca2757d094c9a8fa6bce53056e3e4c57` |
| `packages/experimental/tool-sdd-workbench/README.zh.md` | 未跟踪 | `e78462b085922e9ceea4142e568e85a7fc5d7e77b69087569ed1a4ea16231fe3` |
| `packages/experimental/tool-sdd-workbench/web.patch.yml` | 未跟踪 | `80d47dc2f9529f0aacc7c58b496ef4f76a8044fdbf454d47d16d2db40287923f` |
| `packages/session/working-directory/src/index.ts` | 已修改，只增加 `recorded` | `d8ce9723a943ff4c0ecfe5dfdf172371b8eaa58f826a2a446228893bbe1b1069` |

`src/index.ts` 的指纹相对上一轮评审已变，因为工具描述增加了原句回复约束。`web.patch.yml` 和 `recorded` 的指纹没有变。`packages/bundle` 中没有 `sdd_list_features` 或 `tool-sdd-workbench`。

本次执行，工作目录为仓库根，退出码 0：

`pnpm exec vitest run packages/experimental/tool-sdd-workbench/tests/tool-sdd-workbench.spec.ts`

结果：1 个文件，9 通过。开始时间 21:19:31，耗时 579ms。

| AC | 实现 | 证据 | 未覆盖 |
|---|---|---|---|
| AC-02 | `empty` 的 `output.render` 是「未找到 Feature」。描述要求模型在结果正好是这句时只回复这句 | 工具测试第 125–126 行整句相等。Web：21:14，`tc02` 新会话，助手正文只有这一句，轨迹只有 `sdd_list_features` | 其他模型。宿主不删除模型后来写下的句子 |
| AC-03 | `lstat` 为 `undefined` 时渲染「当前项目没有 mai-specs/ 目录」。描述对这句有同样的回复约束 | 工具测试第 138–139 行整句相等。Web：21:16，`tc03` 新会话，助手正文只有这一句，轨迹只有 `sdd_list_features` | 同上 |

页面证据来自 [test/TEST_PLAN.md](../test/TEST_PLAN.md)。复验前的 20:59 和 21:01 记录了模型在原句之外追加说明；那两次已作废。本次审查没有重跑 TC-01、TC-04、TC-05，也没有重跑 TC-06。

## 关键发现

没有 P0 或 P1。

### P2：非列表结果也带上了空的 `features`

设计 [TECH_DESIGN.md](../design/TECH_DESIGN.md) 第 67 行写明 `features` 只在 `list` 时出现。实现在 `packages/experimental/tool-sdd-workbench/src/index.ts` 第 60、61、68、73 行对其他状态返回 `features: []`，第 98–101 行把该字段标成必填。

触发条件是 `missing`、`empty` 或 `unreadable`。模型看到的 `output.render` 仍是规定整句，21:14 和 21:16 的助手正文不受这个字段影响。这是上一轮已记录的设计偏差，本次复核后仍然成立，不阻断。

最小修复：模式里去掉 `features` 的 `required`，非 `list` 不返回该字段，并改对应断言。复验同一工具测试。

### P2：规定原句由模型遵守描述，宿主不截断后续正文

`src/index.ts` 第 84–90 行要求：结果文本正好是「未找到 Feature」或「当前项目没有 mai-specs/ 目录」时，给用户的回复只有这句。`README.md` 与 `README.zh.md` 第 42 行写了同一规则。测试第 235–237 行只断言描述包含这两句和 `that text alone`。

折叠的工具行不把 `output.render` 当作对话正文。用户看到的是模型之后写下的助手消息。20:59 和 21:01，模型在原句外追加了说明。描述收紧并重启 Web 后，21:14 和 21:16 的新会话没有追加。这是本次新增的模型侧约束，不阻断，因为规定的页面核对已经通过。

若同模型在新会话里再次追加句子，再改为由展示层只呈现 `output.render` 的整句。本次不改发布入口。

## 待验证事项

没有影响本次 AC-02、AC-03 合并判断的未执行检查。

TC-06 仍是整功能的未通过项。本次按授权不审查、不复验它。

## 其他建议

没有超出上面两条 P2 的改动建议。
