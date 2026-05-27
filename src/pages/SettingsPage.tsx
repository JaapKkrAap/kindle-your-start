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
import type { AIProvider } from '@/types';
import { Bot, Cloud, Save, Server, LogOut, User } from 'lucide-react';

const OPENAI_MODELS = [
  { id: 'gpt-5-mini', name: 'GPT-5 mini' },
  { id: 'gpt-5-nano', name: 'GPT-5 nano' },
  { id: 'gpt-5.2', name: 'GPT-5.2' },
];

const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'openai/gpt-4o', name: 'GPT-4o' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
  { id: 'mistralai/mistral-large', name: 'Mistral Large' },
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
    openaiModel: 'gpt-5-mini',
    temperature: 0.8,
    maxTokens: 2048,
    systemPromptOverride: '',
  });

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
          <TabsList className="grid h-auto w-full grid-cols-2 bg-muted/45 p-1 sm:inline-grid sm:w-auto sm:grid-cols-4">
            <TabsTrigger value="provider">AI Provider</TabsTrigger>
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
                      <Label>OpenRouter Model</Label>
                      <Select
                        value={localSettings.openrouterModel}
                        onValueChange={value => setLocalSettings(s => ({ ...s, openrouterModel: value }))}
                      >
                        <SelectTrigger className="bg-muted/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPENROUTER_MODELS.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
