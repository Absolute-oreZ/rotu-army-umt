import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { storageUrl } from "@/lib/supabase/storage-public";
import { type PublicStoryProgram } from "@/lib/public/content";

interface SimilarStoriesProps {
  locale: string;
  stories: PublicStoryProgram[];
  title: string;
}

export function SimilarStories({ locale, stories, title }: SimilarStoriesProps) {
  if (stories.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 border-t border-border">
      <div className="flex flex-col gap-6 sm:gap-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/${locale}/stories/${story.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-muted/30 transition-all hover:border-foreground/30 hover:bg-muted/50 active:scale-[0.98]"
            >
              {story.coverPhotoPath ? <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={storageUrl(story.coverPhotoPath)}
                  alt={story.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div> : null}
              <div className="flex flex-col gap-2 p-3 sm:p-4">
                <h3 className="line-clamp-2 text-sm font-bold leading-tight tracking-tight group-hover:text-primary transition-colors">
                  {story.title}
                </h3>
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>View Operation</span>
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
