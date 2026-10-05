import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {
  captureRequest, validateRequest, validateIntakeReport, requestBinding,
  associateEvidence, buildIntakeReport, renderIntakeReport, documentDigest,
} from '../skills/qa-check/scripts/request-contract.mjs';

const owner = {
  product: 'sample', specialist: 'qa-product-v0',
  checkpointPath: '/private/sample/CURRENT.md', notesDirectory: '/private/sample',
  workspacePath: '/private/workspaces/sample',
};
const hashText = text => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;
function input(id = '00000000-0000-4000-8000-000000000001') {
  return {
    requestId: id, capturedAt: '2026-10-05T00:00:00.000Z', owner,
    scope: 'full', text: 'Check the whole product. No docs are available.\n',
    sourceItems: [], exclusions: ['No purchases'],
  };
}
function reference(record) {
  return {
    request: requestBinding(record), owner: structuredClone(owner),
    runId: 'owner-run-a', artifactPath: '/private/sample/evidence/receipt.json',
    artifactDigest: `sha256:${'a'.repeat(64)}`, kind: 'owner_receipt',
    observedIdentity: null,
  };
}
function redigest(value) {
  value.digest = documentDigest(Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'digest')));
  return value;
}

test('canonical code-unit ordering has an independent fixed digest vector', () => {
  assert.equal(documentDigest({'2': 'two', a: 'A', '10': 'ten'}),
    'sha256:da02c0e348f56f105931b549df300c43e518593fb3235ec7fa6d7a3e06949373');
  assert.notEqual(documentDigest(['a', 'b']), documentDigest(['b', 'a']));
  assert.notEqual(documentDigest('é'), documentDigest('e\u0301'));
});

test('brief-only capture retains exact wording, unknown oracle and no evaluated result', () => {
  const first = captureRequest(input());
  const reopened = validateRequest(JSON.parse(JSON.stringify(first)));
  assert.equal(reopened.originalText, input().text);
  assert.equal(reopened.originalScope, 'full');
  assert.equal(reopened.items.length, 1);
  assert.equal(reopened.items[0].contentDigest, hashText(input().text));
  assert.equal(reopened.clauses[0].text, input().text);
  assert.equal(reopened.clauses[0].status, 'unassessed');
  assert.deepEqual(reopened.unknowns.map(x => x.kind), ['scope', 'oracle']);
  const report = buildIntakeReport(reopened, {clauseIds: [], rationale: 'Discover scope first'}, []);
  assert.equal(report.result, 'NOT_EVALUATED');
  assert.equal(report.executionBinding, 'not_owner_attested');
  assert.deepEqual(report.remainingClauseIds, ['clause-1']);
  assert.deepEqual(validateIntakeReport(JSON.parse(JSON.stringify(report))), report);
});

test('saved old association is historical for another request and amended revision', () => {
  const first = captureRequest(input());
  const savedReference = JSON.parse(JSON.stringify(reference(first)));
  const oldReport = buildIntakeReport(first, {clauseIds: ['clause-1'], rationale: 'Discovery'}, [savedReference]);
  assert.equal(oldReport.evidence[0].association.state, 'matching_request_unattested');
  assert.equal(oldReport.result, 'NOT_EVALUATED');
  const second = captureRequest(input('00000000-0000-4000-8000-000000000002'));
  const amended = captureRequest({...input(), text: 'Include mobile layout.', capturedAt: '2026-10-05T00:01:00.000Z'}, first);
  for (const current of [second, amended]) {
    const report = buildIntakeReport(current, {clauseIds: ['clause-1'], rationale: 'Bounded pilot'}, [savedReference]);
    assert.equal(report.evidence[0].association.state, 'historical_or_other_request');
    assert.equal(report.result, 'NOT_EVALUATED');
  }
  assert.equal(amended.originalText, first.originalText);
  assert.equal(amended.originalScope, 'full');
  assert.equal(amended.previousDigest, first.digest);
  assert.equal(amended.revision, 2);
  assert.deepEqual(amended.clauses.map(x => x.text), [first.originalText, 'Include mobile layout.']);
});

