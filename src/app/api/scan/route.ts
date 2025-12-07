import { NextRequest, NextResponse } from 'next/server';
import { scanRepository, parseGitHubUrl } from '@/lib/scanner';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, githubToken: userToken } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Validate GitHub URL format
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL. Please provide a valid public repository URL.' },
        { status: 400 }
      );
    }

    // Use user-provided token first, then fall back to environment token
    const githubToken = userToken || process.env.GITHUB_TOKEN;

    // Perform the scan
    const result = await scanRepository(repoUrl, githubToken);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    // Handle specific error cases
    if (errorMessage.includes('private') || errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          error:
            'This repo appears to be private or inaccessible. For now, VibeSec only supports public repositories.',
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes('Rate limit')) {
      return NextResponse.json(
        {
          error:
            'GitHub API rate limit exceeded. Please try again in a few minutes or add a GitHub token.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
