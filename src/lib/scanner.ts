// Scanner core logic for SecureSiteScan security analysis

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingCategory =
  | 'Supabase RLS'
  | 'Secrets'
  | 'Client Auth'
  | 'SQL Injection'
  | 'XSS'
  | 'Env Exposure'
  | 'Auth Issues'
  | 'CORS'
  | 'Security Headers'
  | 'Cookies'
  | 'File Upload'
  | 'Rate Limiting'
  | 'Info Disclosure'
  | 'Insecure Redirect'
  | 'Input Validation'
  | 'Prototype Pollution'
  | 'SSRF'
  | 'Hardcoded IPs'
  | 'Debug Mode'
  | 'Commented Secrets'
  | 'NoSQL Injection'
  | 'GraphQL'
  | 'WebSocket'
  | 'Next.js'
  | 'Prisma'
  | 'ReDoS'
  | 'Mass Assignment'
  | 'Docker'
  | 'CI/CD'
  | 'Unprotected API'
  | 'CSRF'
  | 'IDOR'
  | 'Path Traversal'
  | 'Command Injection'
  | 'Vulnerable Dependencies'
  | 'Source Maps'
  | 'Insecure Randomness'
  | 'Missing Auth'
  | 'Unsafe Deserialization'
  | 'Clickjacking';

export interface Finding {
  id: string;
  filePath: string;
  lineNumber?: number;
  severity: Severity;
  title: string;
  description: string;
  codeSnippet: string;
  fixSnippet: string;
  category: FindingCategory;
}

export interface ScanResult {
  repoName: string;
  repoUrl: string;
  scannedAt: string;
  securityScore: number;
  findings: Finding[];
  truncated: boolean;
  filesScanned: number;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

// File extensions to scan
const SCANNABLE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',  // JavaScript/TypeScript
  '.sql',                                          // SQL
  '.json',                                         // Config files
  '.env',                                          // Environment files
  '.yaml', '.yml',                                 // YAML configs (Docker, CI/CD, K8s)
  '.toml',                                         // Rust/Python configs
  '.py',                                           // Python
  '.rb',                                           // Ruby
  '.go',                                           // Go
  '.php',                                          // PHP
  '.vue', '.svelte',                               // Frontend frameworks
  '.graphql', '.gql',                              // GraphQL
  '.prisma',                                       // Prisma schema
  '.sh', '.bash',                                  // Shell scripts
  '.xml',                                          // Maven, Android configs
];

// Special filenames to scan (without extension matching)
const SCANNABLE_FILENAMES = [
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  '.gitignore',
  '.npmrc',
  '.yarnrc',
];

// Patterns for env files (which may have multiple extensions like .env.local)
const ENV_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\..+$/,  // .env.local, .env.production, etc.
];

// Size limits
const MAX_FILE_SIZE = 500000; // 500KB per file
const MAX_TOTAL_FILES = 200;
const MAX_TOTAL_BYTES = 5000000; // 5MB total

// Parse GitHub URL to extract owner and repo
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/\?#]+)/,
    /github\.com:([^\/]+)\/([^\/\?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }
  return null;
}

// Fetch repository file tree from GitHub API
async function fetchRepoTree(
  owner: string,
  repo: string,
  token?: string
): Promise<{ files: GitHubTreeItem[]; error?: string }> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'SecureSiteScan-Scanner',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers }
  );

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      return { files: [], error: 'Repository not found or is private' };
    }
    if (repoResponse.status === 403) {
      return { files: [], error: 'Rate limit exceeded. Try again later.' };
    }
    return { files: [], error: `GitHub API error: ${repoResponse.status}` };
  }

  const repoData = await repoResponse.json();
  const defaultBranch = repoData.default_branch || 'main';

  const treeResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    { headers }
  );

  if (!treeResponse.ok) {
    return { files: [], error: `Failed to fetch repository tree: ${treeResponse.status}` };
  }

  const treeData = await treeResponse.json();
  return { files: treeData.tree || [] };
}

// Fetch file content from GitHub
async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string | null> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3.raw',
    'User-Agent': 'SecureSiteScan-Scanner',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );

  if (!response.ok) {
    return null;
  }

  return response.text();
}

// Check if file should be scanned based on extension or filename
function shouldScanFile(path: string): boolean {
  // Check special filenames first
  const filename = path.split('/').pop() || '';
  if (SCANNABLE_FILENAMES.includes(filename)) {
    return true;
  }

  // Check for env files (which can have multiple dots like .env.local)
  if (ENV_FILE_PATTERNS.some(pattern => pattern.test(filename))) {
    return true;
  }

  // Check extension
  const lastDot = path.lastIndexOf('.');
  if (lastDot === -1) return false;
  const ext = path.substring(lastDot).toLowerCase();
  return SCANNABLE_EXTENSIONS.includes(ext);
}

// Generate unique ID for findings
function generateFindingId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper to get line number from index
function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

// ============================================================================
// SECURITY CHECKS
// ============================================================================

// Check 1: Supabase RLS - Find tables without RLS enabled
function checkSupabaseRLS(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?(\w+)["']?/gi;
  let match;

  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const lineNumber = getLineNumber(content, match.index);

    const rlsPattern = new RegExp(
      `ALTER\\s+TABLE\\s+(?:public\\.)?["']?${tableName}["']?\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
      'i'
    );

    if (!rlsPattern.test(content)) {
      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity: 'CRITICAL',
        title: `RLS not enabled on table \`${tableName}\``,
        description:
          'Row Level Security (RLS) must be explicitly enabled on all tables to prevent unauthorized data access. Without RLS, anyone with the anon key can read/write all data.',
        codeSnippet: match[0],
        fixSnippet: `-- Add after your CREATE TABLE statement:\nALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;\n\n-- Then add a policy:\nCREATE POLICY "Users can only access their own data"\n  ON ${tableName}\n  FOR ALL\n  USING (auth.uid() = user_id);`,
        category: 'Supabase RLS',
      });
    }
  }

  const permissivePolicyRegex = /CREATE\s+POLICY\s+["']?([^"'\s]+)["']?[^;]*USING\s*\(\s*true\s*\)/gi;

  while ((match = permissivePolicyRegex.exec(content)) !== null) {
    const policyName = match[1];
    const lineNumber = getLineNumber(content, match.index);

    findings.push({
      id: generateFindingId(),
      filePath,
      lineNumber,
      severity: 'HIGH',
      title: `Over-permissive RLS policy: \`${policyName}\``,
      description:
        '`USING (true)` makes this policy grant access to everyone. This effectively bypasses Row Level Security.',
      codeSnippet: match[0].substring(0, 100) + '...',
      fixSnippet: `-- Replace USING (true) with proper auth checks:\nUSING (auth.uid() = user_id)\n\n-- Or for public read-only data:\nUSING (true) -- OK for SELECT on public data\nWITH CHECK (auth.uid() = user_id) -- But restrict writes`,
      category: 'Supabase RLS',
    });
  }

  return findings;
}

// Check 2: Hardcoded Secrets
function checkHardcodedSecrets(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  if (filePath.includes('.example') || filePath.includes('.sample')) {
    return findings;
  }

  const secretPatterns = [
    {
      name: 'Stripe Secret Key',
      pattern: /sk_live_[0-9a-zA-Z]{20,}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as STRIPE_SECRET_KEY and access via process.env on the server only.',
    },
    {
      name: 'Stripe Test Key',
      pattern: /sk_test_[0-9a-zA-Z]{20,}/g,
      severity: 'MEDIUM' as Severity,
      fix: 'Move to .env.local as STRIPE_SECRET_KEY. Test keys should not be committed.',
    },
    {
      name: 'Supabase Service Role Key',
      pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
      severity: 'CRITICAL' as Severity,
      fix: 'NEVER expose JWT tokens in client code. Use environment variables.',
    },
    {
      name: 'Supabase Service Role Reference',
      pattern: /["']service_role["']\s*[,:]/g,
      severity: 'HIGH' as Severity,
      fix: 'Ensure service_role key is only used in secure server-side contexts.',
    },
    {
      name: 'OpenAI API Key',
      pattern: /sk-[a-zA-Z0-9]{32,}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as OPENAI_API_KEY and access via process.env on the server only.',
    },
    {
      name: 'Generic API Key',
      pattern: /["']api[_-]?key["']\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
      severity: 'HIGH' as Severity,
      fix: 'Move API keys to environment variables and access via process.env.',
    },
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as AWS_ACCESS_KEY_ID. Never commit AWS credentials.',
    },
    {
      name: 'AWS Secret Key',
      pattern: /["']?aws_secret_access_key["']?\s*[:=]\s*["'][A-Za-z0-9\/+=]{40}["']/gi,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as AWS_SECRET_ACCESS_KEY. Never commit AWS credentials.',
    },
    {
      name: 'Private Key Block',
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Never commit private keys. Store securely and reference via environment variables.',
    },
    {
      name: 'Google API Key',
      pattern: /AIza[0-9A-Za-z\-_]{35}/g,
      severity: 'HIGH' as Severity,
      fix: 'Move to .env.local as GOOGLE_API_KEY. Restrict API key in Google Cloud Console.',
    },
    {
      name: 'GitHub Token',
      pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as GITHUB_TOKEN. Rotate this token immediately.',
    },
    {
      name: 'Slack Token',
      pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as SLACK_TOKEN. Rotate this token immediately.',
    },
    {
      name: 'Discord Token',
      pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local. Rotate this token immediately in Discord Developer Portal.',
    },
    {
      name: 'Twilio API Key',
      pattern: /SK[a-f0-9]{32}/g,
      severity: 'HIGH' as Severity,
      fix: 'Move to .env.local as TWILIO_API_KEY.',
    },
    {
      name: 'SendGrid API Key',
      pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as SENDGRID_API_KEY.',
    },
    {
      name: 'Mailgun API Key',
      pattern: /key-[a-zA-Z0-9]{32}/g,
      severity: 'HIGH' as Severity,
      fix: 'Move to .env.local as MAILGUN_API_KEY.',
    },
    {
      name: 'Database Connection String',
      pattern: /(mongodb|postgres|mysql|redis):\/\/[^\s"']+:[^\s"']+@[^\s"']+/gi,
      severity: 'CRITICAL' as Severity,
      fix: 'Move database connection strings to .env.local as DATABASE_URL.',
    },
    {
      name: 'Hardcoded Secret Variable',
      pattern: /(?:secret|password|passwd|apiSecret|api_secret|authToken|auth_token)\s*[:=]\s*["'][a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]{8,}["']/gi,
      severity: 'HIGH' as Severity,
      fix: 'Move secrets to environment variables and access via process.env.',
    },
    {
      name: 'Supabase URL with Key',
      pattern: /supabaseUrl\s*[:=]\s*["'][^"']+["'].*supabaseKey\s*[:=]\s*["'][^"']+["']/gs,
      severity: 'MEDIUM' as Severity,
      fix: 'Use environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
    },
    {
      name: 'Firebase Config with Keys',
      pattern: /apiKey\s*:\s*["'][A-Za-z0-9_-]{30,}["']/g,
      severity: 'HIGH' as Severity,
      fix: 'Move Firebase config to environment variables.',
    },
    {
      name: 'Anthropic API Key',
      pattern: /sk-ant-[a-zA-Z0-9-_]{40,}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to .env.local as ANTHROPIC_API_KEY.',
    },
    {
      name: 'Resend API Key',
      pattern: /re_[a-zA-Z0-9]{20,}/g,
      severity: 'HIGH' as Severity,
      fix: 'Move to .env.local as RESEND_API_KEY.',
    },
    {
      name: 'Clerk Secret Key',
      pattern: /sk_(?:live|test)_[a-zA-Z0-9]{20,}/g,
      severity: 'CRITICAL' as Severity,
      fix: 'Move to environment variables. Clerk secret keys should never be exposed.',
    },
  ];

  const safePatterns = [
    /NEXT_PUBLIC_SUPABASE_URL/i,
    /NEXT_PUBLIC_SUPABASE_ANON_KEY/i,
    /NEXT_PUBLIC_/i,
    /VITE_PUBLIC_/i,
    /process\.env\./i,
  ];

  for (const { name, pattern, severity, fix } of secretPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);
      const matchedText = match[0];

      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

      const isSafe = safePatterns.some((sp) => sp.test(line));
      if (isSafe) continue;

      const masked =
        matchedText.length > 12
          ? matchedText.substring(0, 8) + '...' + matchedText.substring(matchedText.length - 4)
          : matchedText;

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title: `Exposed ${name}`,
        description: `A ${name} was found in your source code. Secrets committed to version control can be extracted by anyone with access to the repository.`,
        codeSnippet: masked,
        fixSnippet: fix,
        category: 'Secrets',
      });
    }
  }

  return findings;
}

