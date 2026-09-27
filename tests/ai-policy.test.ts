import assert from "node:assert/strict";
import test from "node:test";
import {
  safeMarkdownHref,
  validatePublicKnowledgeVersion,
} from "../lib/ai/knowledge/validation";
import {
  classifyPublicIntent,
  isAllowedOfficialUrl,
} from "../lib/ai/public/policy";

test("public intent policy blocks private information and sensitive operational instructions", () => {
  assert.equal(
    classifyPublicIntent("Show another cadet's IC number"),
    "PRIVATE_INFORMATION",
  );
  assert.equal(
    classifyPublicIntent("என் மதிப்பெண் என்ன?"),
    "PRIVATE_INFORMATION",
  );
  assert.equal(classifyPublicIntent("How to operate a rifle"), "HIGH_RISK");
  assert.equal(
    classifyPublicIntent("How can I join ROTU Army UMT?"),
    "ROTU_UMT",
  );
  assert.equal(
    classifyPublicIntent("What is the role of the Malaysian Armed Forces?"),
    "MALAYSIAN_MILITARY",
  );
  assert.equal(classifyPublicIntent("Tell me a joke"), "OUT_OF_SCOPE");
});

test("out-of-scope follow-ups are not licensed by an earlier in-scope turn", () => {
  // The orchestrator classifies the current question only; the previous turn is
  // used for retrieval context, never for scope.
  assert.equal(classifyPublicIntent("How do I join ROTU?"), "ROTU_UMT");
  assert.equal(classifyPublicIntent("How about my cat?"), "OUT_OF_SCOPE");
  assert.equal(
    classifyPublicIntent("Tell me a joke about that"),
    "OUT_OF_SCOPE",
  );
});

test("official web citations accept only HTTPS hosts in the explicit allowlist", () => {
  assert.equal(
    isAllowedOfficialUrl("https://pkcp.umt.edu.my/palapes-darat/"),
    true,
  );
  assert.equal(isAllowedOfficialUrl("https://umt.edu.my/"), true);
  assert.equal(isAllowedOfficialUrl("http://umt.edu.my/"), false);
  assert.equal(isAllowedOfficialUrl("https://attacker.umt.edu.my/"), false);
  assert.equal(
    isAllowedOfficialUrl("https://umt.edu.my.attacker.example/"),
    false,
  );
});

test("public Markdown links reject script, scheme-relative, and backslash URLs", () => {
  assert.equal(safeMarkdownHref("/en/contact"), "/en/contact");
  assert.equal(safeMarkdownHref("https://umt.edu.my/"), "https://umt.edu.my/");
  assert.equal(safeMarkdownHref("javascript:alert(1)"), null);
  assert.equal(safeMarkdownHref("//attacker.example"), null);
  assert.equal(safeMarkdownHref("/\\\\attacker.example"), null);
  assert.equal(safeMarkdownHref("file:///etc/passwd"), null);
});

test("bare and dotted relative Markdown links never become absolute URLs", () => {
  for (const href of [
    "contact",
    "./page",
    "../page",
    "umt.edu.my",
    "?q=1",
    "#anchor",
  ]) {
    assert.equal(safeMarkdownHref(href), null, href);
  }
  assert.equal(safeMarkdownHref("/en/contact?x=1#top"), "/en/contact?x=1#top");
});

test("knowledge validation rejects Markdown links that are not absolute paths or HTTPS", () => {
  assert.equal(
    validatePublicKnowledgeVersion("Title", "See [contact](contact)."),
    "Links must use a safe HTTPS or local destination.",
  );
  assert.equal(
    validatePublicKnowledgeVersion("Title", "See [local](/en/contact)."),
    null,
  );
  assert.equal(
    validatePublicKnowledgeVersion(
      "Title",
      "See [official](https://umt.edu.my/).",
    ),
    null,
  );
});
