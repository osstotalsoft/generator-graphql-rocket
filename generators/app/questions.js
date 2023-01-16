const chalk = require('chalk')

module.exports.projectNameQ = {
  type: 'input',
  name: 'projectName',
  message: 'What is the name of your project?',
  validate: appName => {
    const pass = appName.match(/^((?!-)[A-Za-z-._\d]{1,63}(?<!-))+$/)
    if (pass) {
      return true
    }

    return `${chalk.red(
      "Provide a valid project name, only use letters and '-', '_' or '.' separators! No digits, special characters and whitespace are allowed and do not start or end with a separator!"
    )}`
  },
  default: 'new-gql-server'
}

module.exports.usePrevConfigsQ = {
  type: 'confirm',
  name: 'usePrevConfigs',
  message:
    'You are regenerating over an existing project, would you like to use its previously saved generator configurations?',
  default: true
}

module.exports.getQuestions = projectName => [
  {
    type: 'list',
    name: 'dataLayer',
    message: 'What data integration layer technology you would like to use?',
    choices: [
      { name: 'Prisma', value: 'prisma' },
      { name: 'Knex JS', value: 'knex' }
    ],
    default: 'prisma'
  },
  {
    type: 'confirm',
    name: 'withRights',
    message:
      'Would you like to use and implement custom authorization for your GraphQL schema? This includes rights and permissions.',
    default: false
  },
  {
    type: 'confirm',
    name: 'withMultiTenancy',
    message: 'Would you like to use and implement multi-tenancy?',
    default: false
  },
  {
    type: 'confirm',
    name: 'hasSharedDb',
    when: prompts => prompts.withMultiTenancy,
    message: 'Do you have a database that is shared by multiple tenants?',
    default: false
  },
  {
    type: 'input',
    name: 'dbConnectionName',
    when: prompts => prompts.withMultiTenancy,
    message: 'What is your database connection name?',
    default: 'myDatabase'
  },
  {
    type: 'confirm',
    name: 'addSubscriptions',
    message: 'Would you like to support subscriptions?',
    default: false
  },
  {
    type: 'confirm',
    name: 'addMessaging',
    message: 'Would you like to use messaging? This will allow you to react to messages in the event-driven fashion.',
    default: false
  },
  {
    type: 'list',
    name: 'messagingTransport',
    message:
      'What messaging transport would you like to use? Read more here: https://github.com/osstotalsoft/nodebb/tree/master/packages/message-bus#transport.',
    choices: ['nats', 'rusi'],
    when: prompts => prompts.addMessaging,
    default: 'nats'
  },
  {
    type: 'confirm',
    name: 'addHelm',
    message: 'Would you like to generate the default helm files?',
    default: false
  },
  {
    type: 'input',
    name: 'helmChartName',
    message: 'What is the name of your helm chart?',
    when: prompts => prompts.addHelm,
    default: projectName,
    validate: name => {
      if (name.match(/[a-z0-9]([-a-z0-9]*[a-z0-9])?/)) {
        return true
      }

      return `${chalk.red(
        "Provide a valid chart name, only use lower case letters, digits and '-' separators! No special characters and whitespace are allowed and do not start or end with a separator!"
      )}`
    }
  },
  {
    type: 'confirm',
    name: 'addVaultConfigs',
    message: 'Would you like to generate the default vault configurations?',
    default: false
  },
  {
    type: 'confirm',
    name: 'addTracing',
    message: 'Would you like to add opentracing and integration with Jaeger?',
    default: false
  },
  {
    type: 'confirm',
    name: 'addQuickStart',
    message: 'Would you like to include quick start examples?',
    default: false
  },
  {
    type: 'list',
    name: 'packageManager',
    message: 'What package manager would you like to use?',
    choices: ['npm', 'yarn'],
    default: 'npm'
  }
]