// Check 3: Client-side auth checks
function checkClientSideAuth(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  if (!content.includes('"use client"') && !content.includes("'use client'")) {
    return findings;
  }

  const authPatterns = [
    {
      pattern: /createClient\s*\(\s*["'][^"']+["']\s*,\s*["'][^"']+["']/g,
      title: 'Supabase client with inline credentials',
      description:
        'Supabase client is initialized with inline credentials in client code. Use environment variables instead.',
    },
    {
      pattern: /createBrowserClient\s*\(\s*["'][^"']+["']\s*,\s*["'][^"']+["']/g,
      title: 'Supabase browser client with inline credentials',
      description:
        'Supabase browser client has hardcoded credentials. Use NEXT_PUBLIC_ environment variables.',
    },
    {
      pattern: /if\s*\(\s*user\.role\s*===?\s*["']admin["']\s*\)/g,
      title: 'Admin role check in client code',
      description:
        'Checking user roles in client-side code is insecure. Users can modify JavaScript to bypass these checks.',
    },
    {
      pattern: /if\s*\(\s*user\.isAdmin\s*\)/g,
      title: 'isAdmin check in client code',
      description:
        'The isAdmin check is performed client-side and can be bypassed. Move authorization logic to the server.',
    },
    {
      pattern: /user\.role\s*===?\s*["'](?:admin|superuser|moderator|owner)["']/g,
      title: 'Privileged role check in client code',
      description:
        'Role-based access checks in client code can be bypassed. Enforce authorization on the server or in RLS policies.',
    },
    {
      pattern: /\.filter\([^)]*role\s*===?\s*["']admin["'][^)]*\)/g,
      title: 'Client-side admin filtering',
      description:
        'Filtering data by admin role in the browser means all data was sent to the client first. Filter on the server instead.',
    },
    {
      pattern: /localStorage\.getItem\s*\(\s*["'](?:token|auth|session|user)["']\s*\)/g,
      title: 'Auth token from localStorage',
      description:
        'Storing auth tokens in localStorage is vulnerable to XSS attacks. Use httpOnly cookies instead.',
    },
  ];

  for (const { pattern, title, description } of authPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity: 'HIGH',
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Move this check to:\n// 1. A Server Component or API route\n// 2. Supabase RLS policy\n// 3. Middleware\n\n// Example server-side check:\nexport async function GET() {\n  const session = await getServerSession();\n  if (session?.user?.role !== 'admin') {\n    return Response.json({ error: 'Unauthorized' }, { status: 403 });\n  }\n}`,
        category: 'Client Auth',
      });
    }
  }

  return findings;
}

// Check 4: SQL Injection
function checkSQLInjection(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const sqlPatterns = [
    {
      pattern: /query\s*\(\s*["'`](?:SELECT|INSERT|UPDATE|DELETE|DROP)[^"'`]*\$\{[^}]+\}/gi,
      title: 'SQL Injection via template literal',
      description: 'User input interpolated directly into SQL query. This allows attackers to execute arbitrary SQL.',
    },
    {
      pattern: /query\s*\(\s*["'](?:SELECT|INSERT|UPDATE|DELETE|DROP)[^"']*["']\s*\+\s*\w+/gi,
      title: 'SQL Injection via string concatenation',
      description: 'User input concatenated into SQL query string. Use parameterized queries instead.',
    },
    {
      pattern: /execute\s*\(\s*["'`](?:SELECT|INSERT|UPDATE|DELETE|DROP)[^"'`]*\$\{[^}]+\}/gi,
      title: 'SQL Injection in execute statement',
      description: 'User input interpolated directly into SQL execute statement.',
    },
    {
      pattern: /\.raw\s*\(\s*["'`](?:SELECT|INSERT|UPDATE|DELETE|DROP)[^"'`]*\$\{[^}]+\}/gi,
      title: 'SQL Injection in raw query',
      description: 'User input in raw SQL query. Raw queries bypass ORM protections.',
    },
    {
      pattern: /supabase\s*\.\s*rpc\s*\([^)]*\+\s*\w+/gi,
      title: 'Potential SQL Injection in Supabase RPC',
      description: 'String concatenation in RPC call may allow SQL injection.',
    },
  ];

  for (const { pattern, title, description } of sqlPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity: 'CRITICAL',
        title,
        description,
        codeSnippet: match[0].substring(0, 80) + (match[0].length > 80 ? '...' : ''),
        fixSnippet: `// Use parameterized queries instead:\n\n// Bad:\nquery("SELECT * FROM users WHERE id = " + id)\n\n// Good:\nquery("SELECT * FROM users WHERE id = $1", [id])\n\n// With Supabase:\nsupabase.from('users').select('*').eq('id', id)`,
        category: 'SQL Injection',
      });
    }
  }

  return findings;
}

// Check 5: XSS Vulnerabilities
function checkXSS(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const xssPatterns = [
    {
      pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
      title: 'dangerouslySetInnerHTML usage',
      description: 'Using dangerouslySetInnerHTML can lead to XSS attacks if the HTML is from user input.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /innerHTML\s*=\s*[^;]+/g,
      title: 'Direct innerHTML assignment',
      description: 'Setting innerHTML directly can lead to XSS if the content includes user input.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /outerHTML\s*=\s*[^;]+/g,
      title: 'Direct outerHTML assignment',
      description: 'Setting outerHTML directly can lead to XSS if the content includes user input.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /document\.write\s*\(/g,
      title: 'document.write usage',
      description: 'document.write can be exploited for XSS attacks. Use DOM manipulation methods instead.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /eval\s*\([^)]*\)/g,
      title: 'eval() usage detected',
      description: 'eval() executes arbitrary code and is a major security risk. Never use with user input.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /new\s+Function\s*\([^)]*\)/g,
      title: 'new Function() constructor',
      description: 'Function constructor is similar to eval() and can execute arbitrary code.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\$\{[^}]+\}.*<script/gi,
      title: 'Template literal with script tag',
      description: 'Interpolating variables into script tags can lead to XSS.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /href\s*=\s*["']?\s*javascript:/gi,
      title: 'JavaScript URL in href',
      description: 'javascript: URLs can execute arbitrary JavaScript code.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /on\w+\s*=\s*["']\s*\$\{/g,
      title: 'Event handler with interpolation',
      description: 'Interpolating user input into event handlers can lead to XSS.',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of xssPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Sanitize user input before rendering:\n\n// Option 1: Use a sanitization library\nimport DOMPurify from 'dompurify';\nconst clean = DOMPurify.sanitize(userInput);\n\n// Option 2: Use textContent instead of innerHTML\nelement.textContent = userInput;\n\n// Option 3: In React, avoid dangerouslySetInnerHTML\n// Just render text normally - React escapes by default\n<div>{userInput}</div>`,
        category: 'XSS',
      });
    }
  }

  return findings;
}

// Check 6: Environment Variable Exposure
function checkEnvExposure(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const envPatterns = [
    {
      pattern: /console\.log\s*\([^)]*process\.env/g,
      title: 'Environment variables logged to console',
      description: 'Logging environment variables can expose secrets in browser console or server logs.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /console\.log\s*\([^)]*(?:apiKey|secret|password|token|credential)/gi,
      title: 'Sensitive data logged to console',
      description: 'Logging sensitive data can expose secrets in logs.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /return\s+\{[^}]*process\.env\.[A-Z_]+[^}]*\}/g,
      title: 'Environment variable in API response',
      description: 'Returning environment variables in API responses can expose server secrets to clients.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /res\.(?:json|send)\s*\([^)]*process\.env/g,
      title: 'Environment variable sent in response',
      description: 'Sending environment variables in HTTP responses exposes server configuration.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /Response\.json\s*\([^)]*process\.env/g,
      title: 'Environment variable in Response.json',
      description: 'Including environment variables in API responses exposes secrets.',
      severity: 'CRITICAL' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of envPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Never log or return environment variables\n\n// Bad:\nconsole.log(process.env.API_KEY);\nreturn { key: process.env.SECRET };\n\n// Good:\nconsole.log('API call made'); // Log action, not secrets\nreturn { success: true }; // Return status, not secrets`,
        category: 'Env Exposure',
      });
    }
  }

  return findings;
}

// Check 7: Authentication Issues
function checkAuthIssues(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const authPatterns = [
    {
      pattern: /jwt\.sign\s*\([^)]*\{[^}]*\}[^)]*["'][a-zA-Z0-9]{10,}["']/g,
      title: 'Hardcoded JWT secret',
      description: 'JWT secret is hardcoded in source code. Move to environment variables.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /jwt\.sign\s*\([^)]*(?!expiresIn)[^)]*\)/g,
      title: 'JWT without expiration',
      description: 'JWT tokens should have an expiration time to limit exposure if compromised.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /password\s*[:=]\s*["'][^"']+["']/gi,
      title: 'Hardcoded password',
      description: 'Password is hardcoded in source code. Use environment variables or secure vaults.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /(?:password|passwd)\s*===?\s*(?:req\.|request\.|body\.)/g,
      title: 'Plain text password comparison',
      description: 'Comparing passwords directly suggests they may be stored in plain text. Use bcrypt or argon2.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /createHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/g,
      title: 'Weak hashing algorithm',
      description: 'MD5 and SHA1 are cryptographically weak. Use bcrypt, argon2, or scrypt for passwords.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /algorithm\s*[:=]\s*["'](?:HS256|none)["']/g,
      title: 'Weak JWT algorithm',
      description: 'HS256 is vulnerable to brute force. Consider RS256. Never use "none".',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /verify\s*[:=]\s*false/g,
      title: 'SSL/TLS verification disabled',
      description: 'Disabling certificate verification allows man-in-the-middle attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /rejectUnauthorized\s*[:=]\s*false/g,
      title: 'TLS certificate verification disabled',
      description: 'Disabling certificate verification allows man-in-the-middle attacks.',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of authPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Secure authentication practices:\n\n// 1. Use environment variables for secrets\nconst secret = process.env.JWT_SECRET;\n\n// 2. Always set token expiration\njwt.sign(payload, secret, { expiresIn: '1h' });\n\n// 3. Hash passwords with bcrypt\nimport bcrypt from 'bcrypt';\nconst hash = await bcrypt.hash(password, 12);\nconst valid = await bcrypt.compare(input, hash);`,
        category: 'Auth Issues',
      });
    }
  }

  return findings;
}

// Check 8: CORS Misconfigurations
function checkCORS(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const corsPatterns = [
    {
      pattern: /Access-Control-Allow-Origin["']?\s*[:=]\s*["']\*["']/g,
      title: 'CORS allows all origins',
      description: 'Allowing all origins (*) with credentials can expose your API to cross-origin attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /origin\s*[:=]\s*["']\*["'].*credentials\s*[:=]\s*true/gs,
      title: 'CORS wildcard with credentials',
      description: 'Using * origin with credentials: true is a security misconfiguration.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /credentials\s*[:=]\s*true.*origin\s*[:=]\s*["']\*["']/gs,
      title: 'CORS credentials with wildcard origin',
      description: 'Credentials should not be allowed with wildcard origins.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /Access-Control-Allow-Headers["']?\s*[:=]\s*["']\*["']/g,
      title: 'CORS allows all headers',
      description: 'Allowing all headers can expose your API to unexpected header-based attacks.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /Access-Control-Allow-Methods["']?\s*[:=]\s*["']\*["']/g,
      title: 'CORS allows all methods',
      description: 'Allowing all HTTP methods may expose dangerous operations.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of corsPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Configure CORS properly:\n\nconst corsOptions = {\n  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],\n  credentials: true,\n  methods: ['GET', 'POST', 'PUT', 'DELETE'],\n  allowedHeaders: ['Content-Type', 'Authorization'],\n};\n\n// Or validate origin dynamically:\norigin: (origin, callback) => {\n  const allowed = ['https://yourdomain.com'];\n  if (allowed.includes(origin)) callback(null, true);\n  else callback(new Error('Not allowed'));\n}`,
        category: 'CORS',
      });
    }
  }

  return findings;
}

