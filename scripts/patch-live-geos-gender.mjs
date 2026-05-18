import fs from "fs";
import path from "path";

const WORKFLOW_DETAILS = process.argv[2];
if (!WORKFLOW_DETAILS) {
  console.error("Usage: node patch-live-geos-gender.mjs <workflow-details.json>");
  process.exit(1);
}

const raw = fs.readFileSync(WORKFLOW_DETAILS, "utf8");
const data = JSON.parse(raw);
const nodes = data.workflow?.activeVersion?.nodes ?? data.workflow?.nodes ?? [];

const GENDER_ATTR = {
  name: "contact_gender",
  description:
    "The sender's gender. Must be exactly 'man' or 'vrouw' when clearly indicated by first name, salutation (Mr./Ms./M./Mme), or gendered wording in the signature. Return empty string if unknown or ambiguous.",
};

function normalizeGender(raw) {
  const g = String(raw ?? "")
    .trim()
    .toLowerCase();
  return g === "man" || g === "vrouw" ? g : "";
}

function salutationFromGender(gender) {
  if (gender === "man") return "Mr.";
  if (gender === "vrouw") return "Ms.";
  return "";
}

function patchExtractEmailIntelligence(node) {
  const attrs = node.parameters?.attributes?.attributes;
  if (!Array.isArray(attrs)) return false;
  if (attrs.some((a) => a.name === "contact_gender")) return false;
  const titleIdx = attrs.findIndex((a) => a.name === "contact_title");
  const insertAt = titleIdx >= 0 ? titleIdx + 1 : attrs.length;
  attrs.splice(insertAt, 0, GENDER_ATTR);
  return true;
}

function patchPrepareAnalyticsRow(node) {
  let code = node.parameters?.jsCode ?? "";
  if (code.includes("contact_gender")) return false;
  const needle =
    "contact_title: String(item.contact_title || item.output?.contact_title || ''),";
  const insert = `${needle}\n    contact_gender: String(item.contact_gender || item.output?.contact_gender || ''),`;
  if (!code.includes(needle)) return false;
  node.parameters.jsCode = code.replace(needle, insert);
  return true;
}

function patchPrepareCrmData(node) {
  let code = node.parameters?.jsCode ?? "";
  if (code.includes("contact_gender")) return false;
  const needle = "const createOpportunity = ";
  if (!code.includes(needle)) return false;
  const block = `const rawGender = String(item.contact_gender || '').trim().toLowerCase();
const contactGender = rawGender === 'man' || rawGender === 'vrouw' ? rawGender : '';
const salutation = contactGender === 'man' ? 'Mr.' : (contactGender === 'vrouw' ? 'Ms.' : '');

`;
  code = code.replace(needle, block + needle);
  const returnNeedle =
    "contact_title: String(item.contact_title || ''),\n    industry:";
  const returnInsert = `contact_title: String(item.contact_title || ''),
    contact_gender: contactGender,
    salutation: salutation,
    industry:`;
  if (!code.includes(returnNeedle)) return false;
  node.parameters.jsCode = code.replace(returnNeedle, returnInsert);
  return true;
}

function patchPrepareDashboardPayload(node) {
  let code = node.parameters?.jsCode ?? "";
  if (code.includes("contact_gender:")) return false;
  const needle = "contact_title: String(item.contact_title ?? item.title ?? '').trim(),";
  const insert = `${needle}
      contact_gender: (() => {
        const g = String(item.contact_gender ?? item.contactGender ?? '').trim().toLowerCase();
        return g === 'man' || g === 'vrouw' ? g : '';
      })(),`;
  if (!code.includes(needle)) return false;
  node.parameters.jsCode = code.replace(needle, insert);
  return true;
}

function patchPrepareSavedLeadPayload(node) {
  const newCode = `const input = $input.first().json;
const body = input.body && typeof input.body === 'object' ? input.body : input;
const contact = body.contact && typeof body.contact === 'object' ? body.contact : {};

const rawGender = String(contact.gender ?? body.contact_gender ?? input.contact_gender ?? '').trim().toLowerCase();
const contactGender = rawGender === 'man' || rawGender === 'vrouw' ? rawGender : '';
const salutation = contactGender === 'man' ? 'Mr.' : (contactGender === 'vrouw' ? 'Ms.' : '');

return [{
  json: {
    ...input,
    ...body,
    contact_gender: contactGender,
    salutation,
    contact: {
      ...contact,
      gender: contactGender,
    },
    save_source: 'dashboard',
    save_received_at: new Date().toISOString(),
  },
}];`;
  node.parameters.jsCode = newCode;
  return true;
}

const patches = {
  "Extract Email Intelligence": patchExtractEmailIntelligence,
  "Prepare Analytics Row": patchPrepareAnalyticsRow,
  "Prepare CRM Data": patchPrepareCrmData,
  "Prepare Dashboard Not-Found Payload1": patchPrepareDashboardPayload,
  "Prepare Saved Lead Payload1": patchPrepareSavedLeadPayload,
};

let changed = 0;
for (const node of nodes) {
  const fn = patches[node.name];
  if (fn && fn(node)) {
    console.log("patched:", node.name);
    changed++;
  }
}

const outPath = path.join(
  path.dirname(WORKFLOW_DETAILS),
  "live-geos-gender-patched-nodes.json",
);
fs.writeFileSync(outPath, JSON.stringify({ nodes, changed }, null, 2));
console.log("changed nodes:", changed);
console.log("wrote:", outPath);
