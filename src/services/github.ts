import { Octokit } from 'octokit';
import { Issue, GitHubCredentials } from '../types';

interface GitHubError extends Error {
  status?: number;
  headers?: {
    'x-ratelimit-remaining'?: string;
    'x-ratelimit-reset'?: string;
    'retry-after'?: string;
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchIssues({ repo, token }: GitHubCredentials): Promise<Issue[]> {
  try {
    const [owner, repoName] = repo.split('/');
    
    if (!owner || !repoName) {
      throw new Error('Invalid repository format. Please use format: username/repository');
    }

    const octokit = new Octokit({ auth: token });
    let allIssues: Issue[] = [];
    let page = 1;
    const maxRetries = 3;
    let retryCount = 0;
    
    while (true) {
      try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
          owner,
          repo: repoName,
          state: 'all',
          per_page: 100,
          page: page,
          headers: {
            'accept': 'application/vnd.github.v3+json',
          },
        });

        const issues = response.data as Issue[];
        if (issues.length === 0) {
          break;
        }

        allIssues = [...allIssues, ...issues];
        page++;

        // Check remaining rate limit
        const remaining = parseInt(response.headers['x-ratelimit-remaining'] || '0', 10);
        if (remaining <= 1) {
          const resetTime = parseInt(response.headers['x-ratelimit-reset'] || '0', 10) * 1000;
          const now = Date.now();
          const waitTime = Math.max(resetTime - now, 0);
          if (waitTime > 0) {
            console.log(`Rate limit nearly exhausted. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
            await delay(waitTime + 100); // Add 100ms buffer
          }
        }

        // Add a small delay between requests to avoid secondary rate limits
        await delay(100);
      } catch (error) {
        const githubError = error as GitHubError;
        
        // Handle rate limiting errors
        if (githubError.status === 403 || githubError.status === 429) {
          retryCount++;
          
          if (retryCount > maxRetries) {
            throw new Error('Maximum retry attempts exceeded while fetching issues');
          }

          // Check for retry-after header first (secondary rate limit)
          const retryAfter = parseInt(githubError.headers?.['retry-after'] || '0', 10);
          if (retryAfter > 0) {
            console.log(`Secondary rate limit hit. Waiting ${retryAfter} seconds...`);
            await delay(retryAfter * 1000);
            continue;
          }

          // Check rate limit reset time
          const resetTime = parseInt(githubError.headers?.['x-ratelimit-reset'] || '0', 10) * 1000;
          const now = Date.now();
          const waitTime = Math.max(resetTime - now, 0);
          
          if (waitTime > 0) {
            console.log(`Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
            await delay(waitTime + 100); // Add 100ms buffer
            continue;
          }
        }

        throw error; // Re-throw if it's not a rate limit error
      }
    }

    return allIssues;
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
}