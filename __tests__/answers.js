'use strict'
const path = require('path')
const rimraf = require('rimraf')
const assert = require('yeoman-assert')
const helpers = require('yeoman-test')

describe('test package installers', () => {
  jest.setTimeout(10 * 1000)
  const projectName = 'test-graphql'
  const tempRoot = `../.tmp`
  const gqlPort = '4000'
  const messageBus = /^@totalsoft[/]message-bus/
  const defaultAnswers = {
    projectName,
    gqlPort,
    dataLayer: 'knex',
    withMultiTenancy: false,
    addSubscriptions: false,
    addMessaging: false,
    withRights: false,
    addGqlLogging: false,
    addHelm: false,
    addTracing: false,
    identityApiUrl: '',
    identityOpenIdConfig: '',
    identityAuthority: 'localhost:5000',
    packageManager: 'npm'
  }

  beforeAll(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  afterEach(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  it('does not creat project if projectName is invalid', () => {
    const invalidProjectName = '111#@'

    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        projectName: invalidProjectName
      })
      .run()
      .then(() => {
        assert.noFile(path.join(__dirname, invalidProjectName))
      })
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
        assert.noFile(path.join(__dirname, `${tempRoot}/${projectName}/src/pubSub/redisPubSub.js`))
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
      path.join(__dirname, `${tempRoot}/${projectName}/src/utils/prisma.js`)
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
})