test('full scope survives one-clause pilot and all-known-clause selection', () => {
  const first = captureRequest(input());
  const next = captureRequest({...input(), text: 'Also review reports and exports.'}, first);
  const pilot = buildIntakeReport(next, {clauseIds: ['clause-1'], rationale: 'Only first family selected'}, []);
  assert.equal(pilot.originalScope, 'full');
  assert.deepEqual(pilot.remainingClauseIds, ['clause-2']);
  assert.equal(pilot.clauses.length, 2);
  const all = buildIntakeReport(next, {clauseIds: ['clause-1', 'clause-2'], rationale: 'All known input clauses'}, []);
  assert.equal(all.fullScopeReconciliation, 'not_performed');
  assert.equal(all.result, 'NOT_EVALUATED');
  assert.ok(all.clauses.every(x => x.status === 'unassessed'));
});

test('partial, empty and unavailable sources remain visible without invented clauses', () => {
  const sources = [
    {id:'item-2', kind:'text_file', locator:'/private/sample/partial.txt', content:'Known\n', contentDigest:hashText('Known\n'), availability:'partial', limitation:'not_readable'},
    {id:'item-3', kind:'text_file', locator:'/private/sample/empty.txt', content:'', contentDigest:hashText(''), availability:'empty', limitation:null},
    {id:'item-4', kind:'text_file', locator:'/private/sample/missing.txt', content:null, contentDigest:null, availability:'unavailable', limitation:'not_found'},
  ];
  const record = captureRequest({...input(), sourceItems:sources});
  assert.deepEqual(record.clauses.map(x => x.sourceItemId), ['item-1', 'item-2']);
  assert.deepEqual(record.unknowns.filter(x => x.kind === 'source').map(x => x.sourceItemIds), [['item-2'], ['item-3'], ['item-4']]);
  assert.equal(record.items[1].content, 'Known\n');
  assert.deepEqual(validateRequest(JSON.parse(JSON.stringify(record))), record);
  assert.throws(() => validateRequest(redigest({...record, clauses:record.clauses.slice(0,1)})));
  assert.throws(() => validateRequest(redigest({...record, items:record.items.slice(0,3)})));
});

test('strict request validation rejects forged shape, source, classification and digest', () => {
  const first = captureRequest(input());
  assert.throws(() => validateRequest({...first, originalText:'Narrowed secretly'}));
  assert.throws(() => validateRequest(redigest({...first, current:true})));
  assert.throws(() => validateRequest(redigest({...first, clauses:[]})));
  assert.throws(() => validateRequest(redigest({...first, clauses:[first.clauses[0], first.clauses[0]]})));
  assert.throws(() => validateRequest(redigest({...first, revision:0})));
  assert.throws(() => validateRequest(redigest({...first, items:[{...first.items[0], contentDigest:hashText('wrong')}]})));
  assert.throws(() => validateRequest(redigest({...first, unknowns:[{...first.unknowns[0], kind:'source'}, first.unknowns[1]]})));
  assert.throws(() => captureRequest({...input(), text:' \n '}));
  assert.throws(() => captureRequest({...input(), sourceItems:[{id:'item-2',kind:'text_file',locator:'/a',content:'x',contentDigest:hashText('x'),availability:'complete',limitation:null, current:true}]}));
  assert.equal(captureRequest({...input(), text:'Please check this.'}).originalText, 'Please check this.');
});

test('JSON digest rejects unsupported values, sparse arrays, unpaired surrogates and limits', () => {
  for (const value of [undefined, NaN, Infinity, {x:undefined}, new Date(), [,1], '\uD800', {'\uDC00':'x'}, 1n]) {
    assert.throws(() => documentDigest(value));
  }
  assert.throws(() => captureRequest({...input(), text:'x'.repeat(65537)}));
  assert.throws(() => captureRequest({...input(), capturedAt:'2026-02-30T00:00:00.000Z'}));
  assert.throws(() => captureRequest({...input(), requestId:'NOT-UUID'}));
});

test('report rejects unknown or duplicate selection, forged partition and classification', () => {
  const first = captureRequest(input());
  assert.throws(() => buildIntakeReport(first, {clauseIds:['clause-9'], rationale:'pilot'}, []));
  assert.throws(() => buildIntakeReport(first, {clauseIds:['clause-1','clause-1'], rationale:'pilot'}, []));
  assert.throws(() => buildIntakeReport(first, {clauseIds:[], rationale:' '}, []));
  const report = buildIntakeReport(first, {clauseIds:['clause-1'], rationale:'pilot'}, [reference(first)]);
  assert.throws(() => validateIntakeReport(redigest({...report, remainingClauseIds:['clause-1']})));
  assert.throws(() => validateIntakeReport(redigest({...report, result:'PASS'})));
  assert.throws(() => validateIntakeReport(redigest({...report, current:true})));
  assert.throws(() => validateIntakeReport(redigest({...report, evidence:[{...report.evidence[0], association:{state:'owner_mismatch',reasons:['Selected owner differs']}}]})));
  assert.throws(() => validateIntakeReport(redigest({...report, sourceItems:[]})));
  assert.throws(() => validateIntakeReport(redigest({...report, clauses:[{...first.clauses[0], status:'verified'}]})));
  assert.throws(() => associateEvidence(first, {...reference(first), verified:true}));
  assert.equal(associateEvidence(first, {...reference(first), owner:{...owner, product:'different'}}).state, 'owner_mismatch');
});

