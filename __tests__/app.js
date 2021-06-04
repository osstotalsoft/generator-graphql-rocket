'use strict'
const path = require('path')
const assert = require('yeoman-assert')
const helpers = require('yeoman-test')
const rimraf = require('rimraf')

describe('generator-graphql-rocket:app', () => {
  const tempRoot = `../.tmp`
  const projectName = 'test-graphql'
  const helmChartName = 'test-helm'
  const defaultAnswers = {
    projectName,
    gqlPort: '',
    withMultiTenancy: true,
    addSubscriptions: false,
    addMessaging: false,
    withRights: false,
    addGqlLogging: false,
    addHelm: false,
    addVaultConfigs: false,
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

  it('create new project folder with template data', () => {
    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts(defaultAnswers)
      .run()
      .then(() => {
        assert.file(path.join(__dirname, `${tempRoot}/${projectName}/src/index.js`))
      })
  })

  it('project has given name', () => {
    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts(defaultAnswers)
      .run()
      .then(() => {
        assert.fileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), `"name": "${projectName}"`)
      })
  })

  it('gql port is configured', () => {
    const gqlPort = '4000'
    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        gqlPort
      })
      .run()
      .then(() => {
        assert.fileContent(path.join(__dirname, `${tempRoot}/${projectName}/.env`), `PORT="${gqlPort}"`)
      })
  })

  it('Redis PubSub is added for Subscriptions', () => {
    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addSubscriptions: true
      })
      .run()
      .then(() => {
        assert.file(path.join(__dirname, `${tempRoot}/${projectName}/src/pubSub/redisPubSub.js`))
      })
  })

  it('helm files are added when addHelm option is true', () => {
    return helpers
      .run(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addHelm: true
      })
      .then(() => {
        assert.file(path.join(__dirname, `${tempRoot}/${projectName}/helm`))
      })
  })

  it('GraphQL logging plugin is added', () => {
    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        ...defaultAnswers,
        addGqlLogging: true
      })
      .run()
      .then(() => {
        const root = `${tempRoot}/${projectName}/src/plugins/logging`
        assert.file([`${root}/loggingPlugin.js`, `${root}/loggingUtils.js`])
      })
  })

  it('Permissions and rights are ready to be used', () => {
    return helpers
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
      })
  })

  it('Contains vaultEnvironment variable set to false', () => {
    return helpers
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
        console.log(`${tempRoot}/${projectName}/helm/${helmChartName}/values.yaml`)
        assert.fileContent(
          path.join(__dirname, `${tempRoot}/${projectName}/helm/${helmChartName}/values.yaml`),
          `vaultEnvironment: "false"`
        )
      })
  })
})