// Check 9: Missing Security Headers
function checkSecurityHeaders(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Only check config files and middleware
  if (!filePath.includes('next.config') && !filePath.includes('middleware') && !filePath.includes('headers')) {
    return findings;
  }

  const headerChecks = [
    {
      header: 'Content-Security-Policy',
      pattern: /Content-Security-Policy/i,
      title: 'Missing Content-Security-Policy header',
      description: 'CSP helps prevent XSS attacks by controlling which resources can be loaded.',
    },
    {
      header: 'X-Frame-Options',
      pattern: /X-Frame-Options/i,
      title: 'Missing X-Frame-Options header',
      description: 'Without this header, your site may be vulnerable to clickjacking attacks.',
    },
    {
      header: 'X-Content-Type-Options',
      pattern: /X-Content-Type-Options/i,
      title: 'Missing X-Content-Type-Options header',
      description: 'This header prevents MIME-type sniffing attacks.',
    },
    {
      header: 'Strict-Transport-Security',
      pattern: /Strict-Transport-Security/i,
      title: 'Missing HSTS header',
      description: 'HSTS ensures browsers only connect via HTTPS.',
    },
  ];

  // Check if this looks like a headers config file
  if (filePath.includes('next.config') || content.includes('headers')) {
    for (const { header, pattern, title, description } of headerChecks) {
      if (!pattern.test(content)) {
        findings.push({
          id: generateFindingId(),
          filePath,
          severity: 'MEDIUM',
          title,
          description,
          codeSnippet: `Missing: ${header}`,
          fixSnippet: `// Add to next.config.js:\nmodule.exports = {\n  async headers() {\n    return [{\n      source: '/:path*',\n      headers: [\n        { key: 'X-Frame-Options', value: 'DENY' },\n        { key: 'X-Content-Type-Options', value: 'nosniff' },\n        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },\n        { key: 'Content-Security-Policy', value: "default-src 'self'" },\n      ],\n    }];\n  },\n};`,
          category: 'Security Headers',
        });
      }
    }
  }

  return findings;
}

// Check 10: Insecure Cookies
function checkInsecureCookies(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const cookiePatterns = [
    {
      pattern: /setCookie\s*\([^)]+\)/gi,
      isVulnerable: (match: string) => !match.toLowerCase().includes('httponly'),
      title: 'Cookie without httpOnly flag',
      description: 'Cookies without httpOnly can be accessed by JavaScript, making them vulnerable to XSS theft.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /["']?cookie["']?\s*[:=]\s*\{[^}]*\}/gi,
      isVulnerable: (match: string) => !match.toLowerCase().includes('httponly'),
      title: 'Cookie configuration missing httpOnly',
      description: 'Session cookies should have httpOnly flag to prevent JavaScript access.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /document\.cookie\s*=/g,
      isVulnerable: () => true,
      title: 'Client-side cookie manipulation',
      description: 'Setting cookies via document.cookie means they cannot be httpOnly.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /sameSite\s*[:=]\s*["']?none["']?/gi,
      isVulnerable: () => true,
      title: 'Cookie with SameSite=None',
      description: 'SameSite=None allows cross-site requests. Ensure this is intentional and Secure flag is set.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, isVulnerable, title, description, severity } of cookiePatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      if (!isVulnerable(match[0])) continue;

      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Secure cookie configuration:\n\nres.cookie('session', token, {\n  httpOnly: true,    // Prevents JavaScript access\n  secure: true,      // HTTPS only\n  sameSite: 'strict', // Prevents CSRF\n  maxAge: 3600000,   // 1 hour expiration\n  path: '/',\n});\n\n// Or with next-auth / auth.js:\ncookies: {\n  sessionToken: {\n    options: { httpOnly: true, secure: true, sameSite: 'lax' }\n  }\n}`,
        category: 'Cookies',
      });
    }
  }

  return findings;
}

// Check 11: File Upload Vulnerabilities
function checkFileUpload(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const uploadPatterns = [
    {
      pattern: /multer\s*\(\s*\{[^}]*\}\s*\)/g,
      isVulnerable: (match: string) => !match.includes('fileFilter') && !match.includes('limits'),
      title: 'Multer without file validation',
      description: 'File uploads without type validation can allow malicious file uploads.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /upload\.(?:single|array|fields)\s*\(/g,
      isVulnerable: () => true,
      title: 'File upload endpoint detected',
      description: 'Ensure file uploads validate file type, size, and scan for malware.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /writeFile(?:Sync)?\s*\([^,]+,\s*(?:req\.body|body|file)/g,
      isVulnerable: () => true,
      title: 'Direct file write from request',
      description: 'Writing request data directly to files without validation is dangerous.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /destination\s*[:=]\s*["'](?:\.\/)?public/g,
      isVulnerable: () => true,
      title: 'Uploads stored in public directory',
      description: 'Storing uploads in public directories may expose sensitive files.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /filename\s*[:=]\s*(?:req\.|file\.original)/g,
      isVulnerable: () => true,
      title: 'Using original filename',
      description: 'Using original filenames can lead to path traversal or file overwrites.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, isVulnerable, title, description, severity } of uploadPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      if (!isVulnerable(match[0])) continue;

      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Secure file upload configuration:\n\nconst upload = multer({\n  storage: multer.diskStorage({\n    destination: './uploads', // Not in public!\n    filename: (req, file, cb) => {\n      const uniqueName = crypto.randomUUID() + path.extname(file.originalname);\n      cb(null, uniqueName);\n    }\n  }),\n  fileFilter: (req, file, cb) => {\n    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];\n    cb(null, allowed.includes(file.mimetype));\n  },\n  limits: { fileSize: 5 * 1024 * 1024 } // 5MB\n});`,
        category: 'File Upload',
      });
    }
  }

  return findings;
}

// Check 12: Rate Limiting Absence
function checkRateLimiting(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Only check API routes
  if (!filePath.includes('api') && !filePath.includes('route')) {
    return findings;
  }

  const authEndpoints = [
    /export\s+(?:async\s+)?function\s+POST[^{]*\{[^}]*(?:login|signin|sign-in|auth)/gi,
    /export\s+(?:async\s+)?function\s+POST[^{]*\{[^}]*(?:register|signup|sign-up)/gi,
    /export\s+(?:async\s+)?function\s+POST[^{]*\{[^}]*(?:password|reset|forgot)/gi,
  ];

  // Check if file has rate limiting
  const hasRateLimiting =
    content.includes('rateLimit') ||
    content.includes('rate-limit') ||
    content.includes('upstash') ||
    content.includes('limiter');

  if (!hasRateLimiting) {
    for (const pattern of authEndpoints) {
      let match;
      pattern.lastIndex = 0;

      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = getLineNumber(content, match.index);

        findings.push({
          id: generateFindingId(),
          filePath,
          lineNumber,
          severity: 'MEDIUM',
          title: 'Auth endpoint without rate limiting',
          description:
            'Authentication endpoints without rate limiting are vulnerable to brute force attacks.',
          codeSnippet: match[0].substring(0, 50) + '...',
          fixSnippet: `// Add rate limiting to auth endpoints:\n\nimport { Ratelimit } from '@upstash/ratelimit';\nimport { Redis } from '@upstash/redis';\n\nconst ratelimit = new Ratelimit({\n  redis: Redis.fromEnv(),\n  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute\n});\n\nexport async function POST(req) {\n  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';\n  const { success } = await ratelimit.limit(ip);\n  \n  if (!success) {\n    return Response.json({ error: 'Too many requests' }, { status: 429 });\n  }\n  // ... rest of handler\n}`,
          category: 'Rate Limiting',
        });
        break; // Only report once per file
      }
    }
  }

  return findings;
}

// Check 13: Information Disclosure
function checkInfoDisclosure(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const disclosurePatterns = [
    {
      pattern: /catch\s*\([^)]*\)\s*\{[^}]*(?:res\.json|Response\.json|return)[^}]*(?:error|err)\.(?:message|stack)/g,
      title: 'Error details exposed in response',
      description: 'Exposing error messages or stack traces can reveal system internals to attackers.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /console\.(?:log|error|warn)\s*\([^)]*(?:password|secret|token|key|credential)/gi,
      title: 'Sensitive data in console output',
      description: 'Logging sensitive data can expose secrets in server logs.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /X-Powered-By/g,
      title: 'X-Powered-By header present',
      description: 'This header reveals technology stack information to attackers.',
      severity: 'LOW' as Severity,
    },
    {
      pattern: /Server\s*[:=]\s*["'][^"']+["']/g,
      title: 'Server header with version',
      description: 'Server headers with version info help attackers identify vulnerabilities.',
      severity: 'LOW' as Severity,
    },
    {
      pattern: /throw\s+new\s+Error\s*\([^)]*(?:password|secret|token|key)/gi,
      title: 'Sensitive data in error message',
      description: 'Error messages containing sensitive data may be logged or exposed.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of disclosurePatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Handle errors safely:\n\ntry {\n  // ... operation\n} catch (error) {\n  console.error('Operation failed:', error); // Log internally\n  \n  // Return generic message to client\n  return Response.json(\n    { error: 'An error occurred. Please try again.' },\n    { status: 500 }\n  );\n}\n\n// Remove X-Powered-By in next.config.js:\nmodule.exports = {\n  poweredByHeader: false,\n};`,
        category: 'Info Disclosure',
      });
    }
  }

  return findings;
}

