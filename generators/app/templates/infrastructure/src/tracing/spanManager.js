const { AsyncLocalStorage } = require('async_hooks')

const asyncLocalStorage = new AsyncLocalStorage()

function getActiveSpan() {
  const context = asyncLocalStorage.getStore()
  const rootSpan = context && context.length ? context[context.length - 1] : null
  return rootSpan
}

async function useSpanManager(rootSpan, scopeAction) {
  const context = [rootSpan]

  return asyncLocalStorage.run(context, async () => {
    await scopeAction()
  })
}

function beginScope(span) {
  const context = asyncLocalStorage.getStore()
  context && context.push(span)
}

function endScope() {
  const context = asyncLocalStorage.getStore()
  context && context.pop()
}

async function withScope(span, action) {
  try {
    beginScope(span)
    await action()
  } finally {
    endScope()
  }
}

module.exports = { useSpanManager, getActiveSpan, beginScope, endScope, withScope }
