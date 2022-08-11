'use strict'
const path = require('path')
const rimraf = require('rimraf')
const assert = require('yeoman-assert')
const helpers = require('yeoman-test')

describe('test package installers', () => {
  jest.setTimeout(10 * 1000)
  const projectName = 'test-graphql'
  const tempRoot = `../.tmp`
  const dbConnectionName = 'testDatabase'
  const npm = '>= 7.16.0'
  const yarn = '>= 1.22.4'

  beforeAll(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  afterEach(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  it('installs packages with npm', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        projectName,
        withMultiTenancy: false,
        hasSharedDb: false,
        dbConnectionName,
        addSubscriptions: false,
        addMessaging: false,
        withRights: true,
        addHelm: false,
        addTracing: false,
        packageManager: 'npm'
      })
      .run()
      .then(_gen => {
        assert.jsonFileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), {
          name: projectName,
          engines: { npm }
        })
      }))

  it('installs packages with yarn', () =>
    helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        projectName,
        withMultiTenancy: false,
        hasSharedDb: false,
        dbConnectionName,
        addSubscriptions: true,
        addMessaging: false,
        withRights: false,
        addHelm: false,
        addTracing: false,
        packageManager: 'yarn'
      })
      .run()
      .then(_gen => {
        assert.jsonFileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), {
          name: projectName,
          engines: { yarn }
        })
        assert.fileContent(path.join(__dirname, `${tempRoot}/${projectName}/Dockerfile`), 'yarn')
        assert.noFileContent(path.join(__dirname, `${tempRoot}/${projectName}/Dockerfile`), 'npm')
      }))
})
