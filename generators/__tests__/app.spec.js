/* eslint-disable node/no-unpublished-import */
'use strict'
import path, { dirname } from 'path'
import assert from 'yeoman-assert'
// eslint-disable-next-line node/no-missing-import
import helpers from 'yeoman-test'
import { fileURLToPath } from 'url'
import { afterEach, describe, it } from 'mocha'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('generator-graphql-rocket:app', function () {
  this.timeout(10 * 1000)

  const projectName = 'test-graphql'
  const helmChartName = 'test-helm'
  const dbConnectionName = 'testDatabase'
  const defaultAnswers = {
    projectName,
    withMultiTenancy: false,
    hasSharedDb: false,
    dbConnectionName,
    addSubscriptions: false,
    addMessaging: false,
    withRights: false,
    addHelm: false,
    addTracing: false
  }

  afterEach(() => {
    const testDir = path.join(__dirname, projectName)
    if (fs.existsSync(testDir)) fs.removeSync(testDir)
  })

  it('create new project folder with template data', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers(defaultAnswers)
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        assert.file(`${cwd}/${projectName}/src/index.js`)
      }))

  it('project has given name', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers(defaultAnswers)
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        assert.fileContent(`${cwd}/${projectName}/package.json`, `"name": "${projectName}"`)
      }))

  it('gql port is configured', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers(defaultAnswers)
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        assert.fileContent(`${cwd}/${projectName}/.env`, `PORT="4000"`)
      }))

  it('Redis PubSub is added for Subscriptions', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers,
        addSubscriptions: true
      })
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        assert.file(`${cwd}/${projectName}/src/pubSub/pubSub.js`)
      }))

  it('helm files are added when addHelm option is true', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({ projectName })
      .withAnswers({
        ...defaultAnswers,
        addHelm: true,
        helmChartName
      })
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        assert.file(`${cwd}/${projectName}/helm`)
      }))

  it('Permissions and rights are ready to be used', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers,
        withRights: true
      })
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        const root = `${cwd}/${projectName}/src/middleware/permissions`
        assert.file([`${root}/index.js`, `${root}/rules.js`])
      }))

  it('Rusi messaging transport', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers,
        addMessaging: true,
        messagingTransport: 'rusi',
        addHelm: true,
        helmChartName
      })
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        const valuesYaml = `${cwd}/${projectName}/helm/${helmChartName}/values.yaml`
        assert.fileContent([[valuesYaml, `transport: "rusi"`]])

        const deploymentYaml = `${cwd}/${projectName}/helm/${helmChartName}/templates/deployment.yaml`

        assert.fileContent([
          [deploymentYaml, `rusi.io/app-id: {{ $current.messaging.source | quote }}`],
          [deploymentYaml, `rusi.io/enabled: {{ lower $global.messaging.transport | eq "rusi" | quote }}`]
        ])
      }))
})
