
# UX Polish: Toast Retry Actions, Testing & Avatar Upload

## Overzicht

Dit plan omvat drie onderdelen:
1. Toast retry actions voor error states
2. Handmatige UX test validatie (geen code changes)
3. Image upload voor avatars (characters + personas)

---

## Deel 1: Toast Retry Actions

### Probleem
Momenteel tonen error toasts alleen een foutmelding zonder optie om opnieuw te proberen.

### Oplossing
Voeg een "Retry" knop toe aan error toasts die de gefaalde actie opnieuw uitvoert.

### Implementatie

**Bestanden:**
- `src/pages/CharactersPage.tsx`
- `src/pages/PersonasPage.tsx`
- `src/pages/SessionsPage.tsx`
- `src/pages/ChatPage.tsx`

**Patroon voor elke error toast:**

```text
// Huidige code:
toast({
  title: 'Error',
  description: 'Failed to create character',
  variant: 'destructive',
});

// Nieuwe code:
toast({
  title: 'Error',
  description: 'Failed to create character',
  variant: 'destructive',
  action: (
    <ToastAction altText="Retry" onClick={() => handleCreate(data)}>
      Retry
    </ToastAction>
  ),
});
```

**Import toevoegen:**
```text
import { ToastAction } from '@/components/ui/toast';
```

### Locaties in code

| Bestand | Functie | Regel (circa) |
|---------|---------|---------------|
| CharactersPage.tsx | handleCreate catch | error handler |
| CharactersPage.tsx | handleDuplicate catch | error handler |
| CharactersPage.tsx | handleDelete catch | error handler |
| CharactersPage.tsx | edit onSubmit catch | error handler |
| PersonasPage.tsx | handleCreate catch | error handler |
| PersonasPage.tsx | handleDelete catch | error handler |
| PersonasPage.tsx | edit onSubmit catch | error handler |
| SessionsPage.tsx | handleDeleteSession catch | error handler |
| ChatPage.tsx | handleSend catch | error handler |

---

## Deel 2: UX Test Validatie

Dit is een handmatige test - geen code changes nodig.

### Test Checklist

| Test | Verwacht Resultaat |
|------|-------------------|
| Open chat met character | Messages laden met skeleton placeholders |
| Scroll omhoog in chat | "Scroll to bottom" button verschijnt |
| Klik scroll button | Smooth scroll naar laatste message |
| Druk Cmd/Ctrl+K | Chat input krijgt focus |
| Druk Enter in input | Bericht wordt verzonden |
| Druk Shift+Enter | Nieuwe regel in input |
| Bezoek /characters zonder data | Empty state met icon + CTA |
| Bezoek /personas zonder data | Empty state met icon + CTA |
| Bezoek /sessions zonder data | Empty state met icon + CTA |
| Bekijk character zonder avatar | Initialen met consistent gekleurde achtergrond |

---

## Deel 3: Avatar Image Upload

### Vereisten
- Storage bucket voor avatar uploads
- Upload component met preview
- Integratie in CharacterFormDialog en PersonaFormDialog

### Database: Storage Bucket

```sql
-- Create avatars bucket (public for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow public read access
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated upload (RLS disabled, so anyone can upload for now)
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

-- Allow update/delete of own uploads
CREATE POLICY "Anyone can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
```

### Nieuwe Component: `src/components/ui/avatar-upload.tsx`

```text
Props:
- value?: string (current avatar URL)
- onChange: (url: string | undefined) => void
- placeholder?: string
- className?: string

Functionaliteit:
- Toont huidige avatar of placeholder
- Klik om file selector te openen
- Accepteert alleen images (jpg, png, webp, gif)
- Max 2MB file size
- Upload naar storage bucket
- Retourneert public URL
- Toont loading state tijdens upload
- Toont error bij gefaalde upload
```

**UI elementen:**
- Avatar preview (cirkel)
- Upload icon overlay on hover
- Hidden file input
- Loading spinner tijdens upload
- Camera/Upload icon als placeholder

