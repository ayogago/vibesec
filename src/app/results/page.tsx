'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SignupModal } from '@/components/SignupModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ScanResult, Severity, Finding, FindingCategory } from '@/lib/scanner';
import {
  SUBSCRIPTION_LIMITS,
  type SubscriptionTier,
} from '@/lib/subscription';

const ADMIN_EMAILS = ["info@securesitescan.com"];

// Export functions
function exportToJSON(result: ScanResult) {
  const exportData = {
    scanInfo: {
      repoName: result.repoName,
      repoUrl: result.repoUrl,
      scannedAt: result.scannedAt,
      filesScanned: result.filesScanned,
      securityScore: result.securityScore,
    },
    summary: {
      totalFindings: result.findings.length,
      critical: result.findings.filter(f => f.severity === 'CRITICAL').length,
      high: result.findings.filter(f => f.severity === 'HIGH').length,
      medium: result.findings.filter(f => f.severity === 'MEDIUM').length,
      low: result.findings.filter(f => f.severity === 'LOW').length,
    },
    findings: result.findings.map(f => ({
      id: f.id,
      severity: f.severity,
      title: f.title,
      description: f.description,
      filePath: f.filePath,
      lineNumber: f.lineNumber,
      codeSnippet: f.codeSnippet,
      fixSnippet: f.fixSnippet,
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: 'SecureSiteScan',
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `securesitescan-${result.repoName.replace('/', '-')}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToPDF(result: ScanResult) {
  // Generate a printable HTML report and trigger print dialog
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const severityColors: Record<Severity, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
  };

  const findingsHTML = result.findings.map(f => `
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px;">${f.title}</h3>
        <span style="background: ${severityColors[f.severity]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${f.severity}</span>
      </div>
      <p style="color: #666; font-size: 14px; margin: 8px 0;">${f.filePath}${f.lineNumber ? `:${f.lineNumber}` : ''}</p>
      <p style="font-size: 14px; margin: 8px 0;">${f.description}</p>
      <div style="background: #fee2e2; border-radius: 4px; padding: 12px; margin: 8px 0;">
        <p style="font-size: 12px; color: #dc2626; margin: 0 0 4px 0;">Vulnerable Code:</p>
        <pre style="margin: 0; font-size: 12px; white-space: pre-wrap;">${f.codeSnippet}</pre>
      </div>
      <div style="background: #dcfce7; border-radius: 4px; padding: 12px; margin: 8px 0;">
        <p style="font-size: 12px; color: #16a34a; margin: 0 0 4px 0;">Recommended Fix:</p>
        <pre style="margin: 0; font-size: 12px; white-space: pre-wrap;">${f.fixSnippet}</pre>
      </div>
    </div>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Security Report - ${result.repoName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #333; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="margin: 0; color: #16a34a;">SecureSiteScan</h1>
        <p style="color: #666;">Security Scan Report</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <h2 style="margin: 0 0 16px 0;">Repository: ${result.repoName}</h2>
        <p style="margin: 4px 0; color: #666;">URL: ${result.repoUrl}</p>
        <p style="margin: 4px 0; color: #666;">Scanned: ${new Date(result.scannedAt).toLocaleString()}</p>
        <p style="margin: 4px 0; color: #666;">Files Scanned: ${result.filesScanned}</p>
        <div style="margin-top: 16px; display: flex; gap: 24px;">
          <div>
            <span style="font-size: 48px; font-weight: bold; color: ${result.securityScore >= 80 ? '#16a34a' : result.securityScore >= 50 ? '#eab308' : '#ef4444'};">${result.securityScore}</span>
            <span style="color: #666;">/100</span>
          </div>
          <div style="display: flex; gap: 16px; align-items: center;">
            <span style="color: #ef4444;">Critical: ${result.findings.filter(f => f.severity === 'CRITICAL').length}</span>
            <span style="color: #f97316;">High: ${result.findings.filter(f => f.severity === 'HIGH').length}</span>
            <span style="color: #eab308;">Medium: ${result.findings.filter(f => f.severity === 'MEDIUM').length}</span>
            <span style="color: #3b82f6;">Low: ${result.findings.filter(f => f.severity === 'LOW').length}</span>
          </div>
        </div>
      </div>

      <h2>Findings (${result.findings.length})</h2>
      ${findingsHTML || '<p>No security issues found.</p>'}

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
        <p>Generated by SecureSiteScan on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'HIGH':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    case 'LOW':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

function groupFindingsBySeverity(findings: Finding[]): Record<Severity, Finding[]> {
  const groups: Record<Severity, Finding[]> = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
  };

  for (const finding of findings) {
    groups[finding.severity].push(finding);
  }

  return groups;
}

function groupFindingsByCategory(findings: Finding[]): Record<string, Finding[]> {
  const groups: Record<string, Finding[]> = {};

  for (const finding of findings) {
    const category = finding.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(finding);
  }

  // Sort categories by severity (most critical findings first)
  const severityScore = (f: Finding) => {
    switch (f.severity) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  };

  // Sort findings within each category by severity
  for (const category of Object.keys(groups)) {
    groups[category].sort((a, b) => severityScore(b) - severityScore(a));
  }

  return groups;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Secrets': '🔑',
    'Supabase RLS': '🛡️',
    'SQL Injection': '💉',
    'XSS': '⚠️',
    'Auth Issues': '🔐',
    'CORS': '🌐',
    'Cookies': '🍪',
    'Env Exposure': '📤',
    'Client Auth': '👤',
    'Security Headers': '📋',
    'Rate Limiting': '⏱️',
    'File Upload': '📁',
    'CSRF': '🔄',
    'Info Disclosure': 'ℹ️',
    'Debug Mode': '🐛',
    'Hardcoded IPs': '🔢',
    'Docker': '🐳',
    'CI/CD': '⚙️',
    'Unprotected API': '🚪',
    'IDOR': '🆔',
    'Path Traversal': '📂',
    'Command Injection': '💻',
  };
  return icons[category] || '🔍';
}

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <Card className="bg-card/50 border-border/50 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base font-medium leading-tight">{finding.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{finding.filePath}</span>
              {finding.lineNumber && (
                <span className="shrink-0 text-green-500">Line {finding.lineNumber}</span>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 ${getSeverityColor(finding.severity)}`}>
            {finding.severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="fix" className="border-border/50">
            <AccordionTrigger className="text-sm hover:no-underline py-3">
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                How to fix this
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Vulnerable Code
                  </p>
                  <pre className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-sm font-mono overflow-x-auto">
                    <code className="text-red-400">{finding.codeSnippet}</code>
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-400 mb-2 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Secure Fix
                  </p>
                  <pre className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                    <code className="text-green-400">{finding.fixSnippet}</code>
                  </pre>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function LockedFindingCard({ finding, onUnlock }: { finding: Finding; onUnlock: () => void }) {
  return (
    <Card className="bg-card/50 border-border/50 relative overflow-hidden">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-base font-medium leading-tight">{finding.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{finding.filePath}</span>
              </div>
            </div>
            <Badge variant="outline" className={getSeverityColor(finding.severity)}>
              {finding.severity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{finding.description}</p>
        </CardContent>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
        <div className="text-center p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-2">Upgrade to View</p>
          <Button size="sm" onClick={onUnlock} className="bg-green-600 hover:bg-green-700">
            Unlock All Findings
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SeveritySection({
  severity,
  findings,
  icon,
  color,
  visibleCount,
  onUnlock,
}: {
  severity: string;
  findings: Finding[];
  icon: React.ReactNode;
  color: string;
  visibleCount: number;
  onUnlock: () => void;
}) {
  if (findings.length === 0) return null;

  const visibleFindings = findings.slice(0, visibleCount);
  const lockedFindings = findings.slice(visibleCount);

  return (
    <section>
      <h2 className={`text-lg font-semibold ${color} mb-4 flex items-center gap-2`}>
        {icon}
        {severity} Issues ({findings.length})
      </h2>
      <div className="space-y-4">
        {visibleFindings.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
        {lockedFindings.map((finding) => (
          <LockedFindingCard key={finding.id} finding={finding} onUnlock={onUnlock} />
        ))}
      </div>
    </section>
  );
}

// Compact row for findings table
function CompactFindingRow({ finding, isLocked, onUnlock }: { finding: Finding; isLocked: boolean; onUnlock: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLocked) {
    return (
      <div className="border-b border-border/30 py-2 px-3 bg-muted/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant="outline" className={`shrink-0 text-xs px-1.5 py-0 ${getSeverityColor(finding.severity)}`}>
            {finding.severity.slice(0, 1)}
          </Badge>
          <span className="text-sm text-muted-foreground truncate blur-sm">{finding.title}</span>
        </div>
        <Button size="sm" variant="ghost" onClick={onUnlock} className="shrink-0 text-xs h-7">
          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Unlock
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-border/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 px-3 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant="outline" className={`shrink-0 text-xs px-1.5 py-0 ${getSeverityColor(finding.severity)}`}>
            {finding.severity.slice(0, 1)}
          </Badge>
          <span className="text-sm truncate">{finding.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[150px]">{finding.filePath}</span>
          <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 bg-muted/10">
          <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
          <div className="text-xs text-muted-foreground mb-2">
            📁 {finding.filePath}{finding.lineNumber ? `:${finding.lineNumber}` : ''}
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="fix" className="border-border/30">
              <AccordionTrigger className="text-xs hover:no-underline py-2">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to fix
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-red-400 mb-1">Vulnerable:</p>
                    <pre className="bg-red-500/5 border border-red-500/20 rounded p-2 text-xs font-mono overflow-x-auto">
                      <code className="text-red-400">{finding.codeSnippet}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-400 mb-1">Fix:</p>
                    <pre className="bg-green-500/5 border border-green-500/20 rounded p-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      <code className="text-green-400">{finding.fixSnippet}</code>
                    </pre>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
}

// Category section with compact table view
function CategorySection({
  category,
  findings,
  visibleCount,
  onUnlock,
}: {
  category: string;
  findings: Finding[];
  visibleCount: number;
  onUnlock: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter(f => f.severity === 'LOW').length;

  const visibleFindings = findings.slice(0, visibleCount);
  const lockedCount = Math.max(0, findings.length - visibleCount);

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{getCategoryIcon(category)}</span>
          <span className="font-medium">{category}</span>
          <span className="text-sm text-muted-foreground">({findings.length})</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {criticalCount > 0 && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">{criticalCount}C</span>}
            {highCount > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">{highCount}H</span>}
            {mediumCount > 0 && <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500">{mediumCount}M</span>}
            {lowCount > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">{lowCount}L</span>}
          </div>
          <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-border/30">
          {visibleFindings.map((finding, idx) => (
            <CompactFindingRow key={finding.id} finding={finding} isLocked={false} onUnlock={onUnlock} />
          ))}
          {lockedCount > 0 && (
            <div className="py-3 px-4 bg-muted/20 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                +{lockedCount} more finding{lockedCount > 1 ? 's' : ''} locked
              </p>
              <Button size="sm" onClick={onUnlock} className="bg-green-600 hover:bg-green-700">
                Unlock All
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function ResultsPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionTier>('anonymous');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'severity'>('category');
  const router = useRouter();
  const { data: session, status } = useSession();

  // Determine if user is admin
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    const stored = sessionStorage.getItem('scanResult');
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  // Get subscription from session
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // User is logged in - get their subscription from session
      const userSub = (session.user as { subscription?: string }).subscription as SubscriptionTier;
      if (userSub && ['free', 'starter', 'pro'].includes(userSub)) {
        setSubscription(userSub);
      } else {
        setSubscription('free');
      }
    } else {
      setSubscription('anonymous');
    }
    setLoading(false);
  }, [session, status]);

  const handleSignupSuccess = () => {
    setShowSignupModal(false);
    // Subscription will update via session
  };

  const handleUnlock = () => {
    if (!session?.user) {
      setShowSignupModal(true);
    } else {
      // User is signed in but needs to upgrade
      router.push('/pricing');
    }
  };

  // Admin and pro users see all findings
  const effectiveSubscription: SubscriptionTier = isAdmin ? 'pro' : subscription;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading results...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const groupedFindings = groupFindingsBySeverity(result.findings);
  const groupedByCategory = groupFindingsByCategory(result.findings);
  const scanDate = new Date(result.scannedAt).toLocaleString();
  const limits = SUBSCRIPTION_LIMITS[effectiveSubscription];
  const totalFindings = result.findings.length;
  const visibleFindings = Math.min(totalFindings, limits.visibleFindings);
  const lockedFindings = totalFindings - visibleFindings;

  // Sort categories by priority (most severe first)
  const sortedCategories = Object.entries(groupedByCategory).sort((a, b) => {
    const getMaxSeverity = (findings: Finding[]) => {
      if (findings.some(f => f.severity === 'CRITICAL')) return 4;
      if (findings.some(f => f.severity === 'HIGH')) return 3;
      if (findings.some(f => f.severity === 'MEDIUM')) return 2;
      return 1;
    };
    return getMaxSeverity(b[1]) - getMaxSeverity(a[1]);
  });

  // Distribute visible count across severity groups
  let remainingVisible = limits.visibleFindings;
  const visibleBySeverity: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  // Prioritize showing critical/high first
  for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]) {
    const count = groupedFindings[severity].length;
    const toShow = Math.min(count, remainingVisible);
    visibleBySeverity[severity] = toShow;
    remainingVisible -= toShow;
  }

  // Calculate visible per category (distribute evenly then by priority)
  const visibleByCategory: Record<string, number> = {};
  let categoryRemainingVisible = limits.visibleFindings;
  for (const [category, findings] of sortedCategories) {
    const toShow = Math.min(findings.length, categoryRemainingVisible);
    visibleByCategory[category] = toShow;
    categoryRemainingVisible -= toShow;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-8 md:py-12 border-b border-border/40 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Security Scan Complete
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {result.repoName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <a
                    href={result.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground flex items-center gap-1"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    View Repository
                  </a>
                  <span className="text-border">•</span>
                  <span>{result.filesScanned} files scanned</span>
                  <span className="text-border">•</span>
                  <span>{scanDate}</span>
                </div>
                {result.truncated && (
                  <p className="mt-2 text-sm text-yellow-500 flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Large repository - only a subset of files were analyzed
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="shrink-0 bg-green-600 hover:bg-green-700">
                  <Link href="/#scanner">Scan Another Repo</Link>
                </Button>

                {/* Export buttons - only for paid tiers */}
                {(subscription === 'starter' || subscription === 'pro') && (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => exportToJSON(result)}
                      className="gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export JSON
                    </Button>
                    {subscription === 'pro' && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => exportToPDF(result)}
                        className="gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export PDF
                      </Button>
                    )}
                  </>
                )}

                {/* Show upgrade prompt for free users */}
                {(subscription === 'free' || subscription === 'anonymous') && result.findings.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/pricing')}
                    className="gap-2 border-dashed"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Upgrade to Export
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Score and Summary */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Security Score Card */}
              <Card className="md:col-span-1 bg-gradient-to-br from-card to-card/50 border-border/50">
                <CardContent className="pt-6 text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted/30"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${result.securityScore * 3.51} 351`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" className={`${result.securityScore >= 80 ? 'text-green-500' : result.securityScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`} stopColor="currentColor" />
                          <stop offset="100%" className={`${result.securityScore >= 80 ? 'text-emerald-500' : result.securityScore >= 50 ? 'text-orange-500' : 'text-rose-500'}`} stopColor="currentColor" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreColor(result.securityScore)}`}>
                        {result.securityScore}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <p className={`mt-4 font-semibold ${getScoreColor(result.securityScore)}`}>
                    {getScoreLabel(result.securityScore)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Security Score</p>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <Card className="md:col-span-2 bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Findings Summary</span>
                    <Badge variant="outline" className="font-normal">
                      {limits.name} Plan
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="text-3xl font-bold text-red-500">
                        {groupedFindings.CRITICAL.length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Critical</div>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <div className="text-3xl font-bold text-orange-500">
                        {groupedFindings.HIGH.length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">High</div>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                      <div className="text-3xl font-bold text-yellow-500">
                        {groupedFindings.MEDIUM.length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Medium</div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="text-3xl font-bold text-blue-500">
                        {groupedFindings.LOW.length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Low</div>
                    </div>
                  </div>

                  {totalFindings > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Found <span className="font-semibold text-foreground">{totalFindings}</span> potential security {totalFindings === 1 ? 'issue' : 'issues'} in your repository.
                      </p>
                      {lockedFindings > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <svg className="h-5 w-5 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            <span className="font-semibold">{lockedFindings} finding{lockedFindings === 1 ? '' : 's'} locked.</span>
                            {' '}
                            {subscription === 'anonymous' ? (
                              <button onClick={() => setShowSignupModal(true)} className="underline hover:no-underline">
                                Sign up free to see {subscription === 'anonymous' ? '1 more' : 'more'}
                              </button>
                            ) : (
                              <Link href="/pricing" className="underline hover:no-underline">
                                Upgrade to see all
                              </Link>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Findings */}
        <section className="py-8 pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            {result.findings.length === 0 ? (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="py-12 text-center">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-green-500 mb-3">
                    No Vulnerabilities Found!
                  </h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Great job! Your repository passed all 40+ security checks. Keep up the secure coding practices!
                  </p>
                  <Button asChild className="mt-6 bg-green-600 hover:bg-green-700">
                    <Link href="/#scanner">Scan Another Repository</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* View Toggle */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Security Findings
                    {isAdmin && <Badge className="ml-2 bg-green-600">Admin View</Badge>}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">View:</span>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setViewMode('category')}
                        className={`px-3 py-1.5 text-sm ${viewMode === 'category' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                      >
                        By Category
                      </button>
                      <button
                        onClick={() => setViewMode('severity')}
                        className={`px-3 py-1.5 text-sm ${viewMode === 'severity' ? 'bg-muted' : 'hover:bg-muted/50'}`}
                      >
                        By Severity
                      </button>
                    </div>
                  </div>
                </div>

                {viewMode === 'category' ? (
                  /* Category View - Compact */
                  <div className="space-y-3">
                    {sortedCategories.map(([category, findings]) => (
                      <CategorySection
                        key={category}
                        category={category}
                        findings={findings}
                        visibleCount={visibleByCategory[category] || 0}
                        onUnlock={handleUnlock}
                      />
                    ))}
                  </div>
                ) : (
                  /* Severity View - Original */
                  <div className="space-y-8">
                    <SeveritySection
                      severity="Critical"
                      findings={groupedFindings.CRITICAL}
                      color="text-red-500"
                      visibleCount={visibleBySeverity.CRITICAL}
                      onUnlock={handleUnlock}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      }
                    />

                    <SeveritySection
                      severity="High Priority"
                      findings={groupedFindings.HIGH}
                      color="text-orange-500"
                      visibleCount={visibleBySeverity.HIGH}
                      onUnlock={handleUnlock}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    />

                    <SeveritySection
                      severity="Medium Priority"
                      findings={groupedFindings.MEDIUM}
                      color="text-yellow-500"
                      visibleCount={visibleBySeverity.MEDIUM}
                      onUnlock={handleUnlock}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    />

                    <SeveritySection
                      severity="Low Priority"
                      findings={groupedFindings.LOW}
                      color="text-blue-500"
                      visibleCount={visibleBySeverity.LOW}
                      onUnlock={handleUnlock}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      }
                    />
                  </div>
                )}

                {/* Upgrade CTA */}
                {lockedFindings > 0 && (
                  <div className="mt-12 pt-8 border-t border-border/40">
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                      <CardContent className="py-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
                          <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          Unlock All {totalFindings} Security Findings
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                          {subscription === 'anonymous'
                            ? 'Sign up for free to see 2 findings, or upgrade to Starter/Pro for unlimited access.'
                            : subscription === 'free'
                            ? 'Upgrade to Starter or Pro to see all security findings and get more daily scans.'
                            : 'Upgrade your plan for unlimited access to all security findings.'}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          {subscription === 'anonymous' && (
                            <Button onClick={() => setShowSignupModal(true)} variant="outline">
                              Sign Up Free
                            </Button>
                          )}
                          <Button asChild className="bg-green-600 hover:bg-green-700">
                            <Link href="/pricing">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              View Pricing Plans
                            </Link>
                          </Button>
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Starter: $2.99/mo
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Pro: $9.99/mo
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
        mode="upgrade"
      />
    </div>
  );
}