// Check 14: Insecure Redirects
function checkInsecureRedirects(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const redirectPatterns = [
    {
      pattern: /redirect\s*\(\s*(?:req\.query|searchParams\.get|params)\.[^)]+\)/g,
      title: 'Open redirect vulnerability',
      description: 'Redirecting to user-controlled URLs can lead to phishing attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /(?:res\.redirect|redirect)\s*\(\s*(?:req\.body|body)\.[^)]+\)/g,
      title: 'Redirect from request body',
      description: 'Redirecting to URLs from request body is dangerous without validation.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /window\.location\s*=\s*(?:.*\+|`\$\{)/g,
      title: 'Dynamic client-side redirect',
      description: 'Constructing redirect URLs from variables can lead to open redirects.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /router\.push\s*\(\s*(?:.*\+|`\$\{)/g,
      title: 'Dynamic router.push with variables',
      description: 'Using unsanitized input in router.push can lead to open redirects.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of redirectPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Validate redirect URLs:\n\nconst ALLOWED_HOSTS = ['yourdomain.com', 'app.yourdomain.com'];\n\nfunction safeRedirect(url: string): string {\n  try {\n    const parsed = new URL(url, 'https://yourdomain.com');\n    if (ALLOWED_HOSTS.includes(parsed.host)) {\n      return parsed.toString();\n    }\n  } catch {}\n  return '/'; // Default to home\n}\n\n// Usage:\nredirect(safeRedirect(userInput));`,
        category: 'Insecure Redirect',
      });
    }
  }

  return findings;
}

// Check 15: Missing Input Validation
function checkInputValidation(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Only check API routes and server actions
  if (!filePath.includes('api') && !filePath.includes('route') && !filePath.includes('action')) {
    return findings;
  }

  const validationPatterns = [
    {
      pattern: /(?:req\.body|body)\.[a-zA-Z]+(?!\s*\?\s*\.)/g,
      check: (content: string) =>
        !content.includes('zod') && !content.includes('yup') && !content.includes('joi') && !content.includes('validate'),
      title: 'Request body used without validation',
      description: 'Using request body data without validation can lead to injection attacks.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /await\s+request\.json\s*\(\)/g,
      check: (content: string) =>
        !content.includes('zod') && !content.includes('yup') && !content.includes('schema') && !content.includes('validate'),
      title: 'JSON body parsed without validation',
      description: 'Parse JSON body should be validated against a schema.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /searchParams\.get\s*\([^)]+\)/g,
      check: (content: string) => !content.includes('parseInt') && !content.includes('validate') && !content.includes('schema'),
      title: 'Query params used without validation',
      description: 'Query parameters should be validated and sanitized before use.',
      severity: 'LOW' as Severity,
    },
  ];

  for (const { pattern, check, title, description, severity } of validationPatterns) {
    if (!check(content)) continue;

    let match;
    pattern.lastIndex = 0;
    let found = false;

    while ((match = pattern.exec(content)) !== null) {
      if (found) break; // Only report once per file
      found = true;

      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Validate input with Zod:\n\nimport { z } from 'zod';\n\nconst schema = z.object({\n  email: z.string().email(),\n  name: z.string().min(1).max(100),\n  age: z.number().int().positive().optional(),\n});\n\nexport async function POST(req: Request) {\n  const body = await req.json();\n  const result = schema.safeParse(body);\n  \n  if (!result.success) {\n    return Response.json(\n      { error: 'Invalid input', details: result.error.issues },\n      { status: 400 }\n    );\n  }\n  \n  const { email, name, age } = result.data;\n  // Now safely use validated data\n}`,
        category: 'Input Validation',
      });
    }
  }

  return findings;
}

// Check 16: Prototype Pollution
function checkPrototypePollution(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const pollutionPatterns = [
    {
      pattern: /Object\.assign\s*\(\s*\{\s*\}\s*,\s*(?:req\.|body|params|query)/g,
      title: 'Object.assign with user input',
      description: 'Object.assign with user input can lead to prototype pollution attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.\.\.\s*(?:req\.body|body|params|query)/g,
      title: 'Spread operator with user input',
      description: 'Spreading user input directly can allow prototype pollution.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /\[(?:key|prop|name)\]\s*=\s*(?:value|val|v)/g,
      title: 'Dynamic property assignment',
      description: 'Assigning to dynamic properties can pollute object prototypes.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /lodash|underscore/g,
      check: (content: string) => content.includes('merge') || content.includes('defaultsDeep'),
      title: 'Potentially vulnerable lodash usage',
      description: 'Some lodash functions like merge and defaultsDeep are vulnerable to prototype pollution.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, check, title, description, severity } of pollutionPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      if (check && !check(content)) continue;

      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Prevent prototype pollution:\n\n// 1. Validate keys before assignment\nconst FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];\nif (FORBIDDEN_KEYS.includes(key)) throw new Error('Invalid key');\n\n// 2. Use Object.create(null) for dictionaries\nconst safeObj = Object.create(null);\n\n// 3. Freeze prototypes in critical code\nObject.freeze(Object.prototype);\n\n// 4. Use a validation library\nimport { z } from 'zod';\nconst schema = z.record(z.string(), z.unknown());`,
        category: 'Prototype Pollution',
      });
    }
  }

  return findings;
}

// Check 17: SSRF (Server-Side Request Forgery)
function checkSSRF(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const ssrfPatterns = [
    {
      pattern: /fetch\s*\(\s*(?:req\.|body\.|params\.|query\.)[^)]+\)/g,
      title: 'Fetch with user-controlled URL',
      description: 'Fetching user-provided URLs can allow SSRF attacks against internal services.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /axios\.(?:get|post|put|delete)\s*\(\s*(?:req\.|body\.|params\.)[^)]+\)/g,
      title: 'Axios request with user-controlled URL',
      description: 'Making HTTP requests to user-provided URLs can allow SSRF attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /fetch\s*\(\s*`[^`]*\$\{[^}]*(?:url|uri|host|endpoint|target)[^}]*\}[^`]*`/gi,
      title: 'Fetch with interpolated URL variable',
      description: 'URL interpolation in fetch calls can be exploited for SSRF.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /new\s+URL\s*\(\s*(?:req\.|body\.|params\.)/g,
      title: 'URL construction from user input',
      description: 'Constructing URLs from user input without validation can lead to SSRF.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /http\.(?:get|request)\s*\(\s*(?:req\.|body\.)/g,
      title: 'HTTP request with user-controlled options',
      description: 'Node.js http module with user input can be exploited for SSRF.',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of ssrfPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Prevent SSRF:\n\n// 1. Use an allowlist of permitted domains\nconst ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];\n\nfunction validateUrl(urlString: string): boolean {\n  try {\n    const url = new URL(urlString);\n    // Block internal/private IPs\n    if (url.hostname === 'localhost' || \n        url.hostname === '127.0.0.1' ||\n        url.hostname.startsWith('192.168.') ||\n        url.hostname.startsWith('10.')) {\n      return false;\n    }\n    return ALLOWED_HOSTS.includes(url.hostname);\n  } catch {\n    return false;\n  }\n}\n\n// 2. Never fetch user-provided URLs directly\nif (!validateUrl(userUrl)) {\n  throw new Error('URL not allowed');\n}`,
        category: 'SSRF',
      });
    }
  }

  return findings;
}

// Check 18: Hardcoded IPs and localhost in production
function checkHardcodedIPs(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Skip test files and examples
  if (filePath.includes('test') || filePath.includes('spec') || filePath.includes('.example')) {
    return findings;
  }

  const ipPatterns = [
    {
      pattern: /["'`]https?:\/\/localhost[:\d]*[^"'`]*["'`]/g,
      title: 'Hardcoded localhost URL',
      description: 'Localhost URLs in production code will fail in deployed environments.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /["'`]https?:\/\/127\.0\.0\.1[:\d]*[^"'`]*["'`]/g,
      title: 'Hardcoded 127.0.0.1 URL',
      description: 'Loopback IP addresses should be replaced with environment variables.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /["'`]https?:\/\/192\.168\.\d{1,3}\.\d{1,3}[^"'`]*["'`]/g,
      title: 'Hardcoded private IP (192.168.x.x)',
      description: 'Private network IPs will not work in production. Use environment variables.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /["'`]https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}[^"'`]*["'`]/g,
      title: 'Hardcoded private IP (10.x.x.x)',
      description: 'Private network IPs will not work in production. Use environment variables.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /["'`]https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}[^"'`]*["'`]/g,
      title: 'Hardcoded private IP (172.16-31.x.x)',
      description: 'Private network IPs will not work in production. Use environment variables.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /0\.0\.0\.0/g,
      title: 'Binding to 0.0.0.0',
      description: 'Binding to all interfaces may expose the service unintentionally.',
      severity: 'LOW' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of ipPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Use environment variables for URLs:\n\nconst API_URL = process.env.API_URL || 'http://localhost:3000';\n\n// In .env.local (development):\nAPI_URL=http://localhost:3000\n\n// In production environment:\nAPI_URL=https://api.yourapp.com`,
        category: 'Hardcoded IPs',
      });
    }
  }

  return findings;
}

