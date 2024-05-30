import { readFile, readdir, writeFile } from 'node:fs/promises';
import inquirer from 'inquirer';
import colors from '@colors/colors';
const tokenExpiration = 25 * 60 * 1000; //25 minutes
const getConfig = async () => {
    let config = {};
    try {
        config = JSON.parse(await readFile('config.json', 'utf-8'));
    }
    catch (e) {
        throw new Error('no config files found.')
    }
    return config;
}
const config = await getConfig();
const getAccessToken = async () => {
    let now = new Date();
    let accessTokenFile = '{}';
    try {

        accessTokenFile = await readFile('tokens.json', 'utf-8');
    }
    catch (e) {
        accessTokenFile = '{}';
    }
    let accessTokenJson = JSON.parse(accessTokenFile);
    if (accessTokenJson.expiration && new Date(accessTokenJson.expiration) > now) return accessTokenJson.token;
    let loginData = {
        username: keys.apiKey,
        apiKey: keys.apiSecret
    }
    let urllogin = 'https://services.cloud.mongodb.com/api/admin/v3.0/auth/providers/mongodb-cloud/login';
    let res = await fetch(urllogin, { method: 'post', body: JSON.stringify(loginData), headers: { 'Content-type': "application/json" } })
    let tokenData = await res.json();
    let access_token = tokenData.access_token;
    let expiration = new Date();
    expiration.setTime(expiration.getTime() + tokenExpiration);
    await writeFile('tokens.json', JSON.stringify({ token: access_token, expiration: expiration.toISOString() }));
    return access_token

}
const runFunction = async (userId, functionName, ...parameters) => {
    let accessToken = await getAccessToken();
    let source = await readFile(config.appFolder + '/functions/' + functionName, 'utf-8')

    let urlToCall = `https://services.cloud.mongodb.com/api/admin/v3.0/groups/${config.groupId}/apps/${config.appId}/debug/execute_function_source`
    if (userId) urlToCall += ('?user_id=' + userId);
    else urlToCall += "?run_as_system=true&user_id="
    let postData = {
        source: source,
        eval_source: 'exports(' + parameters + ')'
    }
    let res = await fetch(urlToCall, { method: 'post', body: JSON.stringify(postData), headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-type': "application/json" } })
    res = await res.json();
    if (res.error) console.log(colors.red(res.error));
    if (res.logs) res.logs.forEach(l => {
        console.log(colors.yellow(l));
    })
    if (res.result) console.log(colors.green(JSON.stringify(res.result, undefined, 2)));
    if (res.stats) {
        if (res.stats.execution_time) console.log(colors.cyan('Executed in ' + res.stats.execution_time))
    }
}
let startsWith = '';
let functionName = process.argv.find(el => el.startsWith('-f'));
if (functionName) {
    startsWith = functionName.split('=')[1];
}
let dir = await readdir(config.appFolder + '/functions');
dir = dir.filter(el => el != 'config.json' && el.startsWith(startsWith));
dir.sort((a, b) => a.localeCompare(b))
let questions = [{
    type: 'list',
    name: 'function',
    message: 'Which function do you want to run?',
    choices: dir
}, {
    type: 'input',
    name: 'user',
    message: 'Which user do you want to execute the function?'
}, {
    type: 'input',
    name: 'parameters',
    message: 'Insert your parameters:'
}];
let answers = await inquirer.prompt(questions);
await runFunction(answers.user, answers.function, answers.parameters);
