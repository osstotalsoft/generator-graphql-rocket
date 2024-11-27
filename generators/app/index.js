'use strict'
import Generator from 'yeoman-generator'
// require('lodash'.extend(Generator.prototype, require('yeoman-generator/lib/actions/install'
import chalk from 'chalk'
import yosay from 'yosay'
import path from 'path'
import { concat, mergeLeft } from 'ramda'
import { projectNameQ, getQuestions, usePrevConfigsQ } from './questions.js'
import { checkForLatestVersion, getCurrentVersion } from '../utils.js'
import filter from 'gulp-filter'
import { prettierTransform, defaultPrettierOptions } from '../generator-transforms.js'
import { YO_RC_FILE } from './constants.js'

export default class extends Generator {
  constructor(args, opts) {
    super(args, { ...opts, skipRegenerate: true, ignoreWhitespace: true, force: true, skipLocalCache: false })
    this.registerClientTransforms()
  }

  async prompting() {
    this.isLatest = await checkForLatestVersion()

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
      helmChartName,
      addQuickStart
    } = this.answers

    const templatePath = this.templatePath('infrastructure/**/*')
    const destinationPath = this.destinationPath()

    let ignoreFiles = ['**/.npmignore', '**/.gitignore-template', '**/helm/**']

    if (!addSubscriptions)
      ignoreFiles = concat(['**/pubSub/**', '**/subscriptions/**', '**/servers/subscription.js'], ignoreFiles)
    if (!addMessaging) ignoreFiles = concat(['**/messaging/**', '**/servers/messaging.js'], ignoreFiles)

    if (!withMultiTenancy)
      ignoreFiles = concat(
        [
          '**/features/tenant/**',
          '**/multiTenancy/**',
          '**/middleware/tenantIdentification/**',
          '**/subscriptions/middleware/tenantContext.js',
          '**/prisma/tenancyExtension.js',
          '**/pubSub/middleware/tenantPublish.js'
        ],
        ignoreFiles
      )
    if (!hasSharedDb)
      ignoreFiles = concat(['**/db/multiTenancy/tenancyFilter.js', '**/prisma/tenancyExtension.js'], ignoreFiles)
    if (!addTracing)
      ignoreFiles = concat(
        [
          '**/tracing/**',
          '**/startup/tracing.js**',
          '**/startup/middleware/tracing.js',
          '**/pubSub/middleware/tracingPublish.js',
          '**/subscriptions/middleware/tracing.js'
        ],
        ignoreFiles
      )
    if (!withRights)
      ignoreFiles = concat(
        ['**/middleware/permissions/**', '**/constants/permissions.js', '**/constants/identityUserRoles.js'],
        ignoreFiles
      )

    if (!addQuickStart)
      ignoreFiles = concat(
        [
          '**/features/common/dbGenerators.js',
          '**/features/tenant/**',
          '**/features/user/**',
          '**/constants/identityUserRoles.js',
          '**/middleware/permissions/__tests__/**',
          '**/README.md'
        ],
        ignoreFiles
      )

    this.fs.copyTpl(templatePath, destinationPath, this.answers, {}, { globOptions: { ignore: ignoreFiles, dot: true } })

    const gitignorePath = this.templatePath('infrastructure/.gitignore-template')
    const gitignoreDestinationPath = path.join(destinationPath, `/.gitignore`)
    this.fs.copy(gitignorePath, gitignoreDestinationPath)

    if (addHelm) {
      const helmTemplatePath = this.templatePath('infrastructure/helm/gql/**')
      const helmDestinationPath = path.join(destinationPath, `/helm/${helmChartName}`)
      this.fs.copyTpl(helmTemplatePath, helmDestinationPath, this.answers, {}, { globOptions: { dot: true } })
    }
  }

  install() {
    if (!this.isLatest || this?.options?.skipPackageInstall) return

    this.log(chalk.greenBright(`All the dependencies will be installed shortly using "npm" package manager...`))
    this.spawnCommandSync('npm install')
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
