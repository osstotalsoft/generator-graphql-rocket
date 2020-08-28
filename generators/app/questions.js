const chalk = require('chalk');

module.exports = [
    {
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your project?',
        validate: appName => {
            const pass = appName.match(/^((?!-)[A-Za-z-.]{1,63}(?<!-))+$/)
            if (pass) {
                return true;
            }
            return `${chalk.red(
                "Provide a valid project name, only use letters and '-' or '.' separators! No digits, special characters and whitespace are allowed and do not start or end with a separator!"
            )}`;
        },
        default: "new-gql-server"
    },
    {
        type: 'input',
        name: 'gqlPort',
        message: 'What will be your gql server port?',
        default: "4000"
    },
    {
        type: 'confirm',
        name: 'withRights',
        message: 'Would you like to use and implement custom authorization for your GraphQL schema? This includes rights and permissions.',
        default: false
    },
    {
        type: 'confirm',
        name: 'withMultiTenancy',
        message: 'Would you like to use and implement multi-tenancy?',
        default: false
    },
    {
        type: "confirm",
        name: "addSubscriptions",
        message: 'Would you like to support subscriptions? This will also allow you to add some other cool features like messaging integration.',
        default: false
    },
    {
        type: "confirm",
        name: "addMessaging",
        message: 'Would you like to use messaging? This will allow you to receive and handle all events published in a Nats service. Read more here: https://github.com/osstotalsoft/nodebb',
        default: false,
        when: ({ addSubscriptions }) => addSubscriptions
    },    
    {
        type: "confirm",
        name: "addGqlLogging",
        message: 'Would you like to include GraphQL logging plugin?',
        default: false
    },
    {
        type: "confirm",
        name: "addHelm",
        message: 'Would you like to generate the default helm files?',
        default: false
    },
    {
      type: "input",
      name: "helmChartName",
      message: 'What is the name of your helm chart?',
      when: prompts => prompts.addHelm,
      default: prompts => prompts.projectName.toLowerCase(),
      validate: name => {
          const pass = name.match(/^[a-z0-9]+(?:[_-]{1,2}[a-z0-9]+)*$/)
          if (pass) {
              return true;
          }
          return `${chalk.red(
              "Provide a valid helm chart name, only use lower case letters, digits and '-' or '_' separators! No special characters and whitespace are allowed and do not start or end with a separator!"
          )}`;
      }
    },
    {
        type: "confirm",
        name: "addTracing",
        message: 'Would you like to add opentracing and integration with Jaeger?',
        default: false
    },
    {
        type: 'input',
        name: 'identityApiUrl',
        message: 'What is your Identity API url?',
        default: ""
    },
    {
        type: 'input',
        name: 'identityOpenIdConfig',
        message: 'What is your identity openId configuration?',
        default: ""
    },
    {
        type: 'input',
        name: 'identityAuthority',
        message: 'And the identity authority link?',
        default: ""
    },
    {
        type: "list",
        name: "packageManager",
        message: 'What package manager would you like to use?',
        choices: ['npm', 'yarn'],
        default: 'npm'
    }
]
