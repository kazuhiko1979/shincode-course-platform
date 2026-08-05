import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const projectRoot = process.cwd()

function fail(messages) {
  for (const message of messages) console.error(message)
  process.exitCode = 1
}

function parse(filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8')
  return ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true)
}

function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false
}

function exportedAsyncFunctions(sourceFile) {
  const functions = []

  for (const statement of sourceFile.statements) {
    if (
      ts.isFunctionDeclaration(statement) &&
      statement.name &&
      statement.body &&
      hasModifier(statement, ts.SyntaxKind.ExportKeyword) &&
      hasModifier(statement, ts.SyntaxKind.AsyncKeyword)
    ) {
      functions.push({ name: statement.name.text, body: statement.body })
      continue
    }

    if (!ts.isVariableStatement(statement) || !hasModifier(statement, ts.SyntaxKind.ExportKeyword)) continue
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer
      if (
        ts.isIdentifier(declaration.name) &&
        initializer &&
        (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) &&
        hasModifier(initializer, ts.SyntaxKind.AsyncKeyword)
      ) {
        functions.push({ name: declaration.name.text, body: initializer.body })
      }
    }
  }

  return functions
}

function unwrapParentheses(expression) {
  let current = expression
  while (ts.isParenthesizedExpression(current)) current = current.expression
  return current
}

function isAdminDenialGuard(statement) {
  if (!statement || !ts.isIfStatement(statement)) return false

  const condition = unwrapParentheses(statement.expression)
  if (!ts.isPrefixUnaryExpression(condition) || condition.operator !== ts.SyntaxKind.ExclamationToken) return false

  const awaited = unwrapParentheses(condition.operand)
  if (!ts.isAwaitExpression(awaited)) return false

  const call = unwrapParentheses(awaited.expression)
  if (
    !ts.isCallExpression(call) ||
    !ts.isIdentifier(call.expression) ||
    call.expression.text !== 'isCurrentUserAdmin' ||
    call.arguments.length !== 0
  ) {
    return false
  }

  const denied = statement.thenStatement
  if (ts.isReturnStatement(denied)) return true
  return ts.isBlock(denied) && denied.statements.length > 0 && ts.isReturnStatement(denied.statements[0])
}

function hasScopedIdAndCourseId(body, requiredMutation) {
  let scoped = false

  function visit(node) {
    if (scoped) return
    if (ts.isCallExpression(node)) {
      const columns = new Set()
      let current = node
      while (
        ts.isCallExpression(current) &&
        ts.isPropertyAccessExpression(current.expression) &&
        current.expression.name.text === 'eq'
      ) {
        const column = current.arguments[0]
        if (column && ts.isStringLiteralLike(column)) columns.add(column.text)
        current = current.expression.expression
      }
      const mutation =
        ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression)
          ? current.expression.name.text
          : ''
      if (columns.has('id') && columns.has('course_id') && mutation === requiredMutation) scoped = true
    }
    ts.forEachChild(node, visit)
  }

  visit(body)
  return scoped
}

function walkFiles(directory, fileName, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) walkFiles(entryPath, fileName, result)
    if (entry.isFile() && entry.name === fileName) result.push(entryPath)
  }
  return result
}

function checkVideoOwnership() {
  const filePath = path.join(projectRoot, 'app/admin/(protected)/courses/[id]/videos/actions.ts')
  const sourceFile = parse(filePath)
  const requiredFunctions = new Set(['updateVideo', 'deleteVideo'])
  const failures = []

  for (const action of exportedAsyncFunctions(sourceFile)) {
    if (!requiredFunctions.has(action.name)) continue
    requiredFunctions.delete(action.name)
    const requiredMutation = action.name === 'updateVideo' ? 'update' : 'delete'
    if (!hasScopedIdAndCourseId(action.body, requiredMutation)) {
      failures.push(
        `${path.relative(projectRoot, filePath)}: ${action.name} の ${requiredMutation} クエリに id＋course_id の同一スコープがありません`
      )
    }
  }

  for (const functionName of requiredFunctions) {
    failures.push(`${path.relative(projectRoot, filePath)}: ${functionName} が見つかりません`)
  }

  if (failures.length > 0) fail(failures)
}

function checkAdminActionGuards() {
  const adminRoot = path.join(projectRoot, 'app/admin/(protected)')
  const failures = []
  let checkedFiles = 0
  let checkedFunctions = 0

  for (const filePath of walkFiles(adminRoot, 'actions.ts')) {
    checkedFiles += 1
    const sourceFile = parse(filePath)
    for (const action of exportedAsyncFunctions(sourceFile)) {
      checkedFunctions += 1
      if (!ts.isBlock(action.body)) {
        failures.push(`${path.relative(projectRoot, filePath)}: ${action.name} は先頭認可を検査できない簡略形式です`)
        continue
      }
      const firstStatement = action.body.statements[0]
      if (!isAdminDenialGuard(firstStatement)) {
        failures.push(
          `${path.relative(projectRoot, filePath)}: ${action.name} の先頭に未管理者をreturnする isCurrentUserAdmin ガードがありません`
        )
      }
    }
  }

  if (checkedFiles < 3 || checkedFunctions < 7) {
    failures.push(`admin actions の検査対象が不足しています（files=${checkedFiles}, functions=${checkedFunctions}, 最低3/7）`)
  }

  if (failures.length > 0) fail(failures)
}

const check = process.argv[2]

if (check === 'video-ownership') checkVideoOwnership()
else if (check === 'admin-action-guards') checkAdminActionGuards()
else {
  console.error('usage: node evals/checks/security-regressions.mjs <video-ownership|admin-action-guards>')
  process.exitCode = 2
}