### Hook: `src/hooks/useAvatarUpload.ts`

```text
export function useAvatarUpload() {
  const uploadAvatar = async (file: File): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only images are allowed');
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Image must be less than 2MB');
    }
    
    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filename, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };
  
  return { uploadAvatar };
}
```

### CharacterFormDialog Updates

**Import toevoegen:**
```text
import { AvatarUpload } from '@/components/ui/avatar-upload';
```

**Vervang huidige Avatar URL input (regel 119-131):**

```text
// Huidige code:
<div className="space-y-2">
  <Label htmlFor="avatarUrl">Portrait URL (optional)</Label>
  <Input ... />
</div>

// Nieuwe code:
<div className="space-y-2">
  <Label>Character Portrait (optional)</Label>
  <div className="flex items-center gap-4">
    <AvatarUpload
      value={watch('avatarUrl')}
      onChange={(url) => setValue('avatarUrl', url ?? '')}
      placeholder={watch('name')?.charAt(0) ?? 'C'}
    />
    <div className="flex-1">
      <Input
        {...register('avatarUrl')}
        placeholder="Or paste image URL..."
        className="bg-muted/50"
      />
    </div>
  </div>
</div>
```

### PersonaFormDialog Updates

Zelfde patroon als CharacterFormDialog (regel 133-142).

---

## Bestanden Overzicht

| Bestand | Actie |
|---------|-------|
| SQL Migration | Storage bucket + policies |
| `src/hooks/useAvatarUpload.ts` | Nieuw bestand |
| `src/components/ui/avatar-upload.tsx` | Nieuw bestand |
| `src/components/characters/CharacterFormDialog.tsx` | Avatar upload integratie |
| `src/components/personas/PersonaFormDialog.tsx` | Avatar upload integratie |
| `src/pages/CharactersPage.tsx` | Toast retry actions |
| `src/pages/PersonasPage.tsx` | Toast retry actions |
| `src/pages/SessionsPage.tsx` | Toast retry actions |
| `src/pages/ChatPage.tsx` | Toast retry actions |

---

## AvatarUpload Component Structuur

```text
<div className="relative group cursor-pointer">
  <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/50">
    {value ? (
      <AvatarImage src={value} />
    ) : (
      <AvatarFallback>{placeholder}</AvatarFallback>
    )}
  </Avatar>
  
  {/* Overlay */}
  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 
                  group-hover:opacity-100 transition-opacity flex items-center 
                  justify-center">
    {isUploading ? (
      <Loader2 className="h-6 w-6 animate-spin text-white" />
    ) : (
      <Upload className="h-6 w-6 text-white" />
    )}
  </div>
  
  <input
    type="file"
    accept="image/*"
    className="absolute inset-0 opacity-0 cursor-pointer"
    onChange={handleFileChange}
    disabled={isUploading}
  />
</div>
```

---

## Data Flow: Avatar Upload

```text
1. User klikt op avatar placeholder
   ↓
2. File selector opent (accept="image/*")
   ↓
3. User selecteert image
   ↓
4. Validatie (type + size)
   ↓
5. Upload naar storage.avatars bucket
   ↓
6. Public URL terugontvangen
   ↓
7. onChange(publicUrl) aangeroepen
   ↓
8. Form state updated met nieuwe URL
   ↓
9. Avatar preview toont nieuwe image
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Upload mislukt | Toast error + keep current value |
| File te groot | Toast error "Image must be less than 2MB" |
| Verkeerd bestandstype | Toast error "Only images are allowed" |
| User wist avatar | onChange(undefined), fallback naar initialen |
| Zowel upload als URL | Upload heeft priority, URL als fallback input |

---

## Verificatie

Na implementatie:
1. **Toast Retry**: Forceer een error (disconnect netwerk), klik Retry
2. **Avatar Upload**: Upload een image in character form
3. **Preview**: Controleer dat avatar correct toont in character card
4. **URL Fallback**: Plak een externe URL in plaats van upload
5. **Validation**: Probeer een te groot bestand te uploaden