// Check 19: Debug mode and development settings
function checkDebugMode(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const debugPatterns = [
    {
      pattern: /DEBUG\s*[:=]\s*["']?true["']?/gi,
      title: 'Debug mode enabled',
      description: 'Debug mode should be disabled in production to prevent information disclosure.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /NODE_ENV\s*[:=]\s*["']development["']/g,
      title: 'NODE_ENV set to development',
      description: 'Development mode committed to source code. Use environment configuration.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /debugger\s*;/g,
      title: 'Debugger statement',
      description: 'Debugger statements should never be committed to production code.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /VERBOSE\s*[:=]\s*["']?true["']?/gi,
      title: 'Verbose logging enabled',
      description: 'Verbose logging can expose sensitive data. Disable in production.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /devTools\s*[:=]\s*true/g,
      title: 'DevTools enabled',
      description: 'Developer tools should be disabled in production builds.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of debugPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Control debug settings via environment:\n\nconst DEBUG = process.env.DEBUG === 'true';\nconst isProduction = process.env.NODE_ENV === 'production';\n\n// Use conditional logging:\nif (!isProduction) {\n  console.log('Debug info');\n}\n\n// Or use a proper logger:\nimport pino from 'pino';\nconst logger = pino({ level: process.env.LOG_LEVEL || 'info' });`,
        category: 'Debug Mode',
      });
    }
  }

  return findings;
}

// Check 20: Commented credentials and TODO secrets
function checkCommentedSecrets(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const commentPatterns = [
    {
      pattern: /\/\/.*(?:password|passwd|pwd)\s*[:=]\s*\S+/gi,
      title: 'Password in comment',
      description: 'Credentials in comments are still visible in source control.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\/\/.*(?:api[_-]?key|apikey)\s*[:=]\s*\S+/gi,
      title: 'API key in comment',
      description: 'API keys in comments are still visible in source control.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\/\/.*(?:secret|token)\s*[:=]\s*\S+/gi,
      title: 'Secret/token in comment',
      description: 'Secrets in comments are still visible in source control.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\/\*[\s\S]*?(?:password|secret|api[_-]?key)\s*[:=]\s*\S+[\s\S]*?\*\//gi,
      title: 'Credential in block comment',
      description: 'Credentials in block comments are still visible in source control.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /#.*(?:password|secret|api[_-]?key|token)\s*[:=]\s*\S+/gi,
      title: 'Credential in hash comment',
      description: 'Credentials in comments are still visible in source control.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /TODO:?\s*(?:remove|delete|fix).*(?:password|secret|key|token)/gi,
      title: 'TODO referencing credentials',
      description: 'TODOs about removing credentials indicate they may still be present.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /FIXME:?\s*.*(?:password|secret|key|token|credential)/gi,
      title: 'FIXME referencing credentials',
      description: 'FIXME about credentials indicates a security issue needs attention.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of commentPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Never leave credentials in comments!\n\n// Bad:\n// password = "mysecretpassword"\n// TODO: remove this API key\n\n// Good:\n// Remove all credential references from source code\n// Use environment variables instead`,
        category: 'Commented Secrets',
      });
    }
  }

  return findings;
}

// Check 21: NoSQL Injection (MongoDB, etc.)
function checkNoSQLInjection(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const nosqlPatterns = [
    {
      pattern: /\$where\s*:\s*(?:req\.|body\.|params\.|query\.)/g,
      title: 'MongoDB $where with user input',
      description: '$where operator with user input allows arbitrary JavaScript execution.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /\$regex\s*:\s*(?:req\.|body\.|params\.|query\.)/g,
      title: 'MongoDB $regex with user input',
      description: 'User-controlled regex can cause ReDoS attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.find\s*\(\s*\{[^}]*\$(?:ne|gt|lt|gte|lte|in|nin)\s*:\s*(?:req\.|body\.)/g,
      title: 'MongoDB query operator with user input',
      description: 'Query operators with unsanitized user input can bypass authentication.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.findOne\s*\(\s*(?:req\.body|body|params)/g,
      title: 'MongoDB findOne with direct user input',
      description: 'Passing user input directly to findOne can lead to NoSQL injection.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.aggregate\s*\(\s*\[\s*\{[^}]*(?:req\.|body\.)/g,
      title: 'MongoDB aggregation with user input',
      description: 'User input in aggregation pipeline can be dangerous.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /JSON\.parse\s*\([^)]*(?:req\.|body\.|query\.)/g,
      title: 'JSON.parse on user input for query',
      description: 'Parsing user JSON for database queries can inject operators.',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of nosqlPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Prevent NoSQL injection:\n\n// 1. Sanitize input - remove $ operators\nfunction sanitize(obj) {\n  for (const key in obj) {\n    if (key.startsWith('$')) delete obj[key];\n  }\n  return obj;\n}\n\n// 2. Use explicit field matching\nconst user = await User.findOne({\n  email: String(req.body.email), // Cast to string\n  password: String(req.body.password)\n});\n\n// 3. Use a validation library\nimport { z } from 'zod';\nconst schema = z.object({ email: z.string().email() });`,
        category: 'NoSQL Injection',
      });
    }
  }

  return findings;
}

// Check 22: GraphQL security issues
function checkGraphQL(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const graphqlPatterns = [
    {
      pattern: /introspection\s*:\s*true/g,
      title: 'GraphQL introspection enabled',
      description: 'Introspection should be disabled in production to hide schema details.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /playground\s*:\s*true/g,
      title: 'GraphQL Playground enabled',
      description: 'GraphQL Playground should be disabled in production.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /graphiql\s*:\s*true/gi,
      title: 'GraphiQL enabled',
      description: 'GraphiQL IDE should be disabled in production.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /type\s+Mutation\s*\{[^}]*(?:delete|remove|update|create)[^}]*\}/gi,
      title: 'Mutations possibly without auth directives',
      description: 'GraphQL mutations should be protected with authentication.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  // Check for missing depth limiting (inverse check)
  if (filePath.includes('graphql') || content.includes('ApolloServer') || content.includes('createSchema')) {
    if (!content.includes('depthLimit') && !content.includes('queryComplexity')) {
      findings.push({
        id: generateFindingId(),
        filePath,
        severity: 'HIGH',
        title: 'Missing GraphQL query depth limiting',
        description: 'Without depth limits, deeply nested queries can cause DoS attacks.',
        codeSnippet: 'No depth limiting configured',
        fixSnippet: `// Add query depth limiting:\n\nimport depthLimit from 'graphql-depth-limit';\nimport { createComplexityLimitRule } from 'graphql-validation-complexity';\n\nconst server = new ApolloServer({\n  typeDefs,\n  resolvers,\n  validationRules: [\n    depthLimit(10), // Max depth of 10\n    createComplexityLimitRule(1000), // Max complexity\n  ],\n});`,
        category: 'GraphQL',
      });
    }
  }

  for (const { pattern, title, description, severity } of graphqlPatterns) {

    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Secure GraphQL configuration:\n\nconst server = new ApolloServer({\n  typeDefs,\n  resolvers,\n  introspection: process.env.NODE_ENV !== 'production',\n  playground: process.env.NODE_ENV !== 'production',\n  validationRules: [depthLimit(10)],\n});`,
        category: 'GraphQL',
      });
    }
  }

  return findings;
}

// Check 23: WebSocket security
function checkWebSocket(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const wsPatterns = [
    {
      pattern: /new\s+WebSocket\s*\(\s*["'`]ws:/g,
      title: 'Unencrypted WebSocket (ws://)',
      description: 'Use wss:// for encrypted WebSocket connections.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /verifyClient\s*:\s*false/g,
      title: 'WebSocket client verification disabled',
      description: 'Client verification should be enabled to prevent unauthorized connections.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /ws\.send\s*\(\s*JSON\.stringify\s*\([^)]*(?:password|secret|token)/gi,
      title: 'Sensitive data sent via WebSocket',
      description: 'Avoid sending sensitive data over WebSocket without encryption.',
      severity: 'HIGH' as Severity,
    },
  ];

  // Check for WebSocket server without origin validation
  if (content.includes('WebSocketServer') || content.includes('ws.Server')) {
    if (!content.includes('verifyClient') && !content.includes('origin')) {
      findings.push({
        id: generateFindingId(),
        filePath,
        severity: 'MEDIUM',
        title: 'WebSocket server possibly without origin validation',
        description: 'WebSocket connections should validate the origin header to prevent cross-site attacks.',
        codeSnippet: 'No verifyClient or origin check found',
        fixSnippet: `// Add origin validation to WebSocket server:\n\nconst wss = new WebSocketServer({\n  server,\n  verifyClient: ({ origin, req }, callback) => {\n    const allowed = ['https://yourdomain.com'];\n    if (allowed.includes(origin)) {\n      callback(true);\n    } else {\n      callback(false, 403, 'Forbidden');\n    }\n  }\n});`,
        category: 'WebSocket',
      });
    }
  }

  for (const { pattern, title, description, severity } of wsPatterns) {

    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Secure WebSocket configuration:\n\nimport { WebSocketServer } from 'ws';\n\nconst wss = new WebSocketServer({\n  server,\n  verifyClient: ({ origin, req }, callback) => {\n    const allowed = ['https://yourdomain.com'];\n    if (allowed.includes(origin)) {\n      callback(true);\n    } else {\n      callback(false, 403, 'Forbidden');\n    }\n  }\n});\n\n// Always use wss:// in production\nconst ws = new WebSocket('wss://api.example.com/ws');`,
        category: 'WebSocket',
      });
    }
  }

  return findings;
}

// Check 24: Next.js specific issues
function checkNextJS(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const nextPatterns = [
    {
      pattern: /getServerSideProps[^}]*return\s*\{[^}]*props\s*:\s*\{[^}]*(?:password|secret|token|apiKey)/gi,
      title: 'Sensitive data in getServerSideProps',
      description: 'Data returned from getServerSideProps is sent to the client.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /getStaticProps[^}]*return\s*\{[^}]*props\s*:\s*\{[^}]*(?:password|secret|token)/gi,
      title: 'Sensitive data in getStaticProps',
      description: 'Static props are embedded in the HTML and exposed to clients.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /NEXT_PUBLIC_.*(?:SECRET|PRIVATE|KEY|PASSWORD|TOKEN)/gi,
      title: 'Sensitive data in NEXT_PUBLIC_ variable',
      description: 'NEXT_PUBLIC_ variables are exposed to the browser.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /dangerouslyAllowBrowser\s*:\s*true/g,
      title: 'dangerouslyAllowBrowser enabled',
      description: 'This flag may expose server-side functionality to the browser.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /experimental\s*:\s*\{[^}]*serverActions\s*:\s*\{[^}]*allowedOrigins\s*:\s*\[\s*["']\*["']/g,
      title: 'Server Actions allow all origins',
      description: 'Server actions should restrict allowed origins.',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of nextPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Next.js security best practices:\n\n// 1. Never expose secrets via NEXT_PUBLIC_\n// Use server-only env vars:\nconst apiKey = process.env.API_KEY; // Server only\n\n// 2. Filter sensitive data in getServerSideProps:\nexport async function getServerSideProps() {\n  const user = await getUser();\n  return {\n    props: {\n      name: user.name,\n      // Don't include: user.password, user.apiKey\n    }\n  };\n}`,
        category: 'Next.js',
      });
    }
  }

  return findings;
}

