import fs from "fs";

const mergedPath = "generated/live-geos-cloud-for-sdk.json";
const templatePath = "generated/workflow-code-for-mcp.json";
const outPath = "generated/live-geos-update-sdk.mjs";

const merged = JSON.parse(fs.readFileSync(mergedPath, "utf8"));
const templateCode = JSON.parse(fs.readFileSync(templatePath, "utf8"));

const RENAME = [
  ["Dashboard Save Webhook", "Dashboard Save Webhook1"],
  ["Prepare Saved Lead Payload", "Prepare Saved Lead Payload1"],
  ["Extract Email Intelligence1", "Extract Email Intelligence"],
  ["Prepare Analytics Row1", "Prepare Analytics Row"],
  ["Prepare CRM Data1", "Prepare CRM Data"],
  ["Prepare Dashboard Not-Found Payload", "Prepare Dashboard Not-Found Payload1"],
  ["Exists in Salesforce?1", "Exists in Salesforce?"],
  ["Get Full Email1", "Get Full Email"],
  ["Analyze Email Sentiment1", "Analyze Email Sentiment"],
  ["Route by Sentiment1", "Route by Sentiment"],
  ["Monitor Gmail Inbox1", "Monitor Gmail Inbox"],
  ["If1", "If"],
  ["parse input1", "parse input"],
  ["Merge SF Search Results1", "Merge SF Search Results"],
  ["SF Get Contact By Name1", "SF Get Contact By Name"],
  ["SF Get Lead By Email", "SF Get Lead By Email2"],
];

let code = templateCode;
for (const [from, to] of RENAME) {
  code = code.replaceAll(`name: '${from}'`, `name: '${to}'`);
  code = code.replaceAll(`$('${from}')`, `$('${to}')`);
  code = code.replaceAll(`\\'${from}\\'`, `\\'${to}\\'`);
}

function escapeForSdkJs(s) {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

for (const node of merged.nodes) {
  if (!node.parameters?.jsCode) continue;
  const name = node.name.replace(/'/g, "\\'");
  const escaped = escapeForSdkJs(node.parameters.jsCode);
  const re = new RegExp(
    `(name: '${name}', parameters: \\{ jsCode: ')([\\s\\S]*?)(' \\}, position)`,
    "m",
  );
  if (!re.test(code)) {
    console.warn("jsCode replace miss:", node.name);
    continue;
  }
  code = code.replace(re, `$1${escaped}$3`);
  console.log("updated jsCode:", node.name);
}

const genderAttr =
  ", { name: 'contact_gender', description: \"The sender's gender. Must be exactly 'man' or 'vrouw' when clearly indicated by first name, salutation (Mr./Ms./M./Mme), or gendered wording in the signature. Return empty string if unknown or ambiguous.\" }";
if (code.includes("name: 'Extract Email Intelligence'") && !code.includes("name: 'contact_gender'")) {
  const titleAttr =
    "{ name: 'contact_title', description: 'The sender's job title, taken ONLY from an explicit signature line";
  if (code.includes(titleAttr)) {
    const end =
      "Return an empty string if no explicit title is present in the signature.' }, { name: 'industry'";
    code = code.replace(end, `Return an empty string if no explicit title is present in the signature.' }${genderAttr}, { name: 'industry'`);
    console.log("updated attributes: Extract Email Intelligence");
  }
}

const header =
  "import { workflow, node, trigger, merge, splitInBatches, nextBatch, languageModel, ifElse, switchCase, expr } from '@n8n/workflow-sdk';\n\n";
if (!code.includes("import { workflow")) {
  code = header + code;
}

fs.writeFileSync(outPath, code);
console.log("wrote", outPath, "bytes", code.length);
