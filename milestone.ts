import * as github from "@actions/github";
import { HandlerOpts } from "./types";

const { getOctokit } = github;
enum MilestoneAction {
  Created = "created",
  Deleted = "deleted",
  Edited = "edited",
  Opened = "opened",
  Closed = "closed",
}

interface Milestone {
  milestone_number: number;
  title: string;
  state: "open" | "closed";
  description: string;
  due_on: string;
}

interface MilestoneChange {
  from: string;
}

interface MilestoneChanges {
  title?: MilestoneChange;
  state: MilestoneChange;
  description?: MilestoneChange;
  due_on?: MilestoneChange;
}

export async function handleMilestoneEvent(opts: HandlerOpts) {
  const { octokit, owner, repos } = opts;
  const { action, milestone, changes } = github.context.payload;
  if (action === MilestoneAction.Created) {
    console.log("Creating milestone", milestone);
    createMilestone(octokit, owner, repos, milestone);
    // createMilestone(octokit, owner, repos, milestone);
  } else if (
    [
      MilestoneAction.Edited,
      MilestoneAction.Opened,
      MilestoneAction.Closed,
    ].includes(action as MilestoneAction)
  ) {
    console.log("Editing milestone", milestone);
    updateMilestone(octokit, owner, repos, milestone, changes);
  } else if (action === MilestoneAction.Deleted) {
    console.log("Deleting milestone", milestone);
    deleteMilestone(octokit, owner, repos, milestone);
  }
}

async function getMilestoneNumber(
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repo: string,
  title: string
): Promise<number | null> {
  console.log("Getting milestone number by title", title);
  // TODO: implement pagination
  const milestone = (
    await octokit.rest.issues.listMilestones({
      owner,
      repo,
      per_page: 100,
      direction: "desc",
    })
  ).data?.find((milestone) => milestone.title === title);

  return milestone?.number || null;
}

async function createMilestone(
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repos: string[],
  milestone: Milestone
) {

  const { title, state, description, due_on } = milestone;
  await Promise.allSettled(
    repos.map((repo) =>
      octokit.rest.issues.createMilestone({
        owner,
        repo,
        title,
        state,
        description,
        due_on
      })
    )
  );
}

async function updateMilestone(
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repos: string[],
  milestone: Milestone,
  changes: MilestoneChanges
) {
  await Promise.allSettled(
    repos.map(async (repo) => {
      const oldTitle = changes.title?.from || milestone.title;
      const number = await getMilestoneNumber(octokit, owner, repo, oldTitle);
      console.log({ repo, oldTitle, number });
      if (!number) return;
      const { title, state, description, due_on } = milestone;
      await octokit.rest.issues.updateMilestone({
        owner,
        repo,
        milestone_number: number,
        title,
        state,
        description,
        due_on,
      });
    })
  );
}

async function deleteMilestone(
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repos: string[],
  milestone: Milestone
) {
  await Promise.allSettled(
    repos.map(async (repo) => {
      const { title } = milestone;
      const number = await getMilestoneNumber(octokit, owner, repo, title);
      if (!number) return;
      await octokit.rest.issues.deleteMilestone({
        owner,
        repo,
        milestone_number: number,
      });
    })
  );
}
