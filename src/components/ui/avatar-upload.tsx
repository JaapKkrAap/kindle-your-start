import { useRef, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function AvatarUpload({ 
  value, 
  onChange, 
  placeholder = '?',
  className 
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const { toast } = useToast();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadAvatar(file);
      onChange(url);
      toast({
        title: 'Avatar uploaded',
        description: 'Your new avatar has been set.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive',
      });
    }

    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [uploadAvatar, onChange, toast]);

  return (
    <div 
      className={cn(
        "relative group cursor-pointer",
        isUploading && "pointer-events-none",
        className
      )}
      onClick={() => inputRef.current?.click()}
    >
      <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/50 transition-colors group-hover:border-primary/70">
        {value ? (
          <AvatarImage src={value} alt="Avatar" className="object-cover" />
        ) : null}
        <AvatarFallback className="text-lg font-semibold bg-muted text-muted-foreground">
          {placeholder}
        </AvatarFallback>
      </Avatar>

      {/* Overlay */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full bg-black/50 flex items-center justify-center transition-opacity",
          isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        ) : (
          <Upload className="h-6 w-6 text-white" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}
