"use client";

import { useState, useTransition, useMemo, type ReactNode } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { calculateAge, isValidPersonalEmail, isValidEduEmail, defaultBirthdate, formatLabel } from "@/lib/utils";
import { digitsOnly } from "@/lib/admin/form-helpers";
import { addCadet } from "@/app/admin/secretary/cadets/actions";
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
import { ChevronDownIcon } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type IntakeOption = { id: number; intakeNo: string };

export function AddCadetDialog({
  trigger,
  intakeOptions,
}: {
  trigger: ReactNode;
  intakeOptions: IntakeOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [armyNo, setArmyNo] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [eduEmail, setEduEmail] = useState("");
  const [gender, setGender] = useState("");
  const [religion, setReligion] = useState("");
  const [race, setRace] = useState("");
  const [address, setAddress] = useState("");
  const [birthdate, setBirthdate] = useState<Date | undefined>(defaultBirthdate);
  const [rank, setRank] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [intakeId, setIntakeId] = useState("");
  const [quote, setQuote] = useState("");
  const [redBgFile, setRedBgFile] = useState<File | null>(null);
  const [blueBgFile, setBlueBgFile] = useState<File | null>(null);
  const [displayFile, setDisplayFile] = useState<File | null>(null);
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

  function resetForm() {
    setName("");
    setDisplayName("");
    setArmyNo("");
    setPersonalEmail("");
    setEduEmail("");
    setGender("");
    setReligion("");
    setRace("");
    setAddress("");
    setBirthdate(defaultBirthdate());
    setRank("");
    setMatricNo("");
    setIntakeId("");
    setQuote("");
    setRedBgFile(null);
    setBlueBgFile(null);
    setDisplayFile(null);
    setTouched(new Set());
    setError(null);
  }

  function handleOpen() {
    resetForm();
    setOpen(true);
  }

  function handleSubmit() {
    if (!formValid) return;

    const totalSize = [redBgFile, blueBgFile, displayFile]
      .filter((f): f is File => !!f)
      .reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 4.5 * 1024 * 1024) {
      setError("Total image size exceeds 4.5 MB. Please use smaller images.");
      return;
    }

    startTransition(async () => {
      if (!birthdate) {
        setError("Birthdate is required.");
        return;
      }
      const age = calculateAge(birthdate);
      if (age < MIN_AGE || age > MAX_AGE) {
        setError(`Age must be between ${MIN_AGE} and ${MAX_AGE}.`);
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("displayName", displayName);
      formData.append("armyNo", armyNo);
      formData.append("personalEmail", personalEmail);
      if (eduEmail) formData.append("eduEmail", eduEmail);
      formData.append("gender", gender);
      formData.append("religion", religion);
      formData.append("race", race);
      formData.append("address", address);
      formData.append("birthdate", format(birthdate, "yyyy-MM-dd"));
      formData.append("rank", rank);
      formData.append("matricNo", matricNo.toUpperCase());
      formData.append("intakeId", intakeId);
      if (quote) formData.append("quote", quote);
      formData.append("isActive", "true");
      if (redBgFile) formData.append("redBgPhoto", redBgFile);
      if (blueBgFile) formData.append("blueBgPhoto", blueBgFile);
      if (displayFile) formData.append("displayPhoto", displayFile);

      const result = await addCadet(formData);

      if (result.success) {
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to add cadet.");
      }
    });
  }

  return (
    <>
      <div
        role="Button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpen();
        }}
        className="inline-flex"
      >
        {trigger}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Cadet</DialogTitle>
            <DialogDescription>
              Fill in the cadet&apos;s information. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
                    onChange={(e) => setMatricNo(e.target.value.toUpperCase())}
                    placeholder="e.g. MAT4500"
                    className="uppercase"
                  />
                </Field>
                <Field label="Rank" required>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className="text-muted-foreground">
                          {rank ? formatLabel(rank) : "Select rank"}
                        </span>

                        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
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
                      <Button
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className="text-muted-foreground">
                          {gender ? formatLabel(gender) : "Select gender"}
                        </span>

                        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
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
                      <Button
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className="text-muted-foreground">
                          {religion ? formatLabel(religion) : "Select religion"}
                        </span>

                        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
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
                      <Button
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className="text-muted-foreground">
                          {race ? formatLabel(race) : "Select race"}
                        </span>

                        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
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
                <Field label="Personal Email" error={touched.has("personalEmail") ? errors.personalEmail : undefined}>
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
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Intake
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Intake" required>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm flex items-center justify-between transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className="text-muted-foreground">
                          {intakeId
                            ? intakeOptions.find((i) => String(i.id) === intakeId)?.intakeNo
                            : "Select intake"}
                        </span>

                        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
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
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Images
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Red BG Photo">
                  <SingleFileField file={redBgFile} onChange={setRedBgFile} onRemove={() => setRedBgFile(null)} />
                </Field>
                <Field label="Blue BG Photo">
                  <SingleFileField file={blueBgFile} onChange={setBlueBgFile} onRemove={() => setBlueBgFile(null)} />
                </Field>
                <Field label="Display Photo">
                  <SingleFileField file={displayFile} onChange={setDisplayFile} onRemove={() => setDisplayFile(null)} />
                </Field>
              </div>
            </section>
          </div>

          {error && (
            <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-500">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!formValid || isPending}
            >
              {isPending ? "Adding..." : "Add Cadet"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
