/* eslint-disable node/no-unpublished-import */
'use strict'
import path, { dirname } from 'path'
import assert from 'yeoman-assert'
// eslint-disable-next-line node/no-missing-import
import helpers from 'yeoman-test'
import { projectNameQ, getQuestions } from '../app/questions.js'
import { findIndex } from 'ramda'
import { expect } from 'chai'
import { fileURLToPath } from 'url'
import { afterEach, describe, it } from 'mocha'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('generator-graphql-rocket:app question validations', function () {
  it('project name input does not have an acceptable format', function () {
    const name = '& - a!'
    const validationResult = projectNameQ.validate(name)
    expect(validationResult).to.not.equal(true)
  })

  it('project name input has an acceptable format', function () {
    const name = 'my-project_a'
    const validationResult = projectNameQ.validate(name)
    expect(validationResult).to.equal(true)
  })

  it('helm chart name input does not have an acceptable format', function () {
    const name = '& - a!'
    const questions = getQuestions('test')
    const qIndex = findIndex(q => q.name === 'helmChartName', questions)
    const validationResult = questions[qIndex].validate(name)
    expect(validationResult).to.not.equal(true)
  })

  it('helm chart name input has an acceptable format', function () {
    const name = 'my-chart_a'
    const questions = getQuestions('test')
    const qIndex = findIndex(q => q.name === 'helmChartName', questions)
    const validationResult = questions[qIndex].validate(name)
    expect(validationResult).to.equal(true)
  })
})

describe('test project generation', function () {
  this.timeout(10 * 1000)

  const projectName = 'test-graphql'
  const dbConnectionName = 'testDatabase'
  const messageBus = /^@totalsoft[/]message-bus/
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

  it('does not contain subscriptions', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers,
        addSubscriptions: false
      })
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        assert.noFile(`${cwd}/${projectName}/src/pubSub/pubSub.js`)
      }))

  it('does not contain messaging', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers,
        addMessaging: false
      })
      .withOptions({ skipPackageInstall: true })
      .catch(err => {
        assert.fail(err)
      })
      .then(({ cwd }) => {
        console.log(`Evaluating in: ${cwd}`)
        assert.noFile(`${cwd}/${projectName}/src/messaging/index.js`)
      }))

  it('does not contain message-bus package', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers
      })
      .withOptions({ skipPackageInstall: true })
      .then(({ cwd }) => {
        assert.jsonFileContent(`${cwd}/${projectName}/package.json`, {
          dependencies: messageBus
        })
      }))

  it('does not contain middleware in messaging', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers,
        addMessaging: false
      })
      .withOptions({ skipPackageInstall: true })
      .then(({ cwd }) => {
        assert.noFile(`${cwd}/${projectName}/src/messaging/middleware`)
      }))

  it('does not contain helm files', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        ...defaultAnswers,
        addHelm: false
      })
      .withOptions({ skipPackageInstall: true })
      .then(({ cwd }) => {
        assert.noFile(`${cwd}/${projectName}/helm`)
      }))

  it('does not contain knex config files and db associated files', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers(defaultAnswers)
      .withOptions({ skipPackageInstall: true })
      .then(({ cwd }) => {
        assert.noFile([
          `${cwd}/${projectName}/src/db`,
          `${cwd}/${projectName}/src/middleware/db`,
          `${cwd}/${projectName}/src/middleware/tenantIdentification`,
          `${cwd}/${projectName}/src/middleware/messaging/multiTenancy`,
          `${cwd}/${projectName}/src/messaging/middleware/dbInstance.js`,
          `${cwd}/${projectName}/src/startup/dataLoaders.js`,
          `${cwd}/${projectName}/src/features/common/dbGenerators.js`,
          `${cwd}/${projectName}/src/features/tenant`,
          `${cwd}/${projectName}/src/features/user/dataLoaders.js`,
          `${cwd}/${projectName}/src/features/user/dataSources/userDb.js`,
          `${cwd}/${projectName}/src/tracing/knexTracer.js`,
          `${cwd}/${projectName}/src/utils/sqlDataSource.js`
        ])
      }))

  it('initializes prisma', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers(defaultAnswers)
      .withOptions({ skipPackageInstall: true })
      .then(({ cwd }) => {
        assert.file([
          `${cwd}/${projectName}/prisma`,
          `${cwd}/${projectName}/src/prisma/client.js`,
          `${cwd}/${projectName}/src/prisma/index.d.ts`,
          `${cwd}/${projectName}/src/prisma/index.js`
        ])
        assert.fileContent(
          `${cwd}/${projectName}/.env`,
          `DATABASE_URL="sqlserver://serverName:1433;database=databaseName;user=userName;password=password;trustServerCertificate=true"`
        )
      }))
})