// Check 25: Prisma security issues
function checkPrisma(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const prismaPatterns = [
    {
      pattern: /\$queryRaw\s*`[^`]*\$\{/g,
      title: 'Prisma raw query with interpolation',
      description: 'Raw queries with template interpolation are vulnerable to SQL injection.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /\$executeRaw\s*`[^`]*\$\{/g,
      title: 'Prisma executeRaw with interpolation',
      description: 'Raw execute with template interpolation is vulnerable to SQL injection.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /\$queryRawUnsafe\s*\(/g,
      title: 'Using $queryRawUnsafe',
      description: '$queryRawUnsafe bypasses SQL injection protections. Use $queryRaw with Prisma.sql.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /\$executeRawUnsafe\s*\(/g,
      title: 'Using $executeRawUnsafe',
      description: '$executeRawUnsafe bypasses SQL injection protections.',
      severity: 'CRITICAL' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of prismaPatterns) {

    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Safe Prisma queries:\n\n// Bad - vulnerable to injection:\nawait prisma.$queryRawUnsafe(\n  \`SELECT * FROM users WHERE id = \${userId}\`\n);\n\n// Good - use Prisma.sql for parameterized queries:\nimport { Prisma } from '@prisma/client';\n\nawait prisma.$queryRaw(\n  Prisma.sql\`SELECT * FROM users WHERE id = \${userId}\`\n);\n\n// Or better - use the Prisma client:\nawait prisma.user.findUnique({ where: { id: userId } });`,
        category: 'Prisma',
      });
    }
  }

  return findings;
}

// Check 26: ReDoS (Regular Expression Denial of Service)
function checkReDoS(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const redosPatterns = [
    {
      pattern: /new\s+RegExp\s*\(\s*(?:req\.|body\.|params\.|query\.)/g,
      title: 'Dynamic regex from user input',
      description: 'User-controlled regex patterns can cause ReDoS attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.match\s*\(\s*new\s+RegExp\s*\([^)]*(?:req\.|body\.)/g,
      title: 'String.match with user-controlled regex',
      description: 'User input used in regex can cause catastrophic backtracking.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\(\.\*\)\+|\(\.\+\)\*|\(\[.+\]\+\)\+/g,
      title: 'Potentially vulnerable regex pattern',
      description: 'Nested quantifiers can cause exponential backtracking (ReDoS).',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /\(\.\*\)\{\d+,\}|\(\.\+\)\{\d+,\}/g,
      title: 'Regex with unbounded repetition',
      description: 'Unbounded repetition of groups can cause ReDoS.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of redosPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Prevent ReDoS attacks:\n\n// 1. Never use user input directly in RegExp\n// Bad:\nconst regex = new RegExp(userInput);\n\n// Good - escape special chars:\nfunction escapeRegex(str) {\n  return str.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');\n}\nconst regex = new RegExp(escapeRegex(userInput));\n\n// 2. Use a safe regex library:\nimport { RE2 } from 're2';\nconst safeRegex = new RE2(pattern);\n\n// 3. Set timeouts on regex operations`,
        category: 'ReDoS',
      });
    }
  }

  return findings;
}

// Check 27: Mass Assignment vulnerabilities
function checkMassAssignment(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const massAssignPatterns = [
    {
      pattern: /\.create\s*\(\s*req\.body\s*\)/g,
      title: 'ORM create with full request body',
      description: 'Passing the entire request body to create() allows mass assignment attacks.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.update\s*\([^,]*,\s*req\.body\s*\)/g,
      title: 'ORM update with full request body',
      description: 'Passing the entire request body to update() allows mass assignment.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /Object\.assign\s*\(\s*\w+\s*,\s*req\.body\s*\)/g,
      title: 'Object.assign with request body',
      description: 'Assigning all request properties can override protected fields.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\{\s*\.\.\.req\.body\s*\}/g,
      title: 'Spreading request body into object',
      description: 'Spreading request body can include unexpected fields like isAdmin.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /findByIdAndUpdate\s*\([^,]+,\s*req\.body/g,
      title: 'MongoDB findByIdAndUpdate with body',
      description: 'Passing full request body to MongoDB update allows field injection.',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of massAssignPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Prevent mass assignment:\n\n// Bad - allows setting any field:\nawait User.create(req.body);\n\n// Good - explicitly pick allowed fields:\nconst { name, email } = req.body;\nawait User.create({ name, email });\n\n// Or use a validation schema:\nimport { z } from 'zod';\nconst schema = z.object({\n  name: z.string(),\n  email: z.string().email(),\n  // isAdmin is NOT included - can't be mass assigned\n});\nconst data = schema.parse(req.body);`,
        category: 'Mass Assignment',
      });
    }
  }

  return findings;
}

// Check 28: Docker security issues
function checkDocker(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Only check Docker-related files
  const filename = filePath.split('/').pop() || '';
  if (!filename.includes('docker') && !filename.includes('Dockerfile') && !filePath.endsWith('.yml') && !filePath.endsWith('.yaml')) {
    return findings;
  }

  const dockerPatterns = [
    {
      pattern: /FROM\s+\S+:latest/gi,
      title: 'Using :latest tag in Dockerfile',
      description: 'Pin specific versions for reproducible and secure builds.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /USER\s+root/gi,
      title: 'Container running as root',
      description: 'Containers should run as non-root users for security.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /--privileged/g,
      title: 'Privileged container',
      description: 'Privileged mode gives full host access. Avoid if possible.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /cap_add:\s*\n\s*-\s*ALL/gi,
      title: 'All capabilities added',
      description: 'Adding all capabilities is dangerous. Add only what\'s needed.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /network_mode:\s*["']?host["']?/gi,
      title: 'Container using host network',
      description: 'Host network mode reduces container isolation.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /secrets?.*[:=]\s*["'][^"'\n]+["']/gi,
      title: 'Hardcoded secrets in Docker config',
      description: 'Use Docker secrets or environment variables for sensitive data.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /COPY\s+\.env/g,
      title: 'Copying .env file into image',
      description: '.env files should not be copied into Docker images.',
      severity: 'CRITICAL' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of dockerPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `# Docker security best practices:\n\n# 1. Use specific versions\nFROM node:20.10-alpine\n\n# 2. Run as non-root user\nRUN addgroup -S app && adduser -S app -G app\nUSER app\n\n# 3. Use multi-stage builds\nFROM node:20 AS builder\nRUN npm run build\n\nFROM node:20-alpine\nCOPY --from=builder /app/dist ./dist\n\n# 4. Use Docker secrets\nservices:\n  app:\n    secrets:\n      - db_password`,
        category: 'Docker',
      });
    }
  }

  return findings;
}

// Check 29: CI/CD security issues
function checkCICD(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Only check CI/CD files
  if (!filePath.includes('.github') && !filePath.includes('gitlab-ci') &&
      !filePath.includes('azure-pipelines') && !filePath.includes('Jenkinsfile') &&
      !filePath.includes('circleci')) {
    return findings;
  }

  const cicdPatterns = [
    {
      pattern: /curl\s+[^|]*\|\s*(?:bash|sh)/g,
      title: 'Piping curl to shell',
      description: 'Executing downloaded scripts is risky. Verify integrity first.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /pull_request_target/g,
      title: 'Using pull_request_target trigger',
      description: 'pull_request_target runs with write access. Be careful with untrusted code.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /permissions:\s*\n\s*contents:\s*write/g,
      title: 'Workflow has write permissions',
      description: 'Limit permissions to what\'s needed. Use read-only when possible.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /password\s*[:=]\s*["'][^$"'\n]+["']/g,
      title: 'Hardcoded password in CI config',
      description: 'Use repository secrets instead of hardcoded credentials.',
      severity: 'CRITICAL' as Severity,
    },
  ];

  // Check for secrets potentially being echoed
  if (content.includes('${{ secrets.') && (content.includes('echo') || content.includes('print'))) {
    findings.push({
      id: generateFindingId(),
      filePath,
      severity: 'HIGH',
      title: 'Secrets potentially exposed in logs',
      description: 'Secrets may be printed to CI logs. Use masking.',
      codeSnippet: 'echo with secrets detected',
      fixSnippet: `# Mask secrets in GitHub Actions:\necho "::add-mask::$SECRET"\n\n# Or use environment variables without printing:\nenv:\n  MY_SECRET: \${{ secrets.MY_SECRET }}`,
      category: 'CI/CD',
    });
  }

  for (const { pattern, title, description, severity } of cicdPatterns) {

    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `# CI/CD Security best practices:\n\n# 1. Use secrets, never hardcode\nenv:\n  API_KEY: \${{ secrets.API_KEY }}\n\n# 2. Limit permissions\npermissions:\n  contents: read\n  pull-requests: write\n\n# 3. Pin action versions\nuses: actions/checkout@v4.1.1\n\n# 4. Mask sensitive output\necho "::add-mask::$SECRET"`,
        category: 'CI/CD',
      });
    }
  }

  return findings;
}

// Check 30: Unprotected API Routes
function checkUnprotectedAPI(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Only check API routes
  if (!filePath.includes('api') && !filePath.includes('route')) {
    return findings;
  }

  // Check if file has any auth checks
  const hasAuthCheck =
    content.includes('getServerSession') ||
    content.includes('getSession') ||
    content.includes('auth()') ||
    content.includes('currentUser') ||
    content.includes('requireAuth') ||
    content.includes('isAuthenticated') ||
    content.includes('verifyToken') ||
    content.includes('jwt.verify') ||
    content.includes('authenticate') ||
    content.includes('Authorization') ||
    content.includes('supabase.auth') ||
    content.includes('clerk');

  // Check for mutation endpoints without auth
  const mutationPatterns = [
    /export\s+(?:async\s+)?function\s+POST/g,
    /export\s+(?:async\s+)?function\s+PUT/g,
    /export\s+(?:async\s+)?function\s+DELETE/g,
    /export\s+(?:async\s+)?function\s+PATCH/g,
  ];

  if (!hasAuthCheck) {
    for (const pattern of mutationPatterns) {
      let match;
      pattern.lastIndex = 0;

      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = getLineNumber(content, match.index);

        findings.push({
          id: generateFindingId(),
          filePath,
          lineNumber,
          severity: 'HIGH',
          title: 'API endpoint without authentication',
          description:
            'This API endpoint handles mutations but has no visible authentication check. Anyone can call this endpoint.',
          codeSnippet: match[0],
          fixSnippet: `// Add authentication to your API route:\n\nimport { getServerSession } from 'next-auth';\nimport { authOptions } from '@/lib/auth';\n\nexport async function POST(req: Request) {\n  const session = await getServerSession(authOptions);\n  \n  if (!session) {\n    return Response.json({ error: 'Unauthorized' }, { status: 401 });\n  }\n  \n  // ... rest of handler\n}`,
          category: 'Unprotected API',
        });
        break; // Only report once per file
      }
    }
  }

  return findings;
}

