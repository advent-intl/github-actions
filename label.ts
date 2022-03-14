import * as github from "@actions/github";
import { HandlerOpts } from "./types";

enum LabelAction {
  Created = "created",
  Deleted = "deleted",
  Edited = "edited",
}

export async function handleLabelEvent(opts: HandlerOpts) {
  const { octokit, owner, repos } = opts;
  const { action, label, changes } = github.context.payload;
  if (action === LabelAction.Created) {
    console.log("Creating labels", label);
    createLabel(octokit, owner, repos, label);
  } else if (action === LabelAction.Deleted) {
    console.log("Deleting labels", label);
    deleteLabel(octokit, owner, repos, label);
  } else if (action === LabelAction.Edited) {
    console.log("Eiditing labels", label);
    editLabel(octokit, owner, repos, label, changes);
  }
}

interface Label {
  name: string;
  color: string;
  description: string;
}

async function createLabel(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
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
  owner: string,
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
  owner: string,
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
