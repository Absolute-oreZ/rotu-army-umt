import Link from "next/link";

interface SocialLinksProps {
  links: {
    facebookUrl: string | null;
    instagramUrl: string | null;
    youtubeUrl: string | null;
    tiktokUrl: string | null;
    xUrl: string | null;
  };
}

const SOCIALS = [
  { key: "facebookUrl", src: "/icons/facebook.svg", label: "Facebook" },
  { key: "instagramUrl", src: "/icons/instagram.svg", label: "Instagram" },
  { key: "youtubeUrl", src: "/icons/youtube.svg", label: "YouTube" },
  { key: "xUrl", src: "/icons/x.svg", label: "X" },
] as const;

function SocialIcon({ src }: { src: string }) {
  return (
    <div
      className="h-5 w-5 bg-current"
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

export function SocialLinks({ links }: SocialLinksProps) {
  const active = SOCIALS.filter((s) => links[s.key as keyof typeof links]);

  if (!active.length) return null;

  return (
    <div className="flex items-center gap-4">
      {active.map(({ key, src, label }) => {
        const url = links[key as keyof typeof links];

        return (
          <Link
            key={key}
            href={url!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="p-2 rounded-lg border border-border bg-background text-muted-foreground transition-all hover:text-foreground hover:border-foreground active:scale-95 flex items-center justify-center"
          >
            <SocialIcon src={src} />
          </Link>
        );
      })}
    </div>
  );
}