// Check 31: CSRF Protection
function checkCSRF(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const csrfPatterns = [
    {
      pattern: /<form[^>]*method=["']post["'][^>]*>/gi,
      check: (content: string) => !content.includes('csrf') && !content.includes('_token'),
      title: 'Form without CSRF token',
      description: 'POST forms should include CSRF tokens to prevent cross-site request forgery.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /credentials:\s*["']include["']/g,
      check: (content: string) => !content.includes('csrf') && !content.includes('X-CSRF'),
      title: 'Fetch with credentials but no CSRF',
      description: 'Requests with credentials should include CSRF protection.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /withCredentials:\s*true/g,
      check: (content: string) => !content.includes('csrf') && !content.includes('X-CSRF'),
      title: 'Axios with credentials but no CSRF',
      description: 'Requests with credentials should include CSRF protection.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, check, title, description, severity } of csrfPatterns) {
    if (!check(content)) continue;

    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Add CSRF protection:\n\n// Option 1: Use next-auth (has built-in CSRF)\n// Option 2: Add CSRF token to forms:\n<input type="hidden" name="csrf_token" value={csrfToken} />\n\n// Option 3: Use SameSite cookies:\ncookies: {\n  sameSite: 'strict',\n  httpOnly: true,\n}`,
        category: 'CSRF',
      });
      break;
    }
  }

  return findings;
}

// Check 32: Insecure Direct Object References (IDOR)
function checkIDOR(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const idorPatterns = [
    {
      pattern: /\.findUnique\s*\(\s*\{\s*where\s*:\s*\{\s*id\s*:\s*(?:params|req|searchParams)/g,
      title: 'Direct object access without ownership check',
      description: 'Fetching records by ID without verifying the user owns this resource.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.findFirst\s*\(\s*\{\s*where\s*:\s*\{\s*id\s*:\s*(?:params|req)/g,
      title: 'findFirst without ownership verification',
      description: 'Fetching records without checking if the current user has access.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /\.delete\s*\(\s*\{\s*where\s*:\s*\{\s*id\s*:\s*(?:params|req)/g,
      title: 'Delete without ownership check',
      description: 'Deleting records by ID without verifying user ownership.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /\.update\s*\(\s*\{\s*where\s*:\s*\{\s*id\s*:\s*(?:params|req)/g,
      title: 'Update without ownership check',
      description: 'Updating records by ID without verifying user ownership.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /supabase\s*\.\s*from\s*\([^)]+\)\s*\.\s*(?:select|delete|update)\s*\([^)]*\)\s*\.\s*eq\s*\(\s*["']id["']/g,
      title: 'Supabase query by ID without user filter',
      description: 'Querying by ID alone - ensure RLS policies restrict access.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of idorPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      // Check if there's a userId/ownerId check nearby
      const context = content.substring(Math.max(0, match.index - 200), match.index + 200);
      if (context.includes('userId') || context.includes('ownerId') || context.includes('user_id')) {
        continue; // Likely has ownership check
      }

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 60) + (match[0].length > 60 ? '...' : ''),
        fixSnippet: `// Always verify ownership:\n\n// Bad - anyone can access any record:\nconst post = await prisma.post.findUnique({\n  where: { id: params.id }\n});\n\n// Good - verify ownership:\nconst post = await prisma.post.findFirst({\n  where: {\n    id: params.id,\n    userId: session.user.id  // Ownership check!\n  }\n});\n\nif (!post) {\n  return Response.json({ error: 'Not found' }, { status: 404 });\n}`,
        category: 'IDOR',
      });
    }
  }

  return findings;
}

// Check 33: Path Traversal
function checkPathTraversal(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const pathPatterns = [
    {
      pattern: /readFile(?:Sync)?\s*\(\s*(?:req\.|params\.|query\.|body\.)/g,
      title: 'File read with user-controlled path',
      description: 'Reading files using user input can allow path traversal attacks (../).',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /writeFile(?:Sync)?\s*\(\s*(?:req\.|params\.|query\.|body\.)/g,
      title: 'File write with user-controlled path',
      description: 'Writing files using user input can allow overwriting sensitive files.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /path\.join\s*\([^)]*(?:req\.|params\.|query\.|body\.)/g,
      title: 'Path.join with user input',
      description: 'path.join does not prevent traversal. Use path.resolve and validate.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /fs\.(?:access|stat|mkdir|rmdir|unlink)\s*\([^)]*(?:req\.|params\.)/g,
      title: 'Filesystem operation with user input',
      description: 'Filesystem operations with user-controlled paths are dangerous.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /new\s+URL\s*\([^)]*,\s*["'`]file:/g,
      title: 'File URL construction',
      description: 'Constructing file:// URLs can lead to local file access.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of pathPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Prevent path traversal:\n\nimport path from 'path';\n\nconst SAFE_DIR = '/app/uploads';\n\nfunction safePath(userInput: string): string {\n  // Resolve to absolute path\n  const resolved = path.resolve(SAFE_DIR, userInput);\n  \n  // Ensure it's still within safe directory\n  if (!resolved.startsWith(SAFE_DIR)) {\n    throw new Error('Invalid path');\n  }\n  \n  return resolved;\n}\n\n// Usage:\nconst filePath = safePath(req.params.filename);`,
        category: 'Path Traversal',
      });
    }
  }

  return findings;
}

// Check 34: Command Injection
function checkCommandInjection(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const cmdPatterns = [
    {
      pattern: /exec\s*\(\s*(?:req\.|params\.|query\.|body\.|`[^`]*\$\{)/g,
      title: 'Command execution with user input',
      description: 'Executing shell commands with user input allows command injection.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /execSync\s*\(\s*(?:req\.|params\.|query\.|body\.|`[^`]*\$\{)/g,
      title: 'Synchronous command execution with user input',
      description: 'Executing shell commands with user input allows command injection.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /spawn\s*\(\s*(?:req\.|params\.|query\.|body\.)/g,
      title: 'Process spawn with user input',
      description: 'Spawning processes with user-controlled arguments is dangerous.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /child_process/g,
      title: 'Child process module imported',
      description: 'Review all uses of child_process for command injection vulnerabilities.',
      severity: 'LOW' as Severity,
    },
    {
      pattern: /shelljs|shell\.exec/g,
      title: 'ShellJS usage detected',
      description: 'ShellJS executes commands. Ensure no user input reaches these calls.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /exec\s*\(\s*["'`](?:rm|mv|cp|chmod|chown|curl|wget|bash|sh)\s/g,
      title: 'Dangerous shell command',
      description: 'Executing dangerous shell commands. Ensure input is strictly validated.',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of cmdPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Prevent command injection:\n\n// Bad - user input in command:\nexec(\`echo \${userInput}\`);\n\n// Good - use spawn with arguments array:\nimport { spawn } from 'child_process';\n\nconst child = spawn('echo', [userInput]); // Arguments are escaped\n\n// Better - avoid shell entirely if possible:\n// Use native Node.js APIs instead of shell commands\nimport fs from 'fs';\nfs.copyFileSync(src, dest); // Instead of exec('cp ...')`,
        category: 'Command Injection',
      });
    }
  }

  return findings;
}

// Check 35: Vulnerable Dependencies (basic check on package.json)
function checkVulnerableDependencies(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  if (!filePath.endsWith('package.json')) {
    return findings;
  }

  // Known vulnerable package patterns (simplified check)
  const vulnerablePatterns = [
    {
      pattern: /"lodash":\s*"[<^~]?[0-3]\./g,
      title: 'Outdated lodash version',
      description: 'Lodash versions < 4.17.21 have prototype pollution vulnerabilities.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /"axios":\s*"[<^~]?0\.[0-1][0-8]?\./g,
      title: 'Outdated axios version',
      description: 'Old axios versions have security vulnerabilities. Update to latest.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /"jsonwebtoken":\s*"[<^~]?[0-7]\./g,
      title: 'Outdated jsonwebtoken version',
      description: 'jsonwebtoken < 8.x has known vulnerabilities.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /"express":\s*"[<^~]?[0-3]\./g,
      title: 'Outdated express version',
      description: 'Express < 4.x has known security issues.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /"node-fetch":\s*"[<^~]?[0-1]\./g,
      title: 'Outdated node-fetch version',
      description: 'node-fetch < 2.x has security vulnerabilities.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /"minimist":\s*"[<^~]?[0]\./g,
      title: 'Outdated minimist version',
      description: 'minimist < 1.2.6 has prototype pollution vulnerability.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /"moment":\s*"/g,
      title: 'Moment.js usage detected',
      description: 'Moment.js is deprecated. Consider using date-fns or dayjs.',
      severity: 'LOW' as Severity,
    },
    {
      pattern: /"request":\s*"/g,
      title: 'Deprecated request package',
      description: 'The request package is deprecated. Use axios or node-fetch.',
      severity: 'LOW' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of vulnerablePatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `# Check for vulnerabilities:\nnpm audit\n\n# Fix automatically:\nnpm audit fix\n\n# Or update packages:\nnpm update <package-name>`,
        category: 'Vulnerable Dependencies',
      });
    }
  }

  return findings;
}

// Check 36: Exposed Source Maps
function checkSourceMaps(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Check config files
  if (!filePath.includes('next.config') && !filePath.includes('webpack') && !filePath.includes('vite.config')) {
    return findings;
  }

  const sourceMapPatterns = [
    {
      pattern: /productionSourceMap\s*:\s*true/g,
      title: 'Source maps enabled in production',
      description: 'Source maps expose your original source code to anyone.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /devtool\s*:\s*["']source-map["']/g,
      title: 'Full source maps in webpack config',
      description: 'Full source maps should not be used in production.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /sourcemap\s*:\s*true/g,
      title: 'Source maps enabled',
      description: 'Source maps can expose sensitive code and logic.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /productionBrowserSourceMaps\s*:\s*true/g,
      title: 'Next.js browser source maps in production',
      description: 'Browser source maps expose your code. Set to false for production.',
      severity: 'MEDIUM' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of sourceMapPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Disable source maps in production:\n\n// next.config.js:\nmodule.exports = {\n  productionBrowserSourceMaps: false,\n};\n\n// webpack.config.js:\nmodule.exports = {\n  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',\n};`,
        category: 'Source Maps',
      });
    }
  }

  return findings;
}

