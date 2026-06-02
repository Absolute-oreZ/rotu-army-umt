"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Mail, ChevronDown } from "lucide-react";

interface NewsletterFormProps {
  locale: Locale;
  subtitle: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  loadingLabel: string;
  localeLabel: string;
  localeOptions: Record<Locale, string>;
  subscribeButton: string;
  errorMessage: string;
  successMessage: string;
}

export function NewsletterForm({
  locale,
  subtitle,
  description,
  emailLabel,
  emailPlaceholder,
  loadingLabel,
  localeLabel,
  localeOptions,
  subscribeButton,
  errorMessage,
  successMessage,
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const options = [
    { value: "en", label: localeOptions.en },
    { value: "ms", label: localeOptions.ms },
    { value: "zh", label: localeOptions.zh },
    { value: "ta", label: localeOptions.ta },
  ] as const;

  const selectedLabel =
    options.find((o) => o.value === selectedLocale)?.label ?? localeOptions.en;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("locale", selectedLocale);

      const result = await subscribeToNewsletter(formData);

      if (result.success) {
        setMessage({ type: "success", text: successMessage });
        setEmail("");
      } else {
        setMessage({ type: "error", text: result.error || errorMessage });
      }
    });
  };

  return (
    <div className="shrink-0 rounded-2xl border border-border bg-muted/20">
      <div className="flex items-start gap-4 px-5 pb-4 pt-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
          <Mail className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            {subtitle}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="relative flex-1 min-w-0" ref={dropdownRef}>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {localeLabel}
              </label>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between whitespace-nowrap overflow-hidden transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {open && (
                <div className="absolute top-full mt-1 w-full overflow-hidden rounded-lg border border-border bg-background shadow-lg z-50">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedLocale(opt.value as Locale);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                        selectedLocale === opt.value && "bg-muted font-medium"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 sm:flex-none">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-transparent select-none">
                .
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="h-9 sm:w-35 flex items-center justify-center rounded-lg bg-foreground px-4 text-xs font-bold uppercase tracking-widest text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 whitespace-nowrap"
              >
                {isPending ? loadingLabel : subscribeButton}
              </button>
            </div>
          </div>

          {message ? (
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-center text-xs font-medium",
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              {message.text}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}