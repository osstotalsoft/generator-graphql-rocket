'use strict';
const updateNotifier = require('update-notifier');
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const { append, concat } = require('ramda');
const questions = require('./questions');

module.exports = class extends Generator {

  async prompting() {
    const notifier = updateNotifier();
    if (notifier.update) {
      notifier.notify();
    }
    this.log(notifier.update);

    this.log(
      yosay(`Welcome to the fantabulous ${chalk.red('TotalSoft GraphQL Server')} generator! (⌐■_■)
     Out of the box I include Apollo Server, Koa and token validation.`)
    );
    this.answers = await this.prompt(questions);
  }

  writing() {
    const { projectName, addSubscriptions, addMessaging, addHelm, withMultiTenancy, addTracing, addGqlLogging, withRights, packageManager } = this.answers

    const templatePath = this.templatePath(this.templatePath("infrastructure/**/*"))
    const destinationPath = this.destinationPath(projectName)

    let ignoreFiles = ["**/.npmignore"]
    if (!addHelm) ignoreFiles = append("**/helm/**", ignoreFiles)
    if (!addSubscriptions) ignoreFiles = concat(["**/messaging/**", "**/pubSub/**"], ignoreFiles)
    if (!addMessaging) ignoreFiles = append("**/messaging/*", ignoreFiles)
    if (!withMultiTenancy) ignoreFiles = concat(["**/features/tenant/**", "**/multiTenancy/**", "**/middleware/tenantIdentification/**"], ignoreFiles)
    if (!addTracing) ignoreFiles = concat(["**/tracing/**"], ignoreFiles)
    if (!addGqlLogging) ignoreFiles = concat(["**/plugins/logging/**"], ignoreFiles)
    if (!withRights) ignoreFiles = concat(["**/middleware/permissions/**", "**/constants/permissions.js", "**/constants/identityUserRoles.js"], ignoreFiles)

    const packageManagerVersion = packageManager === 'npm'
      ? "10.0.0"
      : packageManager === 'yarn'
        ? "1.22.4"
        : "10.0.0"

    this.fs.copyTpl(templatePath, destinationPath, { ...this.answers, packageManagerVersion }, {},
      { globOptions: { ignore: ignoreFiles, dot: true } }
    )
  }

  install() {
    const { packageManager, projectName } = this.answers

    packageManager === 'npm'
      ? this.npmInstall(null, {}, { cwd: projectName })
      : packageManager === 'yarn'
        ? this.yarnInstall(null, {}, { cwd: projectName })
        : this.npmInstall(null, {}, { cwd: projectName })
  }

  end() {
    this.log(
      yosay(`Congratulations, you just entered the exciting world of GraphQL! Enjoy! 
      Bye now! 
      (*^_^*)`)
    );
  }
};
