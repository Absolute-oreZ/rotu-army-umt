"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { Mail, ChevronDown } from "lucide-react";
import Script from "next/script";
import { getTurnstileSiteKey } from "@/lib/turnstile-client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface NewsletterFormProps {
  locale: Locale;
  copy: Dictionary["contactPage"]["newsletter"];
}

export function NewsletterForm({ locale, copy }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [selectedLocale, setSelectedLocale] = useState(locale);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [turnstileReady, setTurnstileReady] = useState(false);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetRef = useRef<string | null>(null);

  const turnstileSiteKey = getTurnstileSiteKey();

  const renderTurnstile = useCallback(() => {
    if (
      !turnstileSiteKey ||
      turnstileWidgetRef.current ||
      typeof window === "undefined" ||
      !window.turnstile ||
      !turnstileContainerRef.current
    ) {
      return;
    }

    const widgetId = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      callback: () => setTurnstileReady(true),
      "error-callback": () => setTurnstileReady(false),
      "expired-callback": () => setTurnstileReady(false),
      theme: "auto",
    });

    turnstileWidgetRef.current = widgetId ?? "rendered";
  }, [turnstileSiteKey]);

  const options = [
    { value: "en", label: copy.languageOptions.en },
    { value: "ms", label: copy.languageOptions.ms },
    { value: "zh", label: copy.languageOptions.zh },
    { value: "ta", label: copy.languageOptions.ta },
  ] as const;

  const selectedLabel =
    options.find((o) => o.value === selectedLocale)?.label ?? copy.languageOptions.en;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!turnstileSiteKey || typeof window === "undefined") return;

    if (window.turnstile) {
      renderTurnstile();
      return;
    }

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (window.turnstile) {
        renderTurnstile();
        window.clearInterval(timer);
        return;
      }
      if (attempts >= 20) {
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [turnstileSiteKey, renderTurnstile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const turnstileToken = turnstileSiteKey ? window.turnstile?.getResponse() ?? null : null;

    if (turnstileSiteKey && !turnstileToken) {
      setMessage({
        type: "error",
        text: turnstileReady
          ? copy.errorSecurityFailed
          : copy.errorSecurityNotReady,
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("locale", selectedLocale);
      if (turnstileToken) formData.append("cf-turnstile-response", turnstileToken);

      const result = await subscribeToNewsletter(formData);

      if (result.success) {
        setMessage({ type: "success", text: copy.success });
        setEmail("");
      } else {
        setMessage({ type: "error", text: result.error || copy.errorUnexpected });
      }

      if (turnstileSiteKey && typeof window !== "undefined" && window.turnstile) {
        window.turnstile.reset(turnstileWidgetRef.current ?? undefined);
        setTurnstileReady(false);
      }
    });
  };

  return (
    <div className="shrink-0 rounded-2xl border border-border bg-muted/20">
      {turnstileSiteKey ? (
        <Script
          strategy="afterInteractive"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          onReady={renderTurnstile}
        />
      ) : null}
      <div className="flex items-start gap-4 px-5 pb-4 pt-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground">
          <Mail className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex flex-col gap-0.5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
            {copy.subtitle}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {copy.description}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {copy.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              required
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {turnstileSiteKey ? <div ref={turnstileContainerRef} className="min-h-[72px] overflow-visible" /> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
            <div className="relative flex-1 min-w-0" ref={dropdownRef}>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {copy.languageLabel}
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
                {isPending ? copy.loadingLabel : copy.submitLabel}
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
