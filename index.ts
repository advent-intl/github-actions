import * as core from "@actions/core";
import * as github from "@actions/github";

const owner = github.context.payload.organization.login;
const token = core.getInput("token");
const team = core.getInput("team");
const octokit = github.getOctokit(token);
const { name: currentRepo } = github.context.payload.repository;

console.log({ eventName: github.context.eventName });
enum LabelAction {
  Created = "created",
  Deleted = "deleted",
  Edited = "edited",
}

async function handleLabelEvent() {
  const repos = (
    await octokit.rest.teams.listReposInOrg({
      org: owner,
      team_slug: team,
    })
  ).data
    ?.map(({ name }) => name)
    .filter((name) => name != currentRepo);

  const { action, label, changes } = github.context.payload;
  if (action === LabelAction.Created) {
    console.log("Creating labels", label);
    createLabel(octokit, repos, label);
  } else if (action === LabelAction.Deleted) {
    console.log("Deleting labels", label);
    deleteLabel(octokit, repos, label);
  } else if (action === LabelAction.Edited) {
    console.log("Eiditing labels", label);
    editLabel(octokit, repos, label, changes);
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
  await Promise.allSettled(
    repos.map((repo) =>
      octokit.rest.issues.createLabel({
        owner,
        repo,
        name,
        color,
        description,
      })
    )
  );
}

async function deleteLabel(
  octokit: ReturnType<typeof github.getOctokit>,
  repos: string[],
  label: Label
) {
  const { name } = label;
  await Promise.allSettled(
    repos.map((repo) =>
      octokit.rest.issues.deleteLabel({
        owner,
        repo,
        name,
      })
    )
  );
}

interface LabelChange {
  from: string;
}

interface LabelChanges {
  color?: LabelChange;
  name?: LabelChange;
  description?: LabelChange;
}

async function editLabel(
  octokit: ReturnType<typeof github.getOctokit>,
  repos: string[],
  label: Label,
  changes: LabelChanges
) {
  const { name: new_name, description, color } = label;
  const name = changes.name?.from || label.name;
  await Promise.allSettled(
    repos.map((repo) =>
      octokit.rest.issues.updateLabel({
        owner,
        repo,
        name,
        new_name,
        description,
        color,
      })
    )
  );
}

async function main() {
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);

  try {
    if (github.context.payload.label) {
      console.log("Handling label event");
      handleLabelEvent();
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
