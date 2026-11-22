import { chmod, mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { afterEach, describe, expect, it } from 'vitest'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { mountAgentLoopTestDependencies, mountAgentLoopTestHarness } from '@deepseek-ai/dsh-agent-loop-testkit'
import { brandString } from '@deepseek-ai/dsh-brand'
import LocalFileSystem from '@deepseek-ai/dsh-fs-local'
import type { ToolCallId } from '@deepseek-ai/dsh-llm/types'
import type { Session, SessionId } from '@deepseek-ai/dsh-session'
import { executeToolFixture } from '@deepseek-ai/dsh-tool-testkit'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import WorkingDirectory from '@deepseek-ai/dsh-working-directory'
import * as tool from '../src/index.ts'

const signal = new AbortController().signal
const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

async function tempRoot(name: string): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), `dsh-sdd-${name}-`)))
  roots.push(root)
  return root
}

async function setup(home: string): Promise<{ ctx: Context; harness: Awaited<ReturnType<typeof mountAgentLoopTestHarness>> }> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx, { systemPrompt: { includeRuntimeContext: false } })
  await ctx.plugin(LocalFileSystem, { cwd: home })
  await ctx.plugin(WorkingDirectory)
  await ctx.plugin(tool)
  const harness = await mountAgentLoopTestHarness(ctx)
  return { ctx, harness }
}

let calls = 0
function call(ctx: Context, agent: Agent | undefined): Promise<ToolExecutionResult> {
  return executeToolFixture(ctx, {
    signal,
    callId: brandString<ToolCallId>(`sdd-${++calls}`),
    name: 'sdd_list_features',
    arguments: {},
    ...agent === undefined ? {} : { agent },
  })
}

