import * as core from "@actions/core";
import * as github from "@actions/github";
import { handleLabelEvent } from "./label";
import { handleMilestoneEvent } from "./milestone";

const owner = github.context.payload.organization.login;
const token = core.getInput("token");
const octokit = github.getOctokit(token);
const { name: currentRepo } = github.context.payload.repository;

const { eventName } = github.context;
console.log({ eventName });
async function main() {
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);
  try {
    const repos = (
      await octokit.rest.repos.listForOrg({
        org: owner,
      })
    ).data
      .filter((repo) => repo.private)
      ?.map(({ name }) => name)
      .filter((name) => name != currentRepo);

    if ("label" === eventName) {
      console.log("Handling label event");
      handleLabelEvent({ octokit, owner, repos });
    } else if ("milestone" === eventName) {
      console.log("Handling milestone event");
      handleMilestoneEvent({ octokit, owner, repos });
    }
  } catch (err) {
    core.setFailed(err.message);
  }
}

main();
