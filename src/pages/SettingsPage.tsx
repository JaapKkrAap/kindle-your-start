import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAISettings, useUpdateAISettings } from '@/hooks/useAISettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PageShell } from '@/components/layout/PageShell';
import { providerCapabilities } from '@/data/seedCharacters';
import { getApiKeys, setApiKeys } from '@/hooks/useApiKeys';
import type { AIProvider } from '@/types';
import { Bot, Cloud, Eye, EyeOff, Key, Save, Server, LogOut, User } from 'lucide-react';

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'o3-mini', name: 'o3 mini' },
  { id: 'o1-mini', name: 'o1 mini' },
];


export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useAISettings();
  const { user, signOut } = useAuth();
  const updateSettings = useUpdateAISettings();

  const [localSettings, setLocalSettings] = useState({
    provider: 'lmstudio' as AIProvider,
    lmstudioEndpoint: 'http://localhost:1234/v1',
    lmstudioModel: 'default',
    openrouterModel: 'anthropic/claude-3.5-sonnet',
    openaiModel: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 2048,
    systemPromptOverride: '',
  });

  const [apiKeys, setLocalApiKeys] = useState(() => getApiKeys());
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        provider: settings.provider,
        lmstudioEndpoint: settings.lmstudioEndpoint,
        lmstudioModel: settings.lmstudioModel,
        openrouterModel: settings.openrouterModel,
        openaiModel: settings.openaiModel,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        systemPromptOverride: settings.systemPromptOverride ?? '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        provider: localSettings.provider,
        lmstudioEndpoint: localSettings.lmstudioEndpoint,
        lmstudioModel: localSettings.lmstudioModel,
        openrouterModel: localSettings.openrouterModel,
        openaiModel: localSettings.openaiModel,
        temperature: localSettings.temperature,
        maxTokens: localSettings.maxTokens,
        systemPromptOverride: localSettings.systemPromptOverride || undefined,
      });
      // API keys are saved locally only
      setApiKeys(apiKeys);
      toast({
        title: 'Settings saved',
        description: 'Your AI configuration has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      title="Settings"
      description="Tune providers, response behavior, prompts, and account preferences from one organized control room."
      maxWidth="max-w-4xl"
      action={
        <Button onClick={handleSave} disabled={updateSettings.isPending} className="glow-primary">
          <Save className="mr-2 h-4 w-4" />
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      }
    >
        <Tabs defaultValue="provider" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 bg-muted/45 p-1 sm:inline-grid sm:w-auto sm:grid-cols-5">
            <TabsTrigger value="provider">AI Provider</TabsTrigger>
            <TabsTrigger value="apikeys" className="gap-1.5">
              <Key className="h-3.5 w-3.5" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="prompts">System Prompt</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Provider Tab */}
          <TabsContent value="provider" className="space-y-4">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  AI Provider Selection
                </CardTitle>
                <CardDescription>
                  Choose the provider and understand which content modes it can handle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { id: 'openai' as AIProvider, icon: Bot },
                    { id: 'openrouter' as AIProvider, icon: Cloud },
                    { id: 'lmstudio' as AIProvider, icon: Server },
                  ].map(provider => {
                    const Icon = provider.icon;
                    const capability = providerCapabilities[provider.id];
                    const active = localSettings.provider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setLocalSettings(s => ({ ...s, provider: provider.id }))}
                        className={`rounded-lg border p-4 text-left transition-all ${
                          active
                            ? 'border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]'
                            : 'border-border/70 bg-muted/25 hover:border-primary/35 hover:bg-muted/40'
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                          <Badge variant="outline" className={capability.explicitCapable ? 'border-primary/30 text-primary' : 'border-border/70 text-muted-foreground'}>
                            {capability.explicitCapable ? 'Explicit-capable' : 'Non-explicit'}
                          </Badge>
                        </div>
                        <p className="font-medium">{capability.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{capability.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={localSettings.provider}
                    onValueChange={(value) => setLocalSettings(s => ({ ...s, provider: value as AIProvider }))}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">
                        <span className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          OpenAI
                        </span>
                      </SelectItem>
                      <SelectItem value="openrouter">
                        <span className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          OpenRouter
                        </span>
                      </SelectItem>
                      <SelectItem value="lmstudio">
                        <span className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          LM Studio
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider-specific settings */}
                {localSettings.provider === 'lmstudio' ? (
                  <div className="space-y-4 border-t border-border/60 pt-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                      <p className="text-sm leading-6 text-primary">
                        LM Studio can power explicit mode when your local endpoint and loaded model are configured for adult fictional roleplay.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endpoint">LM Studio Endpoint</Label>
                      <Input
                        id="endpoint"
                        value={localSettings.lmstudioEndpoint}
                        onChange={e => setLocalSettings(s => ({ ...s, lmstudioEndpoint: e.target.value }))}
                        placeholder="http://localhost:1234/v1"
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Make sure LM Studio server is running with a model loaded
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lmmodel">Model Name (optional)</Label>
                      <Input
                        id="lmmodel"
                        value={localSettings.lmstudioModel}
                        onChange={e => setLocalSettings(s => ({ ...s, lmstudioModel: e.target.value }))}
                        placeholder="default"
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                ) : localSettings.provider === 'openrouter' ? (
                  <div className="space-y-4 border-t border-border/60 pt-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                      <p className="text-sm leading-6 text-primary">
                        OpenRouter uses the server-side OPENROUTER_API_KEY. Explicit mode can run here when your configured model allows adult fictional erotica.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="openrouter-model">OpenRouter Model</Label>
                      <Input
                        id="openrouter-model"
                        value={localSettings.openrouterModel}
                        onChange={e => setLocalSettings(s => ({ ...s, openrouterModel: e.target.value }))}
                        placeholder="e.g. anthropic/claude-3.5-sonnet"
                        className="bg-muted/50 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter any model ID from{' '}
                        <span className="font-medium text-foreground">openrouter.ai/models</span>
                        , e.g. <span className="font-mono">meta-llama/llama-3.1-70b-instruct</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border-t border-border/60 pt-4">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                      <p className="text-sm leading-6 text-amber-200">
                        OpenAI uses the server-side OPENAI_API_KEY for romantic, SFW, and non-explicit flows. Explicit mode is blocked from OpenAI routing.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>OpenAI Model</Label>
                      <Select
                        value={localSettings.openaiModel}
                        onValueChange={value => setLocalSettings(s => ({ ...s, openaiModel: value }))}
                      >
                        <SelectTrigger className="bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPENAI_MODELS.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="space-y-4">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Add your own API keys so the app can call AI providers on your behalf.
                  Keys are stored only on this device — never on our servers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-medium text-foreground">How this works</p>
                  <p className="mt-1">
                    Your key is sent directly to the AI provider for each message. If the server has a shared key
                    configured, that takes priority — your personal key is only used as a fallback.
                  </p>
                </div>

                {/* OpenAI Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="openai-key" className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      OpenAI API Key
                    </Label>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Get a key →
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="openai-key"
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={apiKeys.openaiApiKey}
                      onChange={e => setLocalApiKeys(k => ({ ...k, openaiApiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="bg-muted/50 pr-10 font-mono text-sm"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showOpenaiKey ? 'Hide key' : 'Show key'}
                    >
                      {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for Romantic and Spicy scenes with the OpenAI provider.
                  </p>
                </div>

                {/* OpenRouter Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="openrouter-key" className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      OpenRouter API Key
                    </Label>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Get a key →
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="openrouter-key"
                      type={showOpenrouterKey ? 'text' : 'password'}
                      value={apiKeys.openrouterApiKey}
                      onChange={e => setLocalApiKeys(k => ({ ...k, openrouterApiKey: e.target.value }))}
                      placeholder="sk-or-v1-..."
                      className="bg-muted/50 pr-10 font-mono text-sm"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenrouterKey(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showOpenrouterKey ? 'Hide key' : 'Show key'}
                    >
                      {showOpenrouterKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unlocks explicit-capable providers like Claude, Mistral, and uncensored open-source models.
                  </p>
                </div>

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3 text-xs leading-5 text-amber-200/80">
                  Keys are saved to this browser only. Clearing site data removes them. Don't share your keys.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-4">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Generation Parameters</CardTitle>
                <CardDescription>
                  Fine-tune how the AI generates responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.temperature.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.temperature]}
                    onValueChange={([value]) => setLocalSettings(s => ({ ...s, temperature: value }))}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher = more creative, lower = more consistent
                  </p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Max Tokens</Label>
                    <span className="text-sm text-muted-foreground">
                      {localSettings.maxTokens}
                    </span>
                  </div>
                  <Slider
                    value={[localSettings.maxTokens]}
                    onValueChange={([value]) => setLocalSettings(s => ({ ...s, maxTokens: value }))}
                    min={256}
                    max={8192}
                    step={256}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum length of AI responses
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Prompt Tab */}
          <TabsContent value="prompts" className="space-y-4">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>System Prompt Override</CardTitle>
                <CardDescription>
                  Customize the base instructions for all characters (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={localSettings.systemPromptOverride}
                  onChange={e => setLocalSettings(s => ({ ...s, systemPromptOverride: e.target.value }))}
                  placeholder="Leave empty to use the default roleplay system prompt..."
                  className="min-h-[200px] bg-muted/50"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  This will be prepended to character-specific instructions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account
                </CardTitle>
                <CardDescription>
                  Manage your account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border/50 p-4">
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

    </PageShell>
  );
}
