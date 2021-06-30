'use strict'
const Generator = require('yeoman-generator')
require('lodash').extend(Generator.prototype, require('yeoman-generator/lib/actions/install'))
const chalk = require('chalk')
const yosay = require('yosay')
const { append, concat } = require('ramda')
const questions = require('./questions')
const { checkForLatestVersion } = require('../utils')
const { prettierTransform, defaultTsPrettierOptions: defaultPrettierOptions } = require('../generator-transforms')
const filter = require('gulp-filter')

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts)
    this.registerClientTransforms()
  }

  async prompting() {
    this.isLatest = await checkForLatestVersion()

    if (!this.isLatest) return

    this.log(
      yosay(`Welcome to the fantabulous ${chalk.red('TotalSoft GraphQL Server')} generator! (⌐■_■)
     Out of the box I include Apollo Server, Koa and token validation.`)
    )
    this.answers = await this.prompt(questions)
  }

  writing() {
    if (!this.isLatest) return

    const {
      projectName,
      addSubscriptions,
      addMessaging,
      addHelm,
      withMultiTenancy,
      addTracing,
      addGqlLogging,
      withRights,
      packageManager,
      helmChartName
    } = this.answers

    const templatePath = this.templatePath('infrastructure/**/*')
    const destinationPath = this.destinationPath(projectName)

    let ignoreFiles = ['**/.npmignore', '**/.gitignore-template', '**/helm/**']

    if (!addSubscriptions) ignoreFiles = concat(['**/pubSub/**'], ignoreFiles)
    if (!addMessaging) ignoreFiles = append('**/messaging/**', ignoreFiles)
    if (!withMultiTenancy)
      ignoreFiles = concat(
        ['**/features/tenant/**', '**/multiTenancy/**', '**/middleware/tenantIdentification/**'],
        ignoreFiles
      )
    if (!addTracing) ignoreFiles = concat(['**/tracing/**', '**/__mocks__/opentracing.js'], ignoreFiles)
    if (!addGqlLogging) ignoreFiles = concat(['**/plugins/logging/**'], ignoreFiles)
    if (!withRights)
      ignoreFiles = concat(
        ['**/middleware/permissions/**', '**/constants/permissions.js', '**/constants/identityUserRoles.js'],
        ignoreFiles
      )

    const packageManagerVersion = packageManager === 'npm' ? '7.16.0' : packageManager === 'yarn' ? '1.22.4' : '7.16.0'

    this.fs.copyTpl(
      templatePath,
      destinationPath,
      { ...this.answers, packageManagerVersion },
      {},
      { globOptions: { ignore: ignoreFiles, dot: true } }
    )

    const gitignorePath = this.templatePath('infrastructure/.gitignore-template')
    const gitignoreDestinationPath = this.destinationPath(`${projectName}/.gitignore`)
    this.fs.copy(gitignorePath, gitignoreDestinationPath)

    if (addHelm) {
      const helmTemplatePath = this.templatePath('infrastructure/helm/gql/**')
      const helmDestinationPath = this.destinationPath(`${projectName}/helm/${helmChartName}`)
      this.fs.copyTpl(
        helmTemplatePath,
        helmDestinationPath,
        { ...this.answers, packageManagerVersion },
        {},
        { globOptions: { dot: true } }
      )
    }
  }

  install() {
    if (!this.isLatest) return

    const { packageManager, projectName } = this.answers

    this.log(chalk.greenBright(`All the dependencies will be installed shortly using "${packageManager}" package manager...`))
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