test('renderer fences supplied markdown and HTML as literal text with all limits visible', () => {
  const raw = '<script>alert(1)</script>\n```danger```\n';
  const record = captureRequest({...input(), text:raw});
  const report = buildIntakeReport(record, {clauseIds:['clause-1'], rationale:'Inspect `one`'}, [reference(record)]);
  const md = renderIntakeReport(report);
  assert.match(md, /NOT_EVALUATED/);
  assert.match(md, /not_owner_attested/);
  assert.match(md, /unassessed/);
  assert.ok(md.includes('owner\\-run\\-a'));
  assert.match(md, /````\n&lt;script&gt;alert\(1\)&lt;\/script&gt;\n```danger```/);
  assert.doesNotMatch(md, /<script>/);
});

test('amendment appends file sources after its new request item without collisions', () => {
  const first = captureRequest(input());
  const source = {id:'item-3', kind:'text_file', locator:'/private/sample/new.txt', content:'File scope', contentDigest:hashText('File scope'), availability:'complete', limitation:null};
  const next = captureRequest({...input(), text:'Also inspect exports.', sourceItems:[source]}, first);
  assert.deepEqual(next.items.map(x => x.id), ['item-1', 'item-2', 'item-3']);
  assert.deepEqual(next.clauses.map(x => x.text), [input().text, 'Also inspect exports.', 'File scope']);
  assert.deepEqual(next.items[0], first.items[0]);
  assert.deepEqual(next.clauses[0], first.clauses[0]);
  assert.deepEqual(next.unknowns, first.unknowns);
});

test('nonempty whitespace-only files retain exact whole-content clauses', () => {
  const text = ' \n\t';
  const source = {id:'item-2', kind:'text_file', locator:'/private/sample/space.txt', content:text, contentDigest:hashText(text), availability:'complete', limitation:null};
  const record = captureRequest({...input(), sourceItems:[source]});
  assert.equal(record.clauses[1].text, text);
  assert.equal(record.items[1].content, text);
  assert.deepEqual(validateRequest(JSON.parse(JSON.stringify(record))), record);
});

