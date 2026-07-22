import type { AssuranceDecision } from '@l9/assurance-contracts';
export function renderDecisionSummary(decision:AssuranceDecision):string{
  const mandatory=decision.controlResults.filter((result)=>result.severity==='mandatory');
  const lines=[
    '# L9 Assurance Decision','',
    `**Verdict:** ${decision.verdict.toUpperCase()}`,
    `**Subject:** ${escapeMarkdown(`${decision.subject.repository.owner}/${decision.subject.repository.name}@${decision.subject.revision.commit}`)}`,
    `**Profile:** ${escapeMarkdown(`${decision.profile.id}@${decision.profile.version}`)}`,
    `**Policy:** ${escapeMarkdown(`${decision.policy.id}@${decision.policy.version}`)}`,
    `**Decision:** ${escapeMarkdown(decision.decisionId)}`,'','## Mandatory controls'
  ];
  for(const result of mandatory)lines.push(`- ${result.status.toUpperCase()} - ${escapeMarkdown(result.controlId)}${result.reasons[0]?`; ${escapeMarkdown(result.reasons[0].message)}`:''}`);
  lines.push('','## Evidence',`Accepted: ${decision.evidenceManifest.length}`,'', '## Unknowns');
  if(decision.unknowns.length===0)lines.push('- None'); else for(const unknown of decision.unknowns)lines.push(`- ${escapeMarkdown(unknown.description)}`);
  lines.push('','## Waivers'); if(decision.waivers.length===0)lines.push('- None'); else for(const waiver of decision.waivers)lines.push(`- ${escapeMarkdown(waiver.waiverId)} for ${escapeMarkdown(waiver.controlId)}`);
  return `${lines.join('\n')}\n`;
}
export function escapeMarkdown(value:string):string{return value.replaceAll('\\','\\\\').replaceAll('`','\\`').replaceAll('*','\\*').replaceAll('_','\\_').replaceAll('[','\\[').replaceAll(']','\\]').replaceAll('<','&lt;').replaceAll('>','&gt;');}
