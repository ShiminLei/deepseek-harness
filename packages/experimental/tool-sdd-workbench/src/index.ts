/**
 * Read-only model tool that lists SDD Feature directories under the calling session's workspace.
 * @module @deepseek-ai/dsh-tool-sdd-workbench
 */

import type {} from '@deepseek-ai/dsh-fs'
import type {} from '@deepseek-ai/dsh-working-directory'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { defineTool, ToolContextUnavailableError } from '@deepseek-ai/dsh-tools'

/** Cordis plugin name. */
export const name = 'tool-sdd-workbench'
/** Tool registry, filesystem, and the session's recorded workspace. */
export const inject = ['tools', 'fs', 'workingDirectory']

const FEATURE_NAME = /^[0-9]{3}-[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const SLUG_MAX = 64
const MISSING = '当前项目没有 mai-specs/ 目录'
const EMPTY = '未找到 Feature'
const UNREADABLE = '无法读取当前项目的 mai-specs/'

/** One listed Feature directory. */
interface FeatureEntry {
  name: string
  path: string
}

/** Canonical tool value. `features` is present only when `status` is `list`. */
type ListResult =
  | { status: 'list'; features: FeatureEntry[] }
  | { status: 'missing' | 'empty' | 'unreadable' }

/** Whether `name` is a direct `NNN-slug` Feature directory name. */
function isFeatureName(featureName: string): boolean {
  return FEATURE_NAME.test(featureName) && featureName.slice(4).length <= SLUG_MAX
}

/**
 * Model-facing text for one query result.
 * The tool schema leaves `features` optional, so a list reads that array only after `status` is `list`.
 * @param value - validated tool result. Non-list statuses omit `features`.
 * @returns the text shown for this result.
 */
function renderText(value: { status: ListResult['status']; features?: FeatureEntry[] }): string {
  if (value.status === 'list') return (value.features ?? []).flatMap(feature => [feature.name, feature.path]).join('\n')
  if (value.status === 'missing') return MISSING
  if (value.status === 'empty') return EMPTY
  return UNREADABLE
}

/**
 * List legal Feature directories under `root/mai-specs`.
 * @param fs - filesystem used to classify `mai-specs` without following a final symlink.
 * @param root - absolute workspace root recorded for this call.
 * @param signal - cancellation for the classification.
 * @returns the query result. A thrown read becomes unreadable.
 */
async function listFeatures(fs: Context['fs'], root: string, signal: AbortSignal): Promise<ListResult> {
  try {
    const info = await fs.lstat('mai-specs', { cwd: root }, signal)
    if (info === undefined) return { status: 'missing' }
    if (info.type !== 'directory') return { status: 'unreadable' }
    const entries = await readdir(join(root, 'mai-specs'), { withFileTypes: true })
    const features = entries.flatMap((entry): FeatureEntry[] => {
      if (entry.isSymbolicLink() || !entry.isDirectory() || !isFeatureName(entry.name)) return []
      return [{ name: entry.name, path: `mai-specs/${entry.name}` }]
    })
    features.sort((left, right) => Number(left.name.slice(0, 3)) - Number(right.name.slice(0, 3)) || left.name.localeCompare(right.name))
    if (features.length === 0) return { status: 'empty' }
    return { status: 'list', features }
  } catch (error: unknown) {
    // lstat reports a missing path as undefined. A thrown read is the unreadable result.
    void error
    return { status: 'unreadable' }
  }
}

/**
 * Register `sdd_list_features`. The tool reads only the workspace recorded for the calling session.
 * @param ctx - context carrying the tool registry, filesystem, and working-directory service.
 */
export function apply(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'sdd_list_features',
    description:
      'List the SDD Feature directories in the current project\'s mai-specs folder. '
      + 'Each item shows the directory name and its project-relative path. '
      + 'The list is read from the workspace recorded for this session. '
      + 'Call this tool before writing any text. '
      + 'When the result text is exactly "未找到 Feature" or "当前项目没有 mai-specs/ 目录", '
      + 'the reply to the user is that text alone: do not add a sentence, do not call another tool, and do not offer to create a directory.',
    parameters: {},
    isConcurrencySafe: () => true,
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          status: { type: 'string', required: true, enum: ['list', 'missing', 'empty', 'unreadable'] },
          features: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string', required: true },
                path: { type: 'string', required: true },
              },
            },
          },
        },
      },
      render: (_args, value): ContentBlock[] => [{ type: 'text', text: renderText(value) }],
    },
    async execute(_args, exec) {
      if (exec.agent === undefined) {
        throw new ToolContextUnavailableError('sdd_list_features requires the calling session')
      }
      const root = ctx.workingDirectory.recorded(exec.agent.session)
      if (root === null) {
        throw new ToolContextUnavailableError('sdd_list_features: the session has no recorded workspace')
      }
      return listFeatures(ctx.fs, root, exec.signal)
    },
  }))
}
