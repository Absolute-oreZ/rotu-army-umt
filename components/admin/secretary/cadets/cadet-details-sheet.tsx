"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { ChevronDownIcon, PencilIcon } from "lucide-react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetSkeleton,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  calculateAge,
  isValidPersonalEmail,
  isValidEduEmail,
  formatLabel,
} from "@/lib/utils";
import { digitsOnly } from "@/lib/admin/form-helpers";
import {
  getCadetDetails,
  updateCadet,
  type CadetDetails,
} from "@/app/admin/secretary/cadets/actions";
import {
  GENDER_OPTIONS,
  RELIGION_OPTIONS,
  RACE_OPTIONS,
  MIN_AGE,
  MAX_AGE,
} from "@/lib/data";
import { SingleFileField } from "@/components/ui/single-file-field";
import { CADET_RANKS } from "@/db/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown";
import { Field } from "@/components/ui/field";
import { storageUrl } from "@/lib/supabase/storage-public";

type IntakeOption = { id: number; intakeNo: string };

export function CadetDetailsSheet({
  cadetInfoId,
  initialMode,
  open,
  onOpenChange,
  intakeOptions,
}: {
  cadetInfoId: number | null;
  initialMode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intakeOptions: IntakeOption[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent className="w-140 max-w-[calc(100vw-2rem)] p-0">
        {open && cadetInfoId != null && (
          <SheetInner
            key={cadetInfoId}
            cadetInfoId={cadetInfoId}
            initialMode={initialMode}
            intakeOptions={intakeOptions}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetInner({
  cadetInfoId,
  initialMode,
  intakeOptions,
  onClose,
}: {
  cadetInfoId: number;
  initialMode: "view" | "edit";
  intakeOptions: IntakeOption[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [details, setDetails] = useState<CadetDetails | null>(null);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);

  useEffect(() => {
    let cancelled = false;
    getCadetDetails(cadetInfoId).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setFetchError(res.error);
      } else {
        setDetails(res.data);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [cadetInfoId]);

  if (loading) {
    return (
      <SheetSkeleton className="w-140 max-w-[calc(100vw-2rem)] p-0" />
    );
  }

  if (fetchError || !details) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Error</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-sm text-red-500">
          {fetchError ?? "Cadet not found."}
        </div>
      </>
    );
  }

  if (mode === "view") {
    return <ViewMode details={details} onEdit={() => setMode("edit")} />;
  }

  return (
    <EditMode
      details={details}
      intakeOptions={intakeOptions}
      onCancel={() => setMode("view")}
      onClose={onClose}
    />
  );
}

function ViewMode({ details, onEdit }: { details: CadetDetails; onEdit: () => void }) {
  const d = details;
  return (
    <>
      <SheetHeader>
        <SheetTitle>Cadet Details</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <DetailRow label="Full Name" value={d.name} />
              <DetailRow label="Display Name" value={d.displayName} />
              <DetailRow label="Army No" value={String(d.armyNo)} />
              <DetailRow label="Matric No" value={d.matricNo ?? "-"} />
              <DetailRow label="Rank" value={formatLabel(d.rank)} />
              <DetailRow label="Gender" value={formatLabel(d.gender)} />
              <DetailRow label="Birthdate" value={format(new Date(d.birthdate), "dd MMM yyyy")} />
              <DetailRow label="Age" value={String(d.age)} />
              <DetailRow label="Religion" value={formatLabel(d.religion)} />
              <DetailRow label="Race" value={formatLabel(d.race)} />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <DetailRow label="Personal Email" value={d.personalEmail} />
              <DetailRow label="Edu Email" value={d.eduEmail ?? "-"} />
              <DetailRow label="Address" value={d.address} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Intake
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <DetailRow label="Intake" value={d.intakeNo} />
              <DetailRow label="Quote" value={d.quote ?? "-"} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Status
            </h3>
            <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${d.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
              {d.isActive ? "Active" : "Inactive"}
            </span>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Images
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <ImagePreview label="Red BG" url={d.redBgPhotoPath} />
              <ImagePreview label="Blue BG" url={d.blueBgPhotoPath} />
              <ImagePreview label="Display" url={d.displayPhotoPath} />
            </div>
          </section>
        </div>
      </div>

      <SheetFooter>
        <Button onClick={onEdit}>
          <PencilIcon className="size-3.5" />
          Edit
        </Button>
      </SheetFooter>
    </>
  );
}

function EditMode({
  details,
  intakeOptions,
  onCancel,
  onClose,
}: {
  details: CadetDetails;
  intakeOptions: IntakeOption[];
  onCancel: () => void;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(details.name);
  const [displayName, setDisplayName] = useState(details.displayName);
  const [armyNo, setArmyNo] = useState(String(details.armyNo));
  const [personalEmail, setPersonalEmail] = useState(details.personalEmail);
  const [eduEmail, setEduEmail] = useState(details.eduEmail ?? "");
  const [gender, setGender] = useState(details.gender);
  const [religion, setReligion] = useState(details.religion);
  const [race, setRace] = useState(details.race);
  const [address, setAddress] = useState(details.address);
  const [birthdate, setBirthdate] = useState<Date | undefined>(() => new Date(details.birthdate));
  const [rank, setRank] = useState(details.rank);
  const [matricNo, setMatricNo] = useState(details.matricNo ?? "");
  const [intakeId, setIntakeId] = useState(String(details.intakeId));
  const [quote, setQuote] = useState(details.quote ?? "");
  const [redBgFile, setRedBgFile] = useState<File | null>(null);
  const [blueBgFile, setBlueBgFile] = useState<File | null>(null);
  const [displayFile, setDisplayFile] = useState<File | null>(null);
  const [removeRedBg, setRemoveRedBg] = useState(false);
  const [removeBlueBg, setRemoveBlueBg] = useState(false);
  const [removeDisplay, setRemoveDisplay] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  function touch(field: string) {
    setTouched((prev) => {
      if (prev.has(field)) return prev;
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }

  function handleRankChange(v: string) {
    setRank(v);
    touch("rank");
    if (v === "PK") { setGender("MALE"); touch("gender"); }
    else if (v === "PKW") { setGender("FEMALE"); touch("gender"); }
  }

  function handleGenderChange(v: string) {
    setGender(v);
    touch("gender");
    if (v === "MALE") { setRank("PK"); touch("rank"); }
    else if (v === "FEMALE") { setRank("PKW"); touch("rank"); }
  }

  const birthdateMaxDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear() - MIN_AGE, d.getMonth(), d.getDate());
  }, []);

  const birthdateMinDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear() - MAX_AGE, d.getMonth(), d.getDate());
  }, []);

  const formValid = useMemo(() => {
    const emailOk = !personalEmail || isValidPersonalEmail(personalEmail);
    const eduEmailOk = !eduEmail || isValidEduEmail(eduEmail);
    const armyNoOk = /^\d+$/.test(armyNo.trim()) && parseInt(armyNo) > 0;
    return !!(name && displayName && armyNo && rank && gender && birthdate && religion && race && personalEmail && address && matricNo && intakeId)
      && armyNoOk && emailOk && eduEmailOk;
  }, [name, displayName, armyNo, rank, gender, birthdate, religion, race, personalEmail, eduEmail, address, matricNo, intakeId]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (armyNo && !/^\d+$/.test(armyNo.trim())) e.armyNo = "Must be a number (e.g. 4500)";
    if (personalEmail && !isValidPersonalEmail(personalEmail)) e.personalEmail = "Invalid email or must not be ocean.umt.edu.my";
    if (eduEmail && !isValidEduEmail(eduEmail)) e.eduEmail = "Must be a ocean.umt.edu.my email";
    return e;
  }, [armyNo, personalEmail, eduEmail]);

  function handleRedBgChange(f: File | null) {
    if (f) { setRedBgFile(f); setRemoveRedBg(false); }
    else if (!redBgFile && details.redBgPhotoPath) { setRemoveRedBg(true); }
    else { setRedBgFile(null); }
  }

  function handleBlueBgChange(f: File | null) {
    if (f) { setBlueBgFile(f); setRemoveBlueBg(false); }
    else if (!blueBgFile && details.blueBgPhotoPath) { setRemoveBlueBg(true); }
    else { setBlueBgFile(null); }
  }

  function handleDisplayChange(f: File | null) {
    if (f) { setDisplayFile(f); setRemoveDisplay(false); }
    else if (!displayFile && details.displayPhotoPath) { setRemoveDisplay(true); }
    else { setDisplayFile(null); }
  }

  const redBgExisting = removeRedBg || !details.redBgPhotoPath ? null : storageUrl(details.redBgPhotoPath);
  const blueBgExisting = removeBlueBg || !details.blueBgPhotoPath ? null : storageUrl(details.blueBgPhotoPath);
  const displayExisting = removeDisplay || !details.displayPhotoPath ? null : storageUrl(details.displayPhotoPath);

  function handleSubmit() {
    if (!formValid) {
      setTouched(new Set(["armyNo", "personalEmail", "eduEmail"]));
      return;
    }
    startTransition(async () => {
      if (!birthdate) { setError("Birthdate is required."); return; }
      const age = calculateAge(birthdate);
      if (age < MIN_AGE || age > MAX_AGE) {
        setError(`Age must be between ${MIN_AGE} and ${MAX_AGE}.`);
        return;
      }

      const fd = new FormData();
      fd.append("cadetInfoId", String(details.cadetInfoId));
      fd.append("memberId", String(details.memberId));
      fd.append("name", name);
      fd.append("displayName", displayName);
      fd.append("armyNo", armyNo);
      fd.append("personalEmail", personalEmail);
      if (eduEmail) fd.append("eduEmail", eduEmail);
      fd.append("gender", gender);
      fd.append("religion", religion);
      fd.append("race", race);
      fd.append("address", address);
      fd.append("birthdate", format(birthdate, "yyyy-MM-dd"));
      fd.append("rank", rank);
      fd.append("matricNo", matricNo.toUpperCase());
      fd.append("intakeId", intakeId);
      if (quote) fd.append("quote", quote);
      fd.append("isActive", String(details.isActive));

      if (redBgFile) fd.append("redBgPhoto", redBgFile);
      if (blueBgFile) fd.append("blueBgPhoto", blueBgFile);
      if (displayFile) fd.append("displayPhoto", displayFile);
      if (removeRedBg) fd.append("removeRedBgPhoto", "true");
      if (removeBlueBg) fd.append("removeBlueBgPhoto", "true");
      if (removeDisplay) fd.append("removeDisplayPhoto", "true");

      const result = await updateCadet(fd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Failed to update cadet.");
      }
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit Cadet</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Display Name" required>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Short name" />
              </Field>
              <Field label="Army No" required error={touched.has("armyNo") ? errors.armyNo : undefined}>
                <Input
                  value={armyNo}
                  onChange={(e) => setArmyNo(digitsOnly(e.target.value))}
                  onBlur={() => touch("armyNo")}
                  placeholder="e.g. 4500"
                />
              </Field>
              <Field label="Matric No" required>
                <Input
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value.toUpperCase)}
                  placeholder="e.g. MAT4500"
                  className="uppercase"
                />
              </Field>
              <Field label="Rank" required>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="text-muted-foreground">
                        {rank ? formatLabel(rank) : "Select rank"}
                      </span>

                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-full">
                    {CADET_RANKS.map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => handleRankChange(r)}
                      >
                        {formatLabel(r)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
              <Field label="Gender" required>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="text-muted-foreground">
                        {gender ? formatLabel(gender) : "Select gender"}
                      </span>

                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-full">
                    {GENDER_OPTIONS.map((g) => (
                      <DropdownMenuItem
                        key={g}
                        onClick={() => handleGenderChange(g)}
                      >
                        {formatLabel(g)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Birthdate" required>
                <DatePicker
                  value={birthdate}
                  onChange={setBirthdate}
                  placeholder="Select birthdate"
                  maxDate={birthdateMaxDate}
                  minDate={birthdateMinDate}
                />
              </Field>
              <Field label="Religion" required>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="text-muted-foreground">
                        {religion ? formatLabel(religion) : "Select religion"}
                      </span>

                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-full">
                    {RELIGION_OPTIONS.map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => setReligion(r)}
                      >
                        {formatLabel(r)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
              <Field label="Race" required>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="text-muted-foreground">
                        {race ? formatLabel(race) : "Select race"}
                      </span>

                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-full">
                    {RACE_OPTIONS.map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => setRace(r)}
                      >
                        {formatLabel(r)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Field label="Personal Email" required error={touched.has("personalEmail") ? errors.personalEmail : undefined}>
                <Input value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} onBlur={() => touch("personalEmail")} placeholder="email@example.com" type="email" />
              </Field>
              <Field label="Edu Email" error={touched.has("eduEmail") ? errors.eduEmail : undefined}>
                <Input value={eduEmail} onChange={(e) => setEduEmail(e.target.value)} onBlur={() => touch("eduEmail")} placeholder="edu@ocean.umt.edu.my (optional)" type="email" />
              </Field>
              <Field label="Address" required>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Intake
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Intake" required>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <span className="text-muted-foreground">
                        {intakeId
                          ? intakeOptions.find((i) => String(i.id) === intakeId)?.intakeNo
                          : "Select intake"}
                      </span>

                      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-full">
                    {intakeOptions.map((i) => (
                      <DropdownMenuItem
                        key={i.id}
                        onClick={() => setIntakeId(String(i.id))}
                      >
                        {i.intakeNo}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Field>
              <Field label="Quote">
                <Input value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Personal motto (optional)" />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Images
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Red BG Photo">
                <SingleFileField file={redBgFile} onChange={handleRedBgChange} onRemove={() => { setRedBgFile(null); setRemoveRedBg(true); }} existingUrl={redBgExisting} />
              </Field>
              <Field label="Blue BG Photo">
                <SingleFileField file={blueBgFile} onChange={handleBlueBgChange} onRemove={() => { setBlueBgFile(null); setRemoveBlueBg(true); }} existingUrl={blueBgExisting} />
              </Field>
              <Field label="Display Photo">
                <SingleFileField file={displayFile} onChange={handleDisplayChange} onRemove={() => { setDisplayFile(null); setRemoveDisplay(true); }} existingUrl={displayExisting} />
              </Field>
            </div>
          </section>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-500">
            {error}
          </div>
        )}
      </div>

      <SheetFooter className="flex-row justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </SheetFooter>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function ImagePreview({ label, url }: { label: string; url: string | null }) {
  const resolvedUrl = url ? storageUrl(url) : undefined;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {resolvedUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border">
          <Image
            src={resolvedUrl}
            alt={label}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
          None
        </div>
      )}
    </div>
  );
}
