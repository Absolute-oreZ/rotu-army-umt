const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstileToken(token: string | null): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping verification");
    return { success: true };
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return { success: false, "error-codes": ["missing-input"] };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json() as TurnstileVerifyResult;
    return result;
  } catch (error) {
    console.error("Turnstile verification failed:", error);
    return { success: false, "error-codes": ["verification-failed"] };
  }
}