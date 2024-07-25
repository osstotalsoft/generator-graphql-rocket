'use strict'
import assert from 'yeoman-assert'
import helpers from 'yeoman-test'
import { findIndex } from 'ramda'
import { projectNameQ, getQuestions } from '../generators/app/questions.js'
import { rimrafSync } from 'rimraf'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('question validations', () => {
  it('project name input does not have an acceptable format', () => {
    const name = '& - a!'
    const validationResult = projectNameQ.validate(name)
    assert.notEqual(validationResult, true)
  })

  it('project name input has an acceptable format', () => {
    const name = 'my-project_a'
    const validationResult = projectNameQ.validate(name)
    assert.equal(validationResult, true)
  })

  it('helm chart name input does not have an acceptable format', () => {
    const name = '& - a!'
    const questions = getQuestions('test')
    const qIndex = findIndex(q => q.name === 'helmChartName', questions)
    const validationResult = questions[qIndex].validate(name)
    assert.notEqual(validationResult, true)
  })

  it('helm chart name input has an acceptable format', () => {
    const name = 'my-chart_a'
    const questions = getQuestions('test')
    const qIndex = findIndex(q => q.name === 'helmChartName', questions)
    const validationResult = questions[qIndex].validate(name)
    assert.equal(validationResult, true)
  })
})

describe('test package installers', () => {
  const projectName = 'test-graphql'
  const tempRoot = `../.tmp`
  const dbConnectionName = 'testDatabase'
  const messageBus = /^@totalsoft[/]message-bus/
  const defaultAnswers = {
    projectName,
    dataLayer: 'knex',
    withMultiTenancy: false,
    hasSharedDb: false,
    dbConnectionName,
    addSubscriptions: false,
    addMessaging: false,
    withRights: false,
    addHelm: false,
    addTracing: false,
    packageManager: 'npm'
  }

  before(() => {
    rimrafSync(path.join(__dirname, tempRoot))
  })

  afterEach(() => {
    rimrafSync(path.join(__dirname, tempRoot))
  })

  it('does not create project if projectName is invalid', async () => {
    const invalidProjectName = '111#@'

    await helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        projectName: invalidProjectName
      })
      .run()

    assert.noFile(path.join(__dirname, invalidProjectName))
  })

  it('does not contain subscriptions', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addSubscriptions: false
      })
      .run()
      .then(() => {
        assert.noFile(path.join(__dirname, `${tempRoot}/${projectName}/src/pubSub/pubSub.js`))
      }))

  it('does not contain messaging', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addMessaging: false
      })
      .run()
      .then(() => {
        assert.noFile(path.join(__dirname, `${tempRoot}/${projectName}/src/messaging`))
      }))

  it('does not contain message-bus package', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers
      })
      .run()
      .then(_gen => {
        assert.jsonFileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), {
          dependencies: messageBus
        })
      }))

  it('does not contain middleware in messaging', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addMessaging: false
      })
      .run()
      .then(() => {
        assert.noFile(path.join(__dirname, `${tempRoot}/${projectName}/src/messaging/middleware`))
      }))

  it('does not contain helm files', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addHelm: false
      })
      .run()
      .then(() => {
        assert.noFile(path.join(__dirname, `${tempRoot}/${projectName}/helm`))
      }))

  it('does not contain knex config files and db associated files', async () => {
    const files = [
      path.join(__dirname, `${tempRoot}/${projectName}/src/db`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/middleware/db`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/middleware/tenantIdentification`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/middleware/messaging/multiTenancy`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/messaging/middleware/dbInstance.js`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/startup/dataLoaders.js`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/features/common/dbGenerators.js`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/features/tenant`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/features/user/dataLoaders.js`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/features/user/dataSources/userDb.js`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/tracing/knexTracer.js`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/utils/sqlDataSource.js`)
    ]

    await helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        dataLayer: 'prisma'
      })
      .run()
      .then(() => {
        assert.noFile(files)
      })
  })

  it('initializes prisma', async () => {
    const files = [
      path.join(__dirname, `${tempRoot}/${projectName}/prisma`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/prisma/client.js`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/prisma/index.d.ts`),
      path.join(__dirname, `${tempRoot}/${projectName}/src/prisma/index.js`)
    ]
    await helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        dataLayer: 'prisma'
      })
      .run()
      .then(() => {
        assert.file(files)
        assert.fileContent(
          path.join(__dirname, `${tempRoot}/${projectName}/.env`),
          `DATABASE_URL="sqlserver://serverName:1433;database=databaseName;user=userName;password=password;trustServerCertificate=true"`
        )
      })
  })
}).timeout(10 * 1000)