test('renderer keeps Markdown-bearing metadata literal outside content fences', () => {
  const metadata = '[click](https://example.test)\n# injected';
  const record = captureRequest({...input(), owner:{...owner, product:metadata}, exclusions:[metadata]});
  const evidence = {...reference(record), owner:record.owner, runId:metadata};
  const report = buildIntakeReport(record, {clauseIds:[], rationale:'Discovery'}, [evidence]);
  const md = renderIntakeReport(report);
  assert.doesNotMatch(md, /\[click\]\(https:\/\/example\.test\)/);
  assert.doesNotMatch(md, /\n# injected/);
  assert.ok(md.includes('\\[click\\]\\(https://example\\.test\\)'));
});

test('renderer safely fences a bounded source with many short backtick runs', () => {
  const text = '`x'.repeat(131000);
  const source = {id:'item-2', kind:'text_file', locator:'/private/sample/ticks.txt', content:text, contentDigest:hashText(text), availability:'complete', limitation:null};
  const record = captureRequest({...input(), sourceItems:[source]});
  const md = renderIntakeReport(buildIntakeReport(record, {clauseIds:[], rationale:'Discovery'}, []));
  assert.ok(md.includes(`\n\`\`\`\n${text}\n\`\`\`\n`));
});

test('32 tiny file sources retain every clause through a first text amendment and report reopen', () => {
  const sources = Array.from({length:32}, (_, i) => ({
    id:`item-${i + 2}`, kind:'text_file', locator:`/private/sample/tiny-${i + 1}.txt`,
    content:'x', contentDigest:hashText('x'), availability:'complete', limitation:null,
  }));
  const first = captureRequest({...input(), text:'Check the whole product.', sourceItems:sources});
  const firstBytes = JSON.stringify(first);
  const revised = captureRequest({...input(), text:'Also check mobile.'}, first);
  const reopened = validateRequest(JSON.parse(JSON.stringify(revised)));
  assert.equal(JSON.stringify(first), firstBytes);
  assert.equal(reopened.revision, 2);
  assert.equal(reopened.previousDigest, first.digest);
  assert.equal(reopened.originalText, 'Check the whole product.');
  assert.equal(reopened.originalScope, 'full');
  assert.equal(reopened.items.length, 34);
  assert.equal(reopened.items.filter(x => x.kind === 'text_file').length, 32);
  assert.deepEqual(reopened.items.slice(0, 33), first.items);
  assert.deepEqual(reopened.clauses.slice(0, 33), first.clauses);
  assert.deepEqual(reopened.clauses[33], {
    id:'clause-34', sourceItemId:'item-34', text:'Also check mobile.', status:'unassessed',
  });
  assert.equal(reopened.items.reduce((bytes, x) => bytes + Buffer.byteLength(x.content, 'utf8'), 0), 74);
  const report = buildIntakeReport(reopened, {clauseIds:['clause-34'], rationale:'Bounded mobile discovery'}, []);
  const savedReport = validateIntakeReport(JSON.parse(JSON.stringify(report)));
  assert.equal(savedReport.sourceItems.length, 34);
  assert.equal(savedReport.clauses.length, 34);
  assert.deepEqual(savedReport.sourceItems.slice(0, 33), first.items);
  assert.deepEqual(savedReport.clauses.slice(0, 33), first.clauses);
  assert.deepEqual(savedReport.clauses[33], {
    id:'clause-34', sourceItemId:'item-34', text:'Also check mobile.', status:'unassessed',
  });
  assert.deepEqual(savedReport.selectedClauseIds, ['clause-34']);
  assert.equal(savedReport.remainingClauseIds.length, 33);
  assert.equal(savedReport.originalScope, 'full');
  assert.equal(savedReport.result, 'NOT_EVALUATED');
  assert.equal(savedReport.executionBinding, 'not_owner_attested');
  assert.equal(savedReport.fullScopeReconciliation, 'not_performed');
  assert.ok(savedReport.clauses.every(x => x.status === 'unassessed'));
});

test('no-file amendment history crosses 33 total request items under the byte bounds', () => {
  let record = captureRequest({...input(), text:'Check.'});
  for (let i = 0; i < 33; i++) record = captureRequest({...input(), text:'Also.'}, record);
  const reopened = validateRequest(JSON.parse(JSON.stringify(record)));
  assert.equal(reopened.revision, 34);
  assert.equal(reopened.items.length, 34);
  assert.equal(reopened.clauses.length, 34);
  assert.equal(reopened.items.filter(x => x.kind === 'text_file').length, 0);
  assert.equal(reopened.originalText, 'Check.');
  assert.equal(reopened.originalScope, 'full');
  assert.equal(reopened.items[33].id, 'item-34');
  assert.deepEqual(reopened.clauses[33], {id:'clause-34', sourceItemId:'item-34', text:'Also.', status:'unassessed'});
  assert.ok(reopened.items.slice(1).every(x => x.content === 'Also.'));
  assert.equal(reopened.items.reduce((bytes, x) => bytes + Buffer.byteLength(x.content, 'utf8'), 0), 171);
  assert.ok(Buffer.byteLength(JSON.stringify(reopened), 'utf8') < 1048576);
});

test('33 file sources remain rejected at initial capture and cumulative amendment', () => {
  const sources = Array.from({length:33}, (_, i) => ({
    id:`item-${i + 2}`, kind:'text_file', locator:`/private/sample/tiny-${i + 1}.txt`,
    content:'x', contentDigest:hashText('x'), availability:'complete', limitation:null,
  }));
  assert.throws(() => captureRequest({...input(), sourceItems:sources}), /Source count limit/);
  const first = captureRequest({...input(), sourceItems:sources.slice(0, 32)});
  const firstBytes = JSON.stringify(first);
  assert.throws(() => captureRequest({...input(), text:'Also check mobile.', sourceItems:[{
    ...sources[32], id:'item-35',
  }]}, first), /Source count limit/);
  assert.equal(JSON.stringify(first), firstBytes);
});
