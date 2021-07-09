const { Octokit } = require('@octokit/rest');
const chalk = require('chalk');
const terminalLink = require('terminal-link');
const fs = require('fs');
const os = require('os');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  const octokit = new Octokit({auth: process.env.GITHUB_TOKEN});

  const repos = await Promise.all(fs.readFileSync('projects.txt')
    .toString()
    .split('\n')
    .filter(s => s.length > 0)
    .map(repoName => {
      return octokit.rest.repos.get({
        owner: repoName.split('/')[0],
        repo: repoName.split('/')[1],
      })//.catch((e) => {
      //   console.log(repoName);
      //   console.log(e);
      // });
    }));

  const result = chalk.bold('Recent GitHub projects:\n') + repos
    .sort((repo1, repo2) => new Date(repo2.data.updated_at) - new Date(repo1.data.updated_at))
    .map(repo => {
      const daysSinceLastUpdate = Math.round((new Date() - new Date(repo.data.updated_at)) / (1000*60*60*24));
      let withColor = text => text;
      if(daysSinceLastUpdate < 7) withColor = chalk.green;
      else if(daysSinceLastUpdate < 21) withColor = chalk.yellow;
      else withColor = chalk.red;

      const projectName = repo.data.name;
      const projectUpdatedDate = new Date(repo.data.updated_at).toLocaleString()
      const vscodeUrl = `vscode://file/${os.homedir()}/code/${projectName}`;
      return withColor(`${terminalLink(chalk.bold(projectName), vscodeUrl)} (${projectUpdatedDate})`);
    })
    .join('\n');

  console.log(result);

})();

