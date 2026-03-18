import { FileText } from "lucide-react";

interface SourceCardProps {
  document_name: string;
  text: string;
  score: number;
  image_url?: string | null;
  image_caption?: string | null;
}

export default function SourceCard({
  document_name,
  text,
  score,
  image_url,
  image_caption,
}: SourceCardProps) {
  const pct = Math.round(score * 100);

  return (
    <div className="border border-border rounded-lg p-3 bg-surface hover:border-primary/30 transition">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs font-medium truncate">{document_name}</span>
        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
          {pct}%
        </span>
      </div>
      {image_url ? (
        <img
          src={image_url}
          alt={image_caption || document_name}
          className="w-full h-28 object-cover rounded-md mb-2 border border-border"
          loading="lazy"
        />
      ) : null}
      <p className="text-xs text-muted-fg line-clamp-3 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
