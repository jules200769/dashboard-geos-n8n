import fs from "fs";

const detailsPath = process.argv[2];
const patchedPath = process.argv[3];
const outPath = process.argv[4] || "generated/live-geos-cloud-for-sdk.json";

const details = JSON.parse(fs.readFileSync(detailsPath, "utf8"));
const patched = JSON.parse(fs.readFileSync(patchedPath, "utf8"));

const nodes = details.workflow?.activeVersion?.nodes ?? details.workflow?.nodes ?? [];
const byName = new Map(patched.nodes.map((n) => [n.name, n]));

for (const node of nodes) {
  const patch = byName.get(node.name);
  if (!patch) continue;
  if (patch.parameters?.jsCode) node.parameters.jsCode = patch.parameters.jsCode;
  if (patch.parameters?.attributes) node.parameters.attributes = patch.parameters.attributes;
}

const workflow = {
  id: details.workflow.id,
  name: details.workflow.name,
  settings: details.workflow.settings,
  connections:
    details.workflow?.activeVersion?.connections ?? details.workflow.connections,
  nodes,
};

fs.mkdirSync(outPath.replace(/[/\\][^/\\]+$/, ""), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2));
console.log("wrote", outPath, "nodes", nodes.length);
