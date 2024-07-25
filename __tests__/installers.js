'use strict'
import { rimraf } from 'rimraf'
import assert from 'yeoman-assert'
import helpers from 'yeoman-test'
import { NPM_MIN_VERSION, YARN_MIN_VERSION } from '../generators/app/constants.js'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('test package installers', () => {
  const projectName = 'test-graphql'
  const tempRoot = `../.tmp`
  const dbConnectionName = 'testDatabase'
  const npm = `>= ${NPM_MIN_VERSION}`
  const yarn = `>= ${YARN_MIN_VERSION}`

  before(() => {
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
}).timeout(10 * 1000)
