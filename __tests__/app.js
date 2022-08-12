'use strict'
const path = require('path')
const assert = require('yeoman-assert')
const helpers = require('yeoman-test')
const rimraf = require('rimraf')

describe('generator-graphql-rocket:app', () => {
  jest.setTimeout(10 * 1000)
  const tempRoot = `../.tmp`
  const projectName = 'test-graphql'
  const helmChartName = 'test-helm'
  const dbConnectionName = 'testDatabase'
  const defaultAnswers = {
    projectName,
    withMultiTenancy: true,
    hasSharedDb: false,
    dbConnectionName,
    addSubscriptions: false,
    addMessaging: false,
    withRights: false,
    addHelm: false,
    addVaultConfigs: false,
    addTracing: false,
    packageManager: 'npm'
  }

  beforeAll(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  afterEach(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  it('create new project folder with template data', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts(defaultAnswers)
      .run()
      .then(() => {
        assert.file(path.join(__dirname, `${tempRoot}/${projectName}/src/index.js`))
      }))

  it('project has given name', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts(defaultAnswers)
      .run()
      .then(() => {
        assert.fileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), `"name": "${projectName}"`)
      }))

  it('gql port is configured', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts(defaultAnswers)
      .run()
      .then(() => {
        assert.fileContent(path.join(__dirname, `${tempRoot}/${projectName}/.env`), `PORT="4000"`)
      }))

  it('Redis PubSub is added for Subscriptions', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addSubscriptions: true
      })
      .run()
      .then(() => {
        assert.file(path.join(__dirname, `${tempRoot}/${projectName}/src/pubSub/pubSub.js`))
      }))

  it('helm files are added when addHelm option is true', () =>
    helpers
      .run(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addHelm: true
      })
      .then(() => {
        assert.file(path.join(__dirname, `${tempRoot}/${projectName}/helm`))
      }))

  it('GraphQL logging plugin is added', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts(defaultAnswers)
      .run()
      .then(() => {
        assert.fileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), `"@totalsoft/apollo-logger": `)
      }))

  it('Permissions and rights are ready to be used', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        withRights: true
      })
      .run()
      .then(() => {
        const root = `${tempRoot}/${projectName}/src/middleware/permissions`
        assert.file([`${root}/index.js`, `${root}/rules.js`])
      }))

  it('Contains vaultEnvironment variable set to false', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addHelm: true,
        helmChartName: 'test-helm',
        addVaultConfigs: true
      })
      .run()
      .then(() => {
        assert.fileContent(
          path.join(__dirname, `${tempRoot}/${projectName}/helm/${helmChartName}/values.yaml`),
          `vaultEnvironment: "false"`
        )
      }))

  it('Rusi messaging transport', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addMessaging: true,
        messagingTransport: 'rusi',
        addHelm: true,
        helmChartName
      })
      .run()
      .then(() => {
        const valuesYaml = path.join(__dirname, `${tempRoot}/${projectName}/helm/${helmChartName}/values.yaml`)
        assert.fileContent([
          [valuesYaml, `transport: "rusi"`]
        ])

        const deploymentYaml = path.join(
          __dirname,
          `${tempRoot}/${projectName}/helm/${helmChartName}/templates/deployment.yaml`
        )
        assert.fileContent([
          [deploymentYaml, `rusi.io/app-id: {{ $current.messaging.source | quote }}`],
          [deploymentYaml, `rusi.io/enabled: {{ lower $global.messaging.transport | eq "rusi" | quote }}`]
        ])
      }))
})
