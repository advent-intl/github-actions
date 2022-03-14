import { getOctokit } from "@actions/github";

export interface HandlerOpts {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repos: string[];
}


