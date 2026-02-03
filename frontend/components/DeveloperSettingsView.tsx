'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Copy, Key, ShieldCheck, Book, Terminal, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { getApiKeys, createApiKey, revokeApiKey, type ApiKey } from '@/actions/api-keys';

const CodeBlock = ({ children, title }: { children: React.ReactNode, title?: string }) => {
    const handleCopy = () => {
        if (typeof children === 'string') {
            navigator.clipboard.writeText(children);
            toast.success('Copied to clipboard');
        }
    };

    return (
        <div className="relative overflow-hidden rounded-lg bg-muted border border-border mt-3 mb-6 group">
            {title && (
                <div className="bg-muted/50 px-4 py-2 text-xs font-mono border-b text-muted-foreground flex justify-between items-center h-8">
                    <span>{title}</span>
                    {typeof children === 'string' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80"
                            onClick={handleCopy}
                            title="Copy to clipboard"
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            )}
            <div className="p-4 overflow-x-auto">
                <pre className="text-xs md:text-sm font-mono leading-relaxed text-foreground">
                    {children}
                </pre>
            </div>
        </div>
    );
};

const Endpoint = ({ method, path, description }: { method: string, path: string, description: string }) => (
    <div className="flex items-center gap-3 font-mono text-sm mb-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${method === 'GET' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
            method === 'POST' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                'bg-muted text-muted-foreground'
            }`}>
            {method}
        </span>
        <span className="text-foreground">{path}</span>
        <span className="text-muted-foreground ml-auto truncate hidden md:inline-block font-sans text-xs">{description}</span>
    </div>
);

export default function DeveloperSettingsView() {
    const t = useTranslations('DeveloperDocs');
    // We intentionally don't translate some technical terms/UI labels in the existing credential view 
    // to match the previous implementation, unless requested.
    // However, I will use English literals for the existing UI effectively.

    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [creating, setCreating] = useState(false);
    const [createdKey, setCreatedKey] = useState<string | null>(null);

    const fetchKeys = async () => {
        setLoading(true);
        const result = await getApiKeys();
        if (result.success && result.data) {
            setKeys(result.data);
        } else {
            toast.error('Failed to load API keys');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchKeys();
    }, []);

    const handleCreate = async () => {
        if (!newKeyName.trim()) return;
        setCreating(true);

        const result = await createApiKey(newKeyName);

        if (result.success && result.key) {
            setCreatedKey(result.key);
            toast.success('API Key created successfully');
            fetchKeys();
        } else {
            toast.error(result.error || 'Failed to create key');
            setCreating(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this key? Any applications using it will stop working immediately.')) return;

        const result = await revokeApiKey(id);
        if (result.success) {
            toast.success('Key revoked');
            fetchKeys();
        } else {
            toast.error(result.error || 'Failed to revoke key');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const closeCreateDialog = () => {
        setCreateOpen(false);
        setCreatedKey(null);
        setNewKeyName('');
        setCreating(false);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Developer API</h1>
                <p className="text-muted-foreground">Manage API access and view integration documentation.</p>
            </div>

            <Tabs defaultValue="docs" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="docs" className="gap-2 cursor-pointer"><Book className="h-4 w-4" /> {t('title')}</TabsTrigger>
                    <TabsTrigger value="keys" className="gap-2 cursor-pointer"><Key className="h-4 w-4" /> API Keys</TabsTrigger>
                </TabsList>

                {/* --- DOCUMENTATION TAB --- */}
                <TabsContent value="docs" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">

                    {/* Intro */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {t('subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">

                            {/* Base URL */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle>Base URL</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted p-3 rounded-md font-mono text-sm border border-border flex items-center justify-between">
                                        <span>https://api.banktobook.com/api/v1</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('https://api.banktobook.com/api/v1')}>
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Authentication */}
                            <div id="auth" className="scroll-mt-20">
                                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    {t('sections.authentication')}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">{t('auth.description')}</p>
                                <CodeBlock title={t('auth.header')}>
                                    x-api-key: your_api_key_prefix_secret
                                </CodeBlock>
                            </div>

                            {/* Endpoints */}
                            <div id="endpoints" className="scroll-mt-20">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Terminal className="h-5 w-5 text-primary" />
                                    {t('sections.endpoints')}
                                </h3>

                                {/* POST /convert */}
                                <Card className="mb-6 overflow-hidden border-l-4 border-l-emerald-500">
                                    <CardHeader className="bg-muted/20 pb-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="font-mono text-lg flex items-center gap-3">
                                                    <span className="text-emerald-500 font-bold uppercase text-sm bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">POST</span>
                                                    /convert
                                                </CardTitle>
                                                <CardDescription className="mt-2">
                                                    Upload a PDF bank statement for asynchronous extraction. Returns a Job ID to track progress.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <h4 className="font-semibold mb-2 text-foreground/80">Headers</h4>
                                                <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                                                    <li><span className="text-foreground">x-api-key</span>: string</li>
                                                    <li><span className="text-foreground">Idempotency-Key</span>: string (UUID)</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-2 text-foreground/80">Form Data</h4>
                                                <ul className="space-y-1 text-muted-foreground font-mono text-xs">
                                                    <li><span className="text-foreground">file</span>: application/pdf</li>
                                                    <li><span className="text-foreground">outputs</span>: "csv,qbo"</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <CodeBlock title="1. Start Conversion Job">
                                            {`curl --location 'https://api.banktobook.com/api/v1/convert' \\
  --header 'x-api-key: your_api_key' \\
  --header 'Idempotency-Key: unique_req_id_1' \\
  --form 'file=@"/path/to/statement.pdf"' \\
  --form 'outputs="csv,qbo"'`}
                                        </CodeBlock>
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                                            <h4 className="text-xs font-bold uppercase text-emerald-600 mb-2">Response (202 Accepted)</h4>
                                            <pre className="text-xs font-mono text-muted-foreground">
                                                {`{
  "job_id": "30dbc1aa-5f88-48c9-bfc0-22c3521f8b5f",
  "status": "queued",
  "outputs": ["csv", "qbo"],
  "created_at": "2026-02-03T00:50:00Z"
}`}
                                            </pre>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* GET /jobs/{id} */}
                                <Card className="mb-6 overflow-hidden border-l-4 border-l-blue-500">
                                    <CardHeader className="bg-muted/20 pb-4">
                                        <CardTitle className="font-mono text-lg flex items-center gap-3">
                                            <span className="text-blue-500 font-bold uppercase text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">GET</span>
                                            /jobs/{"{job_id}"}
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            Poll this endpoint to check job status. Proceed to download when status is "succeeded".
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <CodeBlock title="2. Check Job Status">
                                            {`curl --location 'https://api.banktobook.com/api/v1/jobs/30dbc1aa-5f88-48c9-bfc0-22c3521f8b5f/' \\
  --header 'x-api-key: your_api_key'`}
                                        </CodeBlock>
                                        <CodeBlock title="Response (Succeeded)">
                                            {`{
  "job_id": "30dbc1aa-...",
  "status": "succeeded",
  "outputs": {
      "csv": { "ready": true },
      "qbo": { "ready": true }
  },
  "error": null
}`}
                                        </CodeBlock>
                                    </CardContent>
                                </Card>

                                {/* GET /download */}
                                <Card className="mb-6 overflow-hidden border-l-4 border-l-purple-500">
                                    <CardHeader className="bg-muted/20 pb-4">
                                        <CardTitle className="font-mono text-lg flex items-center gap-3">
                                            <span className="text-purple-500 font-bold uppercase text-sm bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">GET</span>
                                            /jobs/{"{job_id}"}/download
                                        </CardTitle>
                                        <CardDescription className="mt-2">
                                            Download the processed file in the desired format (csv or qbo).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <CodeBlock title="3. Download Result">
                                            {`curl --location 'https://api.banktobook.com/api/v1/jobs/30dbc1aa-5f88-48c9-bfc0-22c3521f8b5f/download?format=csv' \\
  --header 'x-api-key: your_api_key' \\
  --output statement.csv`}
                                        </CodeBlock>
                                        <div className="text-sm mt-4">
                                            <span className="font-semibold text-foreground">Query Parameters: </span>
                                            <code className="bg-muted px-1 py-0.5 rounded ml-1 text-muted-foreground mr-2">format=csv</code>
                                            <code className="bg-muted px-1 py-0.5 rounded text-muted-foreground">format=qbo</code>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                        </div>

                        {/* Sidebar: Index & Important Info */}
                        <div className="space-y-6 sticky top-6">
                            <Card className="bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('sections.constraints')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div>
                                        <div className="font-medium flex items-center gap-2 mb-1.5"><Clock className="h-4 w-4 text-amber-500" /> {t('constraints.retention')}</div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            {t('constraints.retention_input')}<br />
                                            <span className="font-medium text-foreground">{t('constraints.retention_output')}</span>
                                        </p>
                                    </div>
                                    <div className="h-px bg-border/50" />
                                    <div>
                                        <div className="font-medium flex items-center gap-2 mb-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t('constraints.idempotency')}</div>
                                        <p className="text-muted-foreground text-xs leading-relaxed">
                                            {t('constraints.idempotency_desc')}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t('sections.errors')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {[
                                            { code: 400, label: "MISSING_IDEMPOTENCY_KEY" },
                                            { code: 401, label: "UNAUTHORIZED" },
                                            { code: 402, label: "QUOTA_EXCEEDED" },
                                            { code: 410, label: "EXPIRED (Download)" },
                                            { code: 429, label: "RATE_LIMIT_EXCEEDED" },
                                        ].map((err, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="font-mono text-muted-foreground">{err.code}</span>
                                                <span className="font-medium">{err.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- API KEYS TAB (Existing Functionality) --- */}
                <TabsContent value="keys" className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">Active API Keys</h2>
                        </div>

                        <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                                    <Plus className="h-4 w-4" /> Generate New Key
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                {!createdKey ? (
                                    <>
                                        <DialogHeader>
                                            <DialogTitle>Create API Key</DialogTitle>
                                            <DialogDescription>
                                                Enter a name for this key to identify it later (e.g., "Production Server", "Local Dev").
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Input
                                                placeholder="Key Name"
                                                value={newKeyName}
                                                onChange={(e) => setNewKeyName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={closeCreateDialog}>Cancel</Button>
                                            <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
                                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Create Key
                                            </Button>
                                        </DialogFooter>
                                    </>
                                ) : (
                                    <>
                                        <DialogHeader>
                                            <DialogTitle className="text-emerald-500 flex items-center gap-2">
                                                <ShieldCheck className="h-5 w-5" /> Key Created Successfully
                                            </DialogTitle>
                                            <DialogDescription>
                                                Copy this key now. You will <strong>never</strong> see it again.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-6 space-y-4">
                                            <div className="p-4 bg-muted/50 rounded-lg border flex items-center justify-between gap-2">
                                                <code className="font-mono text-sm break-all text-primary">{createdKey}</code>
                                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdKey)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="text-xs text-muted-foreground bg-yellow-500/10 text-yellow-500 p-3 rounded border border-yellow-500/20">
                                                Warning: Treat this key like a password. Do not share it or commit it to version control.
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={closeCreateDialog}>I have copied it</Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Your API Keys</CardTitle>
                            <CardDescription>
                                Use these keys to authenticate requests to the BankToBook API.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : keys.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Key className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>No API keys created yet.</p>
                                    <Button variant="link" onClick={() => setCreateOpen(true)}>Create your first key</Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Prefix</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Last Used</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {keys.map((key) => (
                                            <TableRow key={key.id}>
                                                <TableCell className="font-medium">{key.name}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{key.prefix}...</TableCell>
                                                <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={key.status === 'active' ? 'default' : 'destructive'}
                                                        className={key.status === 'active' ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20' : ''}>
                                                        {key.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {key.status === 'active' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRevoke(key.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Rate Limits</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between py-1 border-b">
                                <span>Free Plan</span>
                                <span className="font-medium">10 req/min</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span>Starter</span>
                                <span className="font-medium">60 req/min</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>Pro</span>
                                <span className="font-medium">300 req/min</span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
