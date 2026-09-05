import type { Document } from '../types'

export interface AssignmentNode {
  id?: string
  assigneeId?: string
  assigneeName?: string
  assigneeType?: string
  departmentId?: string
  departmentName?: string
  status?: string
  subAssignments?: AssignmentNode[]
}

export interface DepartmentMaster {
  departmentId?: string
  id?: string
  headUserRef?: string
}

export interface ActionableTaskEntry {
  document: Document
  assignment?: AssignmentNode
  status: string
}

const actionableStatuses = new Set(['pending', 'pending-acceptance', 'accepted', 'in-progress', 'inprogress'])

const normalize = (value?: string) => (value || '').trim().toLowerCase()

function flattenAssignments(assignments: AssignmentNode[] = []): AssignmentNode[] {
  return assignments.flatMap(assignment => [
    assignment,
    ...flattenAssignments(assignment.subAssignments || []),
  ])
}

function isDepartmentHead(assignment: AssignmentNode, username: string, departments: DepartmentMaster[]): boolean {
  if (normalize(assignment.assigneeType) !== 'department') return false

  const assignmentDepartmentId = normalize(assignment.departmentId)
  if (!assignmentDepartmentId) return false

  const department = departments.find(item =>
    normalize(item.departmentId || item.id) === assignmentDepartmentId,
  )

  return normalize(department?.headUserRef) === username
}

function isOutgoingTask(document: Document, username: string): boolean {
  if (document.docDirection !== 'outgoing') return false

  return normalize(document.createdBy) === username || normalize(document.currentHolder) === username
}

/**
 * Returns only assignments that the signed-in user is allowed to act on.
 * Person assignments match the immutable UserId. Department assignments match
 * only the configured HeadUserRef for that assignment's own department.
 */
export function getActionableTaskEntries(
  documents: Document[],
  user: { username?: string } | null | undefined,
  departments: DepartmentMaster[],
): ActionableTaskEntry[] {
  const username = normalize(user?.username)
  if (!username) return []

  return documents.flatMap(document => {
    if (isOutgoingTask(document, username)) {
      return [{ document, status: document.status }]
    }

    const assignments = flattenAssignments(((document as any).assignments || []) as AssignmentNode[])
    return assignments
      .filter(assignment => {
        const status = normalize(assignment.status)
        if (!actionableStatuses.has(status)) return false

        if (normalize(assignment.assigneeType) === 'person') {
          return normalize(assignment.assigneeId) === username
        }

        return isDepartmentHead(assignment, username, departments)
      })
      .map(assignment => ({ document, assignment, status: normalize(assignment.status) }))
  })
}
