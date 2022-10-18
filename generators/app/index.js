'use strict'
const Generator = require('yeoman-generator')
require('lodash').extend(Generator.prototype, require('yeoman-generator/lib/actions/install'))
const chalk = require('chalk')
const yosay = require('yosay')
const path = require('path')
const { append, concat, mergeLeft } = require('ramda')
const { projectNameQ, usePrevConfigsQ, getQuestions } = require('./questions')
const { checkForLatestVersion, getCurrentVersion } = require('../utils')
const { prettierTransform, defaultPrettierOptions } = require('../generator-transforms')
const filter = require('gulp-filter')
const { YO_RC_FILE, YARN_MIN_VERSION, NPM_MIN_VERSION } = require('./constants')

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, { ...opts, skipRegenerate: true, ignoreWhitespace: true, force: true, skipLocalCache: false })
    this.registerClientTransforms()
    this.ignoreFiles = []
  }

  async prompting() {
    this.isLatest = await checkForLatestVersion()

    if (!this.isLatest) return

    this.log(
      yosay(`Welcome to the fantabulous ${chalk.red('TotalSoft GraphQL Server')} generator! (⌐■_■)
     Out of the box I include Apollo Server, Koa and token validation.`)
    )
    this.answers = await this.prompt(projectNameQ)
    const { projectName } = this.answers
    this.destinationRoot(path.join(this.contextRoot, `/${projectName}`))

    if (this.fs.exists(path.join(this.destinationPath(), `/${YO_RC_FILE}`)))
      this.answers = mergeLeft(this.answers, await this.prompt(usePrevConfigsQ))

    this.config.set('__TIMESTAMP__', new Date().toLocaleString())
    this.config.set('__VERSION__', await getCurrentVersion())

    const questions = getQuestions(projectName)
    const { usePrevConfigs } = this.answers
    this.answers = usePrevConfigs
      ? mergeLeft(this.answers, await this.prompt(questions, this.config))
      : mergeLeft(this.answers, await this.prompt(questions))

    questions.forEach(q => this.config.set(q.name, this.answers[q.name]))
  }

  writing() {
    if (!this.isLatest) return

    const {
      addSubscriptions,
      addMessaging,
      addHelm,
      withMultiTenancy,
      hasSharedDb,
      addTracing,
      withRights,
      packageManager,
      helmChartName,
      dataLayer,
      addQuickStart
    } = this.answers

    const templatePath = this.templatePath('infrastructure/**/*')
    const destinationPath = this.destinationPath()

    this.ignoreFiles = ['**/.npmignore', '**/.gitignore-template', '**/helm/gql/**']

    if (dataLayer === 'knex') this.ignoreFiles = concat(['**/prisma/**'], this.ignoreFiles)
    if (dataLayer === 'prisma')
      this.ignoreFiles = concat(
        [
          '**/src/db/**',
          '**/middleware/db/**',
          '**/messaging/middleware/dbInstance.js',
          '**/startup/dataLoaders.js',
          '**/features/common/dbGenerators.js',
          '**/features/user/dataLoaders.js',
          '**/features/user/dataSources/userDb.js',
          '**/tracing/knexTracer.js',
          '**/utils/sqlDataSource.js'
        ],
        this.ignoreFiles
      )
    if (dataLayer === 'knex' && withMultiTenancy)
      this.ignoreFiles = concat(['**/db/dbInstanceFactory.js', '**/startup/middleware'], this.ignoreFiles)
    if (!addSubscriptions) this.ignoreFiles = concat(['**/pubSub/**', '**/subscriptions/**'], this.ignoreFiles)
    if (!addMessaging) this.ignoreFiles = append('**/messaging/**', this.ignoreFiles)

    if (!withMultiTenancy)
      this.ignoreFiles = concat(
        [
          '**/features/tenant/**',
          '**/multiTenancy/**',
          '**/middleware/tenantIdentification/**',
          '**/subscriptions/middleware/tenantContext.js',
          '**/prisma/tenancyFilter.js',
          '**/pubSub/middleware/tenantPublish.js'
        ],
        this.ignoreFiles
      )
    if (!hasSharedDb)
      this.ignoreFiles = concat(['**/db/multiTenancy/tenancyFilter.js', '**/prisma/tenancyFilter.js'], this.ignoreFiles)
    if (!addTracing)
      this.ignoreFiles = concat(
        [
          '**/tracing/**',
          '**/startup/middleware/tracing.js',
          '**/pubSub/middlware/tracingPublish.js',
          '**/__mocks__/opentracing.js'
        ],
        this.ignoreFiles
      )
    if (!withRights)
      this.ignoreFiles = concat(
        ['**/middleware/permissions/**', '**/constants/permissions.js', '**/constants/identityUserRoles.js'],
        this.ignoreFiles
      )

    if (!addQuickStart)
      this.ignoreFiles = concat(
        [
          '**/features/common/dbGenerators.js',
          '**/features/tenant/**',
          '**/features/user/**',
          '**/constants/identityUserRoles.js',
          '**/middleware/permissions/__tests__/**',
          '**/README.md'
        ],
        this.ignoreFiles
      )

    if (!addHelm) this.ignoreFiles = concat(['**/helm/**'], this.ignoreFiles)

    const packageManagerVersion =
      packageManager === 'npm' ? NPM_MIN_VERSION : packageManager === 'yarn' ? YARN_MIN_VERSION : NPM_MIN_VERSION
    const packageManagerLockFile = packageManager === 'yarn' ? 'yarn.lock' : 'package-lock.json'

    this.fs.copyTpl(
      templatePath,
      destinationPath,
      { ...this.answers, packageManagerVersion, packageManagerLockFile },
      {},
      { globOptions: { ignore: this.ignoreFiles, dot: true } }
    )

    const gitignorePath = this.templatePath('infrastructure/.gitignore-template')
    const gitignoreDestinationPath = path.join(destinationPath, `/.gitignore`)
    this.fs.copy(gitignorePath, gitignoreDestinationPath)

    if (addHelm) {
      const helmTemplatePath = this.templatePath('infrastructure/helm/gql/**')
      const helmDestinationPath = path.join(destinationPath, `/helm/${helmChartName}`)
      this.fs.copyTpl(
        helmTemplatePath,
        helmDestinationPath,
        { ...this.answers, packageManagerVersion, packageManagerLockFile },
        {},
        { globOptions: { dot: true } }
      )
    }
  }

  conflicts() {
    if (!this.isLatest) return
    this.ignoreFiles.map(f => this.deleteDestination(f, { globOptions: { onlyFiles: false, dot: true, silent: true } }))
  }

  install() {
    if (!this.isLatest) return

    const { packageManager, projectName } = this.answers

    this.log(
      chalk.greenBright(`All the dependencies will be installed shortly using "${packageManager}" package manager...`)
    )
    // eslint-disable-next-line no-unused-expressions
    packageManager === 'npm'
      ? this.npmInstall(null, {}, { cwd: projectName })
      : packageManager === 'yarn'
      ? this.yarnInstall(null, {}, { cwd: projectName })
      : this.npmInstall(null, {}, { cwd: projectName })
  }

  end() {
    if (!this.isLatest) return

    this.log(
      yosay(`Congratulations, you just entered the exciting world of GraphQL! Enjoy!
      Bye now!
      (*^_^*)`)
    )
  }

  registerClientTransforms() {
    const fileFilter = filter(['**/*.{js, json}'], { restore: true })

    this.queueTransformStream([fileFilter, prettierTransform(defaultPrettierOptions), fileFilter.restore])
  }
}
