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

describe('test package installers', function () {
  this.timeout(100 * 1000)

  const projectName = 'test-graphql'
  const dbConnectionName = 'testDatabase'
  const npm = `>= 9.x`

  afterEach(() => {
    const testDir = path.join(__dirname, projectName)
    if (fs.existsSync(testDir)) fs.removeSync(testDir)
  })

  it('installs packages with npm', () =>
    helpers
      .run(path.join(__dirname, '../app'), { cwd: __dirname })
      .withAnswers({
        projectName,
        withMultiTenancy: false,
        hasSharedDb: false,
        dbConnectionName,
        addSubscriptions: false,
        addMessaging: false,
        withRights: true,
        addHelm: false,
        addTracing: false
      })
      .then(({ cwd }) => {
        assert.jsonFileContent(`${cwd}/${projectName}/package.json`, {
          name: projectName,
          engines: { npm }
        })
      }))
})