// Check 37: Insecure Randomness
function checkInsecureRandomness(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const randomPatterns = [
    {
      pattern: /Math\.random\s*\(\s*\).*(?:token|secret|key|password|session|id|uuid|auth)/gi,
      title: 'Math.random() for security-sensitive value',
      description: 'Math.random() is not cryptographically secure. Use crypto.randomBytes().',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /(?:token|secret|key|password|session|uuid).*Math\.random\s*\(\s*\)/gi,
      title: 'Math.random() for security-sensitive value',
      description: 'Math.random() is not cryptographically secure. Use crypto.randomBytes().',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /Math\.random\s*\(\s*\)\.toString\s*\(\s*36\s*\)/g,
      title: 'Weak random ID generation',
      description: 'This pattern creates predictable IDs. Use crypto.randomUUID() instead.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /Date\.now\s*\(\s*\).*(?:token|secret|key|session|id)/gi,
      title: 'Timestamp-based token generation',
      description: 'Using timestamps for tokens is predictable. Use crypto.randomBytes().',
      severity: 'HIGH' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of randomPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
        fixSnippet: `// Use cryptographically secure randomness:\n\nimport crypto from 'crypto';\n\n// For random bytes:\nconst token = crypto.randomBytes(32).toString('hex');\n\n// For UUIDs:\nconst id = crypto.randomUUID();\n\n// In browser:\nconst array = new Uint8Array(32);\ncrypto.getRandomValues(array);`,
        category: 'Insecure Randomness',
      });
    }
  }

  return findings;
}

// Check 38: Missing Authentication Middleware
function checkMissingAuthMiddleware(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Check Next.js middleware
  if (filePath.includes('middleware') && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
    // Check if middleware handles protected routes
    const hasProtectedRoutes =
      content.includes('/dashboard') ||
      content.includes('/admin') ||
      content.includes('/api') ||
      content.includes('/account') ||
      content.includes('/settings');

    const hasAuthCheck =
      content.includes('getToken') ||
      content.includes('getSession') ||
      content.includes('auth') ||
      content.includes('jwt') ||
      content.includes('cookie');

    if (hasProtectedRoutes && !hasAuthCheck) {
      findings.push({
        id: generateFindingId(),
        filePath,
        severity: 'HIGH',
        title: 'Middleware without authentication check',
        description: 'Middleware handles protected routes but has no visible auth verification.',
        codeSnippet: 'Protected routes without auth check',
        fixSnippet: `// Add auth check to middleware:\n\nimport { getToken } from 'next-auth/jwt';\nimport { NextResponse } from 'next/server';\n\nexport async function middleware(request) {\n  const token = await getToken({ req: request });\n  \n  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {\n    return NextResponse.redirect(new URL('/login', request.url));\n  }\n  \n  return NextResponse.next();\n}\n\nexport const config = {\n  matcher: ['/dashboard/:path*', '/api/:path*']\n};`,
        category: 'Missing Auth',
      });
    }
  }

  return findings;
}

// Check 39: Unsafe Deserialization
function checkUnsafeDeserialization(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  const deserializationPatterns = [
    {
      pattern: /JSON\.parse\s*\(\s*(?:req\.|body|localStorage|sessionStorage)/g,
      title: 'JSON.parse on untrusted input',
      description: 'Parsing JSON from user input without validation can be dangerous.',
      severity: 'MEDIUM' as Severity,
    },
    {
      pattern: /eval\s*\(\s*JSON/g,
      title: 'eval() used for JSON parsing',
      description: 'Never use eval() for parsing. Use JSON.parse() instead.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /serialize-javascript|node-serialize|js-yaml\.load/g,
      title: 'Potentially unsafe serialization library',
      description: 'Some serialization libraries can execute code during deserialization.',
      severity: 'HIGH' as Severity,
    },
    {
      pattern: /yaml\.load\s*\(\s*(?:req\.|body|params)/g,
      title: 'YAML parsing of user input',
      description: 'YAML.load can execute arbitrary code. Use YAML.safeLoad instead.',
      severity: 'CRITICAL' as Severity,
    },
    {
      pattern: /pickle|marshal|unserialize/g,
      title: 'Unsafe deserialization function',
      description: 'These functions can execute arbitrary code during deserialization.',
      severity: 'CRITICAL' as Severity,
    },
  ];

  for (const { pattern, title, description, severity } of deserializationPatterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = getLineNumber(content, match.index);

      findings.push({
        id: generateFindingId(),
        filePath,
        lineNumber,
        severity,
        title,
        description,
        codeSnippet: match[0],
        fixSnippet: `// Safe deserialization:\n\n// 1. Always validate after parsing:\nimport { z } from 'zod';\n\nconst schema = z.object({\n  name: z.string(),\n  age: z.number(),\n});\n\nconst data = schema.parse(JSON.parse(input));\n\n// 2. Use safe YAML loading:\nimport yaml from 'js-yaml';\nconst data = yaml.load(input, { schema: yaml.SAFE_SCHEMA });`,
        category: 'Unsafe Deserialization',
      });
    }
  }

  return findings;
}

// Check 40: Clickjacking Protection
function checkClickjacking(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];

  // Only check config files
  if (!filePath.includes('next.config') && !filePath.includes('middleware') && !filePath.includes('server')) {
    return findings;
  }

  // Check for frame protection headers
  const hasFrameProtection =
    content.includes('X-Frame-Options') ||
    content.includes('frame-ancestors') ||
    content.includes('DENY') ||
    content.includes('SAMEORIGIN');

  if (!hasFrameProtection && filePath.includes('next.config')) {
    findings.push({
      id: generateFindingId(),
      filePath,
      severity: 'MEDIUM',
      title: 'Missing clickjacking protection',
      description: 'No X-Frame-Options or CSP frame-ancestors header found.',
      codeSnippet: 'Missing frame protection headers',
      fixSnippet: `// Add to next.config.js:\nmodule.exports = {\n  async headers() {\n    return [{\n      source: '/:path*',\n      headers: [\n        {\n          key: 'X-Frame-Options',\n          value: 'DENY'  // or 'SAMEORIGIN'\n        },\n        {\n          key: 'Content-Security-Policy',\n          value: "frame-ancestors 'none'"\n        }\n      ],\n    }];\n  },\n};`,
      category: 'Clickjacking',
    });
  }

  return findings;
}

// Calculate security score based on findings
function calculateSecurityScore(findings: Finding[]): number {
  let score = 100;

  for (const finding of findings) {
    switch (finding.severity) {
      case 'CRITICAL':
        score -= 20;
        break;
      case 'HIGH':
        score -= 12;
        break;
      case 'MEDIUM':
        score -= 6;
        break;
      case 'LOW':
        score -= 2;
        break;
    }
  }

  return Math.max(0, score);
}

// Main scan function
export async function scanRepository(
  repoUrl: string,
  githubToken?: string
): Promise<ScanResult> {
  const parsed = parseGitHubUrl(repoUrl);

  if (!parsed) {
    throw new Error('Invalid GitHub URL. Please provide a valid repository URL.');
  }

  const { owner, repo } = parsed;

  const { files, error } = await fetchRepoTree(owner, repo, githubToken);

  if (error) {
    throw new Error(error);
  }

  const scannableFiles = files
    .filter((f) => f.type === 'blob' && shouldScanFile(f.path))
    .filter((f) => (f.size || 0) <= MAX_FILE_SIZE)
    .slice(0, MAX_TOTAL_FILES);

  console.log(`[SecureSiteScan] Scanning ${scannableFiles.length} files from ${owner}/${repo}`);

  const findings: Finding[] = [];
  let totalBytes = 0;
  let filesScanned = 0;
  let truncated = false;

  for (const file of scannableFiles) {
    if (totalBytes >= MAX_TOTAL_BYTES) {
      truncated = true;
      break;
    }

    const content = await fetchFileContent(owner, repo, file.path, githubToken);
    if (!content) continue;

    filesScanned++;
    totalBytes += content.length;
    console.log(`[SecureSiteScan] Scanning: ${file.path} (${content.length} bytes)`);

    // Run all security checks
    findings.push(...checkSupabaseRLS(content, file.path));
    findings.push(...checkHardcodedSecrets(content, file.path));
    findings.push(...checkClientSideAuth(content, file.path));
    findings.push(...checkSQLInjection(content, file.path));
    findings.push(...checkXSS(content, file.path));
    findings.push(...checkEnvExposure(content, file.path));
    findings.push(...checkAuthIssues(content, file.path));
    findings.push(...checkCORS(content, file.path));
    findings.push(...checkSecurityHeaders(content, file.path));
    findings.push(...checkInsecureCookies(content, file.path));
    findings.push(...checkFileUpload(content, file.path));
    findings.push(...checkRateLimiting(content, file.path));
    findings.push(...checkInfoDisclosure(content, file.path));
    findings.push(...checkInsecureRedirects(content, file.path));
    findings.push(...checkInputValidation(content, file.path));
    findings.push(...checkPrototypePollution(content, file.path));
    findings.push(...checkSSRF(content, file.path));
    // New checks
    findings.push(...checkHardcodedIPs(content, file.path));
    findings.push(...checkDebugMode(content, file.path));
    findings.push(...checkCommentedSecrets(content, file.path));
    findings.push(...checkNoSQLInjection(content, file.path));
    findings.push(...checkGraphQL(content, file.path));
    findings.push(...checkWebSocket(content, file.path));
    findings.push(...checkNextJS(content, file.path));
    findings.push(...checkPrisma(content, file.path));
    findings.push(...checkReDoS(content, file.path));
    findings.push(...checkMassAssignment(content, file.path));
    findings.push(...checkDocker(content, file.path));
    findings.push(...checkCICD(content, file.path));
    // Additional security checks
    findings.push(...checkUnprotectedAPI(content, file.path));
    findings.push(...checkCSRF(content, file.path));
    findings.push(...checkIDOR(content, file.path));
    findings.push(...checkPathTraversal(content, file.path));
    findings.push(...checkCommandInjection(content, file.path));
    findings.push(...checkVulnerableDependencies(content, file.path));
    findings.push(...checkSourceMaps(content, file.path));
    findings.push(...checkInsecureRandomness(content, file.path));
    findings.push(...checkMissingAuthMiddleware(content, file.path));
    findings.push(...checkUnsafeDeserialization(content, file.path));
    findings.push(...checkClickjacking(content, file.path));
  }

  console.log(`[SecureSiteScan] Total findings: ${findings.length}`);
  console.log(`[SecureSiteScan] Files scanned: ${filesScanned}`);
  console.log(`[SecureSiteScan] Score: ${calculateSecurityScore(findings)}`);

  return {
    repoName: `${owner}/${repo}`,
    repoUrl,
    scannedAt: new Date().toISOString(),
    securityScore: calculateSecurityScore(findings),
    findings,
    truncated,
    filesScanned,
  };
}
