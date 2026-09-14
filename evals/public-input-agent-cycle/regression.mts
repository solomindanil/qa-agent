import type { NuanuAuthoredFixture } from "../../components/console/tests/fixtures/nuanu-readonly/fixture.ts";
import { rehashCompilation } from "../../components/console/tests/fixtures/nuanu-readonly/fixture.ts";
import { QaCampaignCheckV0Schema, QaCampaignPlanV0Schema } from "../../components/console/src/lib/qa-campaign-v0.ts";

// Owned, known-answer regression recipe, not a generic test designer or runner.
// Inventory and semantics come from this exercise's brief + retained observations.
// Same substantive checks on both routes; only the explicit implementation target differs.
export function buildCatalogRegression(fixture: NuanuAuthoredFixture, route: "/fixed" | "/catalog") {
  if (route !== "/fixed" && route !== "/catalog") throw new Error("Unknown owned regression route");
  const { kernel, authority, baseUrl } = fixture;
  const next = structuredClone(authority.compilation);
  const targets = next.graph.nodes.filter((n: any) => n.coverageTarget);
  const named = (name: string) => {
    const found = targets.filter((n: any)=>n.name===name);
    if(found.length!==1) throw new Error("Expected one declared catalog target: " + name);
    return found[0];
  };
  const surface = named("Public item catalog"), search = named("Find matching public items");
  const summary = named("Read the result summary"), staff = named("Manage inventory as staff");
  const replacedTargets = new Set([surface.id,search.id]);
  const fill = (value: string) => ({kind:"fill",locator:{kind:"label",label:"Search"},value:{kind:"literal",value}});
  const select = (value: string) => ({kind:"select",locator:{kind:"label",label:"Category"},value:{kind:"literal",value}});
  const definitions = [
    {key:"baseline",title:"Baseline items",target:surface,ops:[],query:"",category:"all",names:["Apple","Pear","Hammer"]},
    {key:"substring",title:"Interior substring",target:search,ops:[fill("pP")],query:"pP",category:"all",names:["Apple"]},
    {key:"punctuation",title:"Literal punctuation",target:search,ops:[fill(".")],query:".",category:"all",names:[]},
    {key:"tools",title:"Tools category",target:search,ops:[select("tools")],query:"",category:"tools",names:["Hammer"]},
    {key:"narrow-fruit",title:"Narrowed Fruit prefix",target:search,ops:[select("fruit"),fill("pP")],query:"pP",category:"fruit",names:["Apple"]},
    {key:"empty-tools",title:"Empty Tools intersection",target:search,ops:[fill("pP"),select("tools")],query:"pP",category:"tools",names:[]},
    {key:"clear-fruit",title:"Clear Fruit final state",target:search,ops:[select("fruit"),fill("pP"),fill("")],query:"",category:"fruit",names:["Apple","Pear"]},
    {key:"clear-all",title:"Clear All final state",target:search,ops:[fill("."),fill("")],query:"",category:"all",names:["Apple","Pear","Hammer"]},
  ];
  const checks = definitions.map(d=>QaCampaignCheckV0Schema.parse({
    checkId:kernel.stableId("automated-check",{recipe:"catalog-regression-v2",key:d.key}),
    title:d.title,targetIds:[d.target.id],disposition:"executable",sideEffectClass:"read_only",kind:"browser",surface:"web",
    viewport:{width:1280,height:720},preconditions:["Owned three-item fixture: Apple/Pear are Fruit, Hammer is Tools; public controls only."],
    reproductionSteps:["Open explicitly selected owned route",...d.ops.map(o=>JSON.stringify(o)),"Observe final item set and control values"],
    expectedBehavior:`Exercise brief: literal case-insensitive name substring composes with category. Given observed inventory, query ${JSON.stringify(d.query)}, category ${d.category}: exactly ${d.names.length} items (${d.names.join(", ")||"none"}), without an ordering constraint. This checks final item state only; summary meaning and same-session clear transitions are assessed separately by the agent.`,
    severity:"medium",severityJustification:"Incorrect public discovery includes irrelevant items or hides matches.",
    operations:[{kind:"navigate",path:route},...d.ops],
    assertions:[{kind:"url",value:new URL(route,baseUrl).href},
      {kind:"value",locator:{kind:"label",label:"Search"},value:d.query},
      {kind:"value",locator:{kind:"label",label:"Category"},value:d.category},
      {kind:"count",locator:{kind:"testId",testId:"item"},value:d.names.length},
      ...d.names.map(name=>({kind:"count",locator:{kind:"css",selector:`[data-testid="item"]:text-is(${JSON.stringify(name)})`},value:1}))],
  }));
  const replaced = next.catalog.entries.filter((e: any)=>e.targetIds.some((id: string)=>replacedTargets.has(id)));
  const oldChecks = new Set(replaced.map((e: any)=>e.checkId)), oldEntries = new Set(replaced.map((e: any)=>e.entryId));
  next.catalog.entries = next.catalog.entries.filter((e: any)=>!oldEntries.has(e.entryId));
  next.graph.nodes = next.graph.nodes.filter((n: any)=>!oldChecks.has(n.id));
  next.graph.edges = next.graph.edges.filter((e: any)=>!oldChecks.has(e.from));
  for(const key of ["proposedAutomatedChecks","manualHandoffs","unresolvedOracles"])
    next.strategy[key] = next.strategy[key].filter((e: any)=>!oldEntries.has(e.catalogEntryId));
  for(const [index,c] of checks.entries()) {
    const target = definitions[index]!.target, entryId = kernel.stableId("catalog-entry",{checkId:c.checkId});
    next.graph.nodes.push({...target,id:c.checkId,kind:"automated_check",coverageTarget:false,name:c.title});
    next.graph.edges.push({id:kernel.stableId("edge",{checkId:c.checkId,targetId:target.id}),kind:"verifies",from:c.checkId,to:target.id,
      reviewStatus:"reviewed",assuranceLevel:"declared",provenance:target.provenance,semanticDigest:kernel.digestCanonical("pending")});
    next.catalog.entries.push({entryId,checkId:c.checkId,targetIds:c.targetIds,executionKind:"automated",runnerId:"playwright",
      candidatePath:"tests/web/generated/registration.candidates.spec.ts",requiredSecretRefs:[],sideEffectClasses:["read_only"],
      expectedEvidenceTypes:["screenshot"],oracle:{state:"resolved",description:c.expectedBehavior},provenance:target.provenance});
    next.strategy.proposedAutomatedChecks.push({proposalId:kernel.stableId("proposal",{entryId}),catalogEntryId:entryId,checkId:c.checkId,
      targetIds:c.targetIds,reason:"Reviewed fixture brief and item observations; only declared final-state scope is automated."});
  }
  for(const item of next.coverage.items) if(replacedTargets.has(item.targetId)) {
    item.status="automated"; item.verificationMode="automated";
    item.checkIds=checks.filter(c=>c.targetIds.includes(item.targetId)).map(c=>c.checkId);
    item.reason="Planned item-state checks have sourced expectations; automation assignment is not execution acceptance. Summary and same-session transitions remain separate.";
  }
  next.coverage.unresolved=next.coverage.unresolved.filter((u: any)=>!replacedTargets.has(u.targetId));
  const reasons = new Map([
    [summary.id,"Summary meaning requires agent observation: this adapter has no semantic text assertion; exact wording is not a requirement."],
    [staff.id,"No staff account, authenticated surface or inventory mutation authority is provided."],
  ]);
  for(const item of next.coverage.items) if(reasons.has(item.targetId)) item.reason=reasons.get(item.targetId);
  // Existing strategy blockers are protected discovery history, not mutable
  // current evidence. Keep them; do not hide unrelated graph unresolved entries.
  const compilation=rehashCompilation(kernel,next);
  const revision=kernel.buildRegistrationKnowledgeRevision(authority,compilation);
  const blockers=targets.filter((t: any)=>!replacedTargets.has(t.id)).map((t: any)=>({
    targetId:t.id,catalogCheckIds:compilation.catalog.entries.filter((e: any)=>e.targetIds.includes(t.id)).map((e: any)=>e.checkId),
    disposition:"blocked",reason:reasons.get(t.id)??"No authored check for this retained target.",
    recovery:t.id===summary.id?"Use supported agent-led same-tab observation and report it separately; do not promote the sealed receipt.":"Owner-provided access and scoped authority are required.",
  }));
  const plan=QaCampaignPlanV0Schema.parse({schemaVersion:"qa-campaign.v0",productSlug:"public-household-catalog",graphDigest:compilation.graph.semanticDigest,
    baseUrl,checks,blockers});
  return {revision,plan};
}
