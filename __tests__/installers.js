'use strict'
const path = require('path')
const rimraf = require('rimraf')
const assert = require('yeoman-assert')
const helpers = require('yeoman-test')

describe('test package installers', () => {
  const projectName = 'test-graphql'
  const tempRoot = `../.tmp`
  const gqlPort = '4000'

  const npm = '>= 10.0.0'
  const yarn = '>= 1.22.4'

  beforeAll(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  afterEach(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })

  it('installs packages with npm', () => {
    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        projectName,
        gqlPort,
        withMultiTenancy: true,
        addSubscriptions: true,
        addMessaging: false,
        withRights: true,
        addGqlLogging: true,
        addHelm: true,
        addTracing: true,
        identityApiUrl: '',
        identityOpenIdConfig: '',
        identityAuthority: 'localhost:5000',
        packageManager: 'npm'
      })
      .run()
      .then(_gen => {
        assert.jsonFileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), {
          name: projectName,
          engines: { npm }
        })
      })
  })

  it('installs packages with yarn', () => {
    return helpers
      .create(path.join(__dirname, '../generators/app'))
      .inDir(path.join(__dirname, tempRoot))
      .withPrompts({
        projectName,
        gqlPort,
        withMultiTenancy: true,
        addSubscriptions: true,
        addMessaging: false,
        withRights: true,
        addGqlLogging: true,
        addHelm: true,
        addTracing: true,
        identityApiUrl: '',
        identityOpenIdConfig: '',
        identityAuthority: 'localhost:5000',
        packageManager: 'yarn'
      })
      .run()
      .then(_gen => {
        assert.jsonFileContent(path.join(__dirname, `${tempRoot}/${projectName}/package.json`), {
          name: projectName,
          engines: { yarn }
        })
      })
  })

  afterAll(() => {
    rimraf.sync(path.join(__dirname, tempRoot))
  })
})