function text(result: ToolExecutionResult): string {
  return result.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

function agentFor(session: Session): Agent {
  return { id: session.id, session } as Agent
}

describe('sdd_list_features', () => {
  it('lists legal Feature directories in numeric order and skips the rest', async () => {
    const root = await tempRoot('list')
    const specs = join(root, 'mai-specs')
    await mkdir(specs)
    for (const name of ['010-beta', '001-beta', '001-alpha', '002-gamma', '_templates', 'notes', '001-' + 'a'.repeat(65)]) {
      await mkdir(join(specs, name))
    }
    await writeFile(join(specs, 'README.md'), 'readme')
    await writeFile(join(specs, 'ROADMAP.md'), 'roadmap')
    const outside = await tempRoot('outside')
    await mkdir(join(outside, '001-secret'))
    await symlink(outside, join(specs, '003-link'), 'dir')

    const { ctx, harness } = await setup(root)
    const agent = await harness.create(brandString<SessionId>('listed'), {}, { cwd: root })
    const result = await call(ctx, agent)

    expect(result.isError).toBe(false)
    if (result.isError) return
    expect(result.value).toEqual({
      status: 'list',
      features: [
        { name: '001-alpha', path: 'mai-specs/001-alpha' },
        { name: '001-beta', path: 'mai-specs/001-beta' },
        { name: '002-gamma', path: 'mai-specs/002-gamma' },
        { name: '010-beta', path: 'mai-specs/010-beta' },
      ],
    })
    expect(text(result)).toBe([
      '001-alpha',
      'mai-specs/001-alpha',
      '001-beta',
      'mai-specs/001-beta',
      '002-gamma',
      'mai-specs/002-gamma',
      '010-beta',
      'mai-specs/010-beta',
    ].join('\n'))
    expect(text(result)).not.toContain('_templates')
    expect(text(result)).not.toContain('README.md')
    expect(text(result)).not.toContain('ROADMAP.md')
    expect(text(result)).not.toContain('notes')
    expect(text(result)).not.toContain('003-link')
    expect(text(result)).not.toContain('001-secret')
    expect(text(result)).not.toContain('未找到 Feature')
    expect(text(result)).not.toContain('当前项目没有 mai-specs/ 目录')
    await ctx.fiber.dispose()
  })

  it('says no Feature was found when the directory has no legal child', async () => {
    const root = await tempRoot('empty')
    const specs = join(root, 'mai-specs')
    await mkdir(specs)
    await mkdir(join(specs, '_templates'))
    await writeFile(join(specs, 'README.md'), 'readme')
    await writeFile(join(specs, 'ROADMAP.md'), 'roadmap')
    await mkdir(join(specs, 'not-a-feature'))

    const { ctx, harness } = await setup(root)
    const agent = await harness.create(brandString<SessionId>('empty'), {}, { cwd: root })
    const result = await call(ctx, agent)

    expect(result.isError).toBe(false)
    if (result.isError) return
    expect(result.value).toEqual({ status: 'empty', features: [] })
    expect(text(result)).toBe('未找到 Feature')
    await ctx.fiber.dispose()
  })

  it('says the directory is absent when mai-specs does not exist', async () => {
    const root = await tempRoot('missing')
    const { ctx, harness } = await setup(root)
    const agent = await harness.create(brandString<SessionId>('missing'), {}, { cwd: root })
    const result = await call(ctx, agent)

    expect(result.isError).toBe(false)
    if (result.isError) return
    expect(result.value).toEqual({ status: 'missing', features: [] })
    expect(text(result)).toBe('当前项目没有 mai-specs/ 目录')
    await ctx.fiber.dispose()
  })

  it('keeps each Workspace session on its own result', async () => {
    const rootA = await tempRoot('workspace-a')
    const rootB = await tempRoot('workspace-b')
    await mkdir(join(rootA, 'mai-specs', '001-alpha'), { recursive: true })
    await mkdir(join(rootB, 'mai-specs', '002-beta'), { recursive: true })
    const { ctx, harness } = await setup(rootA)
    const agentA = await harness.create(brandString<SessionId>('session-a'), {}, { cwd: rootA })
    const agentB = await harness.create(brandString<SessionId>('session-b'), {}, { cwd: rootB })

    const first = await call(ctx, agentA)
    const afterA = agentA.session.snapshotEvents()
    const second = await call(ctx, agentB)

    expect(text(first)).toContain('001-alpha')
    expect(text(first)).not.toContain('002-beta')
    expect(text(second)).toContain('002-beta')
    expect(text(second)).not.toContain('001-alpha')
    expect(agentA.session.snapshotEvents()).toEqual(afterA)
    await ctx.fiber.dispose()
  })

  it('does not follow a symlink mai-specs or change the workspace', async () => {
    const root = await tempRoot('link-root')
    const outside = await tempRoot('link-target')
    await mkdir(join(outside, '001-secret'))
    await writeFile(join(root, 'keep.txt'), 'before')
    await symlink(outside, join(root, 'mai-specs'), 'dir')
    const { ctx, harness } = await setup(root)
    const agent = await harness.create(brandString<SessionId>('linked'), {}, { cwd: root })
    const result = await call(ctx, agent)

    expect(result.isError).toBe(false)
    if (result.isError) return
    expect(result.value).toEqual({ status: 'unreadable', features: [] })
    expect(text(result)).toBe('无法读取当前项目的 mai-specs/')
    expect(text(result)).not.toContain('001-secret')
    expect(await import('node:fs/promises').then(fs => fs.readFile(join(root, 'keep.txt'), 'utf8'))).toBe('before')
    await ctx.fiber.dispose()
  })

  it('reports an unreadable directory when listing its children fails', async () => {
    const root = await tempRoot('denied')
    const specs = join(root, 'mai-specs')
    await mkdir(specs)
    await chmod(specs, 0o000)
    try {
      const { ctx, harness } = await setup(root)
      const agent = await harness.create(brandString<SessionId>('denied'), {}, { cwd: root })
      const result = await call(ctx, agent)
      expect(result.isError).toBe(false)
      if (result.isError) return
      expect(result.value).toEqual({ status: 'unreadable', features: [] })
      expect(text(result)).toBe('无法读取当前项目的 mai-specs/')
      await ctx.fiber.dispose()
    } finally {
      await chmod(specs, 0o755)
    }
  })

  it('rejects a session that has no recorded workspace without the removed sentence', async () => {
    const root = await tempRoot('none')
    const { ctx } = await setup(root)
    const session = ctx.sessions.create(brandString<SessionId>('no-workspace'))
    const result = await call(ctx, agentFor(session))

    expect(result.isError).toBe(true)
    if (!result.isError) return
    expect(text(result)).toContain('no recorded workspace')
    expect(text(result)).not.toContain('当前会话未打开项目')
    await ctx.fiber.dispose()
  })

  it('rejects a call that has no session', async () => {
    const root = await tempRoot('no-agent')
    const { ctx } = await setup(root)
    const result = await call(ctx, undefined)

    expect(result.isError).toBe(true)
    if (!result.isError) return
    expect(result.error.info).toEqual({ name: 'ToolContextUnavailableError', code: 'TOOL_CONTEXT_UNAVAILABLE' })
    expect(text(result)).not.toContain('当前会话未打开项目')
    await ctx.fiber.dispose()
  })

  it('unregisters when the plugin fiber is disposed and keeps the loader exports', async () => {
    const root = await tempRoot('shape')
    const ctx = new Context()
    await mountAgentLoopTestDependencies(ctx, { systemPrompt: { includeRuntimeContext: false } })
    await ctx.plugin(LocalFileSystem, { cwd: root })
    await ctx.plugin(WorkingDirectory)
    const fiber = await ctx.plugin(tool)
    const description = ctx.tools.get('sdd_list_features')?.description ?? ''
    expect(description).toContain('未找到 Feature')
    expect(description).toContain('当前项目没有 mai-specs/ 目录')
    expect(description).toContain('that text alone')
    expect(ctx.tools.get('sdd_list_features')?.isConcurrencySafe?.({})).toBe(true)
    await fiber.dispose()
    expect(ctx.tools.get('sdd_list_features')).toBeUndefined()
    expect('default' in tool).toBe(false)
    const loader = Object.create(Loader.prototype) as Loader
    expect(loader.unwrapExports(tool)).toBe(tool)
    await ctx.fiber.dispose()
  })
})
