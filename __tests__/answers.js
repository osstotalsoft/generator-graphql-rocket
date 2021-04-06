'use strict'
const path = require('path')
const assert = require('yeoman-assert')
const helpers = require('yeoman-test')

describe('test package installers', () => {
    const projectName = 'test-graphql'
    const gqlPort = '4000'
    const defaultAnswers = {
        projectName,
        gqlPort,
        withMultiTenancy: false,
        addSubscriptions: false,
        addMessaging: false,
        withRights: false,
        addGqlLogging: false,
        addHelm: false,
        addTracing: false,
        identityApiUrl: "",
        identityOpenIdConfig: "",
        identityAuthority: 'localhost:5000',
        packageManager: 'npm'
    }

    const npm = '>= 10.0.0';
    const yarn = '>= 1.22.4';

    it('does not creat project if projectName is invalid', () => {
        const invalidProjectName = '111#@'

        return helpers
            .create(path.join(__dirname, '../generators/app'))
            .withPrompts({
                ...defaultAnswers,
                projectName: invalidProjectName
            })
            .run()
            .then(() => {
                assert.noFile(path.join(__dirname, invalidProjectName))
            })
    })

    it('does not contain subscriptions', () => {
        return helpers
            .create(path.join(__dirname, '../generators/app'))
            .withPrompts({
                ...defaultAnswers,
                addSubscriptions: false
            })
            .run()
            .then(() => {
                assert.noFile(path.join(__dirname, `${projectName}/src/pubSub/redisPubSub.js`))
            })
    })

    it('does not contain messaging', () => {
        return helpers
            .create(path.join(__dirname, '../generators/app'))
            .withPrompts({
                ...defaultAnswers,
                addMessaging: false
            })
            .run()
            .then(() => {
                assert.noFile(path.join(__dirname, `${projectName}/src/messaging`))
            })
    })

    it('does not contain helm files', () => {
        return helpers
            .create(path.join(__dirname, '../generators/app'))
            .withPrompts({
                ...defaultAnswers,
                addHelm: false
            })
            .run()
            .then(() => {
                assert.noFile(path.join(__dirname, `${projectName}/helm`))
            })
    })

})