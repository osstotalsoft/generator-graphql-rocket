import boxen from 'boxen'
import updateNotifier from 'update-notifier'
import pkg from '../package.json' with { type: 'json' }
import chalk from 'chalk'

const notifier = updateNotifier({ pkg, updateCheckInterval: 0 })

export async function checkForLatestVersion() {
  const updateInfo = await notifier.fetchInfo()
  if (updateInfo.current !== '0.0.0') console.log(updateInfo.current)
  if (updateInfo && updateInfo.current !== '0.0.0' && updateInfo.current < updateInfo.latest) {
    const current = chalk.redBright(updateInfo.current)
    const latest = chalk.greenBright(updateInfo.latest)
    console.log(
      boxen(
        `${chalk.redBright(`UPDATE AVAILABLE!`)} 
Please update your generator before you use it!
${current} -> ${latest}
Enter ${chalk.cyanBright(`yo`)} and update the generator manually or run:
${chalk.cyanBright(`npm install -g @totalsoft/generator-graphql-rocket`)}
        `,
        {
          padding: 1,
          margin: 1,
          align: 'center',
          borderColor: 'yellow',
          borderStyle: 'round'
        }
      )
    )

    return false
  }

  return true
}

export async function getCurrentVersion() {
  const updateInfo = await notifier.fetchInfo()
  return updateInfo.current
}
