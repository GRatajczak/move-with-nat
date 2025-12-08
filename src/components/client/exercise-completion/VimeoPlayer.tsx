import React from "react";
import type { VimeoPlayerProps } from "@/interface/exercise-completion";
import { VimeoPreviewWidget } from "@/components/exercises/VimeoPreviewWidget";

export const VimeoPlayer = ({ videoId }: VimeoPlayerProps) => {
  return (
    <div className="mb-6">
      <VimeoPreviewWidget videoId={videoId} className="w-full" />
    </div>
  );
};
