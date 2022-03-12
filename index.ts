import * as core from '@actions/core';
import * as github from '@actions/github';

const owner = github.context.payload.organization.login;
const token = core.getInput('token');
const team = core.getInput('team');
const octokit = github.getOctokit(token);

console.log({ eventName: github.context.eventName });
enum LabelAction {
  Created = 'created',
  Deleted = 'deleted',
}

async function handleLabelEvent() {
  const repos = (await octokit.rest.teams.listReposInOrg({
     org: owner,
     team_slug: team,
   })).data?.map(({ name }) => name);
  console.log({ repos });
  const { action, label } = github.context.payload; 
  if (action === LabelAction.Created) {
    console.log('Creating labels', label);
    createLabel(octokit, repos, label);
  }
}

interface Label {
  name: string;
  color: string;
  description: string;
}

async function createLabel(
   octokit: ReturnType<typeof github.getOctokit>,
   repos: string[],
   label: Label 
) {
 const { name, color, description } = label;
 await Promise.allSettled(repos.map(repo => 
   octokit.rest.issues.createLabel({
     owner,
     repo,
     name,
     color,
     description,
   })));  
}

async function main() {
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);

  try {
    if (github.context.payload.label) {
      console.log('Handling label event');
      handleLabelEvent();
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
