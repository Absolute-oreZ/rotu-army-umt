export const OFFICIAL_WEB_DOMAINS = [
  "umt.edu.my",
  "pkcp.umt.edu.my",
  "mod.gov.my",
  "army.mil.my",
  "tdm.mil.my",
  "navy.mil.my",
  "airforce.mil.my",
];

export function isAllowedOfficialUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" && OFFICIAL_WEB_DOMAINS.includes(url.hostname)
    );
  } catch {
    return false;
  }
}
