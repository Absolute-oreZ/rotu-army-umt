import assert from "node:assert/strict";
import test from "node:test";
import { selectBestAdminTool } from "../lib/ai/admin/tools/selection";
import { escapeSearchWildcards } from "../lib/ai/admin/tools/shared";

test("specific intake deadlines outrank generic payment wording", () => {
  const tools = [
    { name: "get_treasury_statistics", detect: /payments?/i },
    { name: "get_intake_statistics", detect: /intakes?/i },
  ];
  assert.equal(
    selectBestAdminTool(
      "What is the payment deadline for the new intake?",
      tools,
    )?.name,
    "get_intake_statistics",
  );
});

test("cadet search and aggregate language select distinct tool contracts", () => {
  const tools = [
    {
      name: "search_cadets",
      detect:
        /\b(search|find|lookup|list|show)\b.{0,35}\b(cadets?|members?|kadet)\b/i,
    },
    {
      name: "get_cadet_statistics",
      detect:
        /\b(how many|count|statistics|stats|total|active|inactive)\b.{0,35}\b(cadets?|members?|kadet)\b|\b(cadets?|members?|kadet)\b.{0,35}\b(count|statistics|stats|total|active|inactive)\b/i,
    },
  ];
  assert.equal(
    selectBestAdminTool("search cadets named Ahmad", tools)?.name,
    "search_cadets",
  );
  assert.equal(
    selectBestAdminTool("how many active cadets?", tools)?.name,
    "get_cadet_statistics",
  );
  assert.equal(selectBestAdminTool("cadet profile", tools), null);
});

test("Admin AI search treats SQL wildcard characters as literals", () => {
  assert.equal(escapeSearchWildcards("100%_ready\\"), "100\\%\\_ready\\\\");
});
