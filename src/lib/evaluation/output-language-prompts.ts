// These strings are concatenated into user messages sent to Anthropic.
// Editing them changes model behaviour and owes a prompt_version
// decision. Display copy that never reaches the model lives in
// output-language.ts.

export const SPANISH_EVALUATION_OUTPUT_INSTRUCTIONS = `## OUTPUT LANGUAGE (SPANISH)

Write the entire evaluation in Spanish, a pastoral, literate Latin American register. All coaching prose must be Spanish: criterion narratives (including the per-criterion close), verdict.affirmation, verdict.improvement, whats_working headlines and explanations, top_priorities headlines/rationales/practical_steps, rewrite analysis/original/rewrite/moment_label, heat_map beat_label and notes, melodic_line_and_big_idea.book / .passage / .melodic_line, tradition_tag may stay as the English source names.

Keep JSON keys and schema-locked enum values in English:
- criterion \`name\` must remain the canonical English enum from the rubric (the app maps display names)
- \`scoring.band\` must remain the English band enum (Exemplary, Strong, Faithful, Needs Improvement, Significant Concerns)
- category \`id\`, heat_map \`register\`, \`text_supports\`, and \`melodic_line_and_big_idea.reading_source\` stay English enums
- You MAY write category \`name\` as a Spanish display label
- \`melodic_line_and_big_idea.melodic_line\` must begin by naming the book in the first clause, same rule as English ("Hebreos insiste en...", "Filipenses sostiene..."). Exception: withheld or topical copy that explains there is no single book's line.

PER-CRITERION CLOSE. Write the required close sentence in Spanish, same job as the English format:
- Scores 1 to 4: "Para llegar a un [next score], [cambio concreto anclado a este sermón]."
- Score 5: "Para mantener esto, [práctica concreta anclada a este sermón]."
Word limits on verdict.affirmation and verdict.improvement still apply (count Spanish words the same way).

No em-dashes (U+2014) or en-dashes (U+2013) in generated Spanish prose. Recast with a comma, a period, or a semicolon. Quoted sermon text is the only exception.

## SCRIPTURE (REINA-VALERA 1960)

When you cite the preacher's biblical text, quote Reina-Valera 1960 (RVR1960) or name the passage without quoting it. Never free-translate a verse into Spanish yourself. Quotes of the preacher's own sermon language stay in the manuscript's language.`;

export const SPANISH_HIP_OUTPUT_INSTRUCTIONS = `## OUTPUT LANGUAGE (SPANISH)

Write every movement \`body\` in Spanish, pastoral, literate Latin American register. Keep each movement \`name\` as the English enum required by the schema (The Open, The Big Idea, The Structural Logic, The Illustrations, The Landing). Quotes of the preacher's sermon language stay in the manuscript's language, still wrapped in \`<span class="q">...</span>\`.

When you cite the preacher's biblical text, quote Reina-Valera 1960 (RVR1960) or name the passage without quoting it. Never free-translate a verse.`;

export const SPANISH_VERDICT_LINE_OUTPUT_INSTRUCTIONS = `Write every verdict_line in Spanish. Keep the twelve-to-eighteen-word band. Canonical criterion names in this prompt stay English; the sentences you write are Spanish. Quotes of the preacher stay in the manuscript's language. When citing Scripture, quote Reina-Valera 1960 or name the passage without quoting it. Never free-translate a verse.`;
