import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAISettings, useUpdateAISettings } from '@/hooks/useAISettings';
import { useToast } from '@/hooks/use-toast';
import { Server, Cloud, Save } from 'lucide-react';

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
  const updateSettings = useUpdateAISettings();

  const [localSettings, setLocalSettings] = useState({
    provider: settings?.provider ?? 'lmstudio',
    lmstudioEndpoint: settings?.lmstudioEndpoint ?? 'http://localhost:1234/v1',
    lmstudioModel: settings?.lmstudioModel ?? 'default',
    openrouterModel: settings?.openrouterModel ?? 'anthropic/claude-3.5-sonnet',
    temperature: settings?.temperature ?? 0.8,
    maxTokens: settings?.maxTokens ?? 2048,
    systemPromptOverride: settings?.systemPromptOverride ?? '',
  });

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setLocalSettings({
        provider: settings.provider,
        lmstudioEndpoint: settings.lmstudioEndpoint,
        lmstudioModel: settings.lmstudioModel,
        openrouterModel: settings.openrouterModel,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        systemPromptOverride: settings.systemPromptOverride ?? '',
      });
    }
  });

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        provider: localSettings.provider as 'lmstudio' | 'openrouter',
        lmstudioEndpoint: localSettings.lmstudioEndpoint,
        lmstudioModel: localSettings.lmstudioModel,
        openrouterModel: localSettings.openrouterModel,
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Configure AI providers and roleplay parameters
          </p>
        </div>

        <Tabs defaultValue="provider" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="provider">AI Provider</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="prompts">System Prompt</TabsTrigger>
          </TabsList>

          {/* Provider Tab */}
          <TabsContent value="provider" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  AI Provider Selection
                </CardTitle>
                <CardDescription>
                  Choose between local AI (LM Studio) or cloud AI (OpenRouter)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">LM Studio (Local)</p>
                      <p className="text-sm text-muted-foreground">Private, no API costs</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.provider === 'lmstudio'}
                    onCheckedChange={(checked) =>
                      setLocalSettings(s => ({ ...s, provider: checked ? 'lmstudio' : 'openrouter' }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">OpenRouter (Cloud)</p>
                      <p className="text-sm text-muted-foreground">Claude, GPT-4, and more</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.provider === 'openrouter'}
                    onCheckedChange={(checked) =>
                      setLocalSettings(s => ({ ...s, provider: checked ? 'openrouter' : 'lmstudio' }))
                    }
                  />
                </div>

                {/* Provider-specific settings */}
                {localSettings.provider === 'lmstudio' ? (
                  <div className="space-y-4 pt-4 border-t border-border/50">
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
                ) : (
                  <div className="space-y-4 pt-4 border-t border-border/50">
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
                    <p className="text-xs text-muted-foreground">
                      Note: OpenRouter API key must be configured in the project secrets
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-4">
            <Card className="glass-card">
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
            <Card className="glass-card">
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
        </Tabs>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="glow-primary">
            <Save className="mr-2 h-4 w-4" />
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
