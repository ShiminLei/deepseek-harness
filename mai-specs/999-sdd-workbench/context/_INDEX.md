# 素材索引 — 999

| 文件 | 类型 | 来源与原名 | 关键内容摘要 | 收集日期 | 派生自 |
|---|---|---|---|---|---|


## 关键发现

- 第一版只做只读 Feature 导航，不编辑规格。
- 从当前项目的 mai-specs/ 识别 Feature，展示目录名和项目相对路径。
- 有多个 Feature 时按编号排序列出。
- mai-specs/ 存在但没有 Feature 时提示「未找到 Feature」。
- mai-specs/ 不存在时提示「当前项目没有 mai-specs/ 目录」。

## 开放问题

- Feature 目录如何判定：只认 NNN-slug，还是 mai-specs/ 下除 README、ROADMAP、_templates 之外的目录都算？
- 导航列表出现在 DSH Web 的哪个位置？
- 「当前项目」是否就是 DSH 当前打开的 workspace 根目录？
