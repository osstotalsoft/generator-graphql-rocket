import chalk from 'chalk'

const projectNameRegex = /^((?!-)[A-Za-z-._\d]{1,63}(?<!-))+$/

export const projectNameQ = {
  type: 'input',
  name: 'projectName',
  message: 'What is the name of your project?',
  validate: appName => {
    const isValid = projectNameRegex.test(appName)
    console.log('isValid', isValid)
    if (isValid) return true

    return `${chalk.red(
      "Provide a valid project name, only use letters and '-', '_' or '.' separators! No digits, special characters and whitespace are allowed and do not start or end with a separator!"
    )}`
  },
  default: 'new-gql-server'
}

export const usePrevConfigsQ = {
  type: 'confirm',
  name: 'usePrevConfigs',
  message:
    'You are regenerating over an existing project, would you like to use its previously saved generator configurations?',
  default: true
}

export const getQuestions = projectName => [
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
      if (name.match(/^((?!-)[A-Za-z-._\d]{1,63}(?<!-))+$/)) {
        return true
      }

      return `${chalk.red(
        "Provide a valid chart name, only use lower case letters, digits and '-' separators! No special characters and whitespace are allowed and do not start or end with a separator!"
      )}`
    }
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
  }
]
