import ReactPlayer from "react-player";
import { AlertCircle, Loader2 } from "lucide-react";
import { useVimeoPreview } from "@/hooks/exercises/useVimeoPreview";
import type { VimeoPreviewWidgetProps } from "@/interface";

export const VimeoPreviewWidget = ({ videoId, className = "" }: VimeoPreviewWidgetProps) => {
  const { isValid, isLoading } = useVimeoPreview(videoId);

  if (!videoId) {
    return (
      <div
        className={`aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground border border-dashed ${className}`}
      >
        <span className="text-sm">Wpisz ID wideo, aby zobaczyć podgląd</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`aspect-video bg-muted rounded-md flex items-center justify-center text-muted-foreground ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span className="text-sm">Sprawdzanie...</span>
      </div>
    );
  }

  if (isValid === false) {
    return (
      <div
        className={`aspect-video bg-red-50 border border-red-100 rounded-md flex items-center justify-center text-red-600 ${className}`}
      >
        <div className="flex flex-col items-center gap-1">
          <AlertCircle className="h-6 w-6" />
          <span className="text-sm font-medium">Nieprawidłowe ID wideo</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-video bg-black rounded-md overflow-hidden relative ${className}`}>
      <ReactPlayer
        src={`https://vimeo.com/${videoId}`}
        width="100%"
        height="100%"
        controls
        light={true} // Load thumbnail first
      />
    </div>
  );
};
