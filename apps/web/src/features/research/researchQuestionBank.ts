import type { BiblicalResearchFocus } from "../../lib/biblicalResearchProvider";

export interface ResearchQuestionSuggestion {
    readonly id: string;
    readonly question: string;
}

export const RESEARCH_QUESTION_SUGGESTIONS: Readonly<Record<BiblicalResearchFocus, readonly ResearchQuestionSuggestion[]>> = {
    general: [
        { id: "general-1", question: "What background information would help me understand this passage without replacing what the text itself says?" },
        { id: "general-2", question: "What important contextual facts should I investigate before drawing conclusions from this passage?" },
        { id: "general-3", question: "What historical, cultural, literary, or geographical context is most relevant to this passage?" },
        { id: "general-4", question: "What outside information could clarify the passage, and what should remain an open question?" },
    ],
    geography: [
        { id: "geography-1", question: "Where was this event taking place, and what geographical features are important to the passage?" },
        { id: "geography-2", question: "What was the route, terrain, distance, or travel situation described or implied in this passage?" },
        { id: "geography-3", question: "How did the location, climate, water sources, or regional boundaries affect the people or events in this passage?" },
        { id: "geography-4", question: "Are the places mentioned securely identified, or are any location identifications disputed?" },
    ],
    customs_culture: [
        { id: "customs-1", question: "What customs or social conventions would the original audience recognize in this passage?" },
        { id: "customs-2", question: "How did hospitality, honor and shame, family relationships, or social expectations shape this situation?" },
        { id: "customs-3", question: "What food, clothing, marriage, burial, festival, agricultural, or household practices are relevant here?" },
        { id: "customs-4", question: "Which cultural details are strongly supported for this period, and which are generalizations that should be treated cautiously?" },
    ],
    historical_period: [
        { id: "history-1", question: "What time period was this passage written or set in, and how certain is that dating?" },
        { id: "history-2", question: "Which rulers, empires, wars, migrations, or major events provide relevant historical background?" },
        { id: "history-3", question: "What was happening in the surrounding region during the period relevant to this passage?" },
        { id: "history-4", question: "What historical details are established, and which aspects of the chronology remain debated?" },
    ],
    social_political: [
        { id: "social-1", question: "Who held political authority in this setting, and how might that authority relate to the passage?" },
        { id: "social-2", question: "What social classes, institutions, citizenship rules, taxation, or patronage structures are relevant here?" },
        { id: "social-3", question: "How did ethnic, economic, legal, or power relationships affect the people in this passage?" },
        { id: "social-4", question: "What social or political assumptions would the original audience likely understand that modern readers may miss?" },
    ],
    religious_context: [
        { id: "religious-1", question: "What religious practices or beliefs were present in this setting when the passage was written or set?" },
        { id: "religious-2", question: "How did temple, synagogue, festival, purity, priestly, or sacrificial practices relate to this passage?" },
        { id: "religious-3", question: "What Jewish, Greco-Roman, or other religious background is relevant to the passage, and what is not?" },
        { id: "religious-4", question: "Which religious-context claims are historical descriptions, and which would require theological interpretation?" },
    ],
    literary_setting: [
        { id: "literary-1", question: "What genre is this passage, and how should that genre shape the way I investigate and read it?" },
        { id: "literary-2", question: "Who appears to be the intended audience, and what occasion or situation may have prompted this passage?" },
        { id: "literary-3", question: "How does this passage function within the surrounding argument or structure of the biblical book?" },
        { id: "literary-4", question: "What can be established about authorship, provenance, or rhetorical situation, and what remains debated?" },
    ],
    archaeology_material: [
        { id: "archaeology-1", question: "What archaeological sites, inscriptions, artifacts, or buildings are relevant to this passage?" },
        { id: "archaeology-2", question: "What material evidence helps reconstruct the physical setting or daily life behind this passage?" },
        { id: "archaeology-3", question: "What archaeological evidence is securely dated to the relevant period, and what is less certain?" },
        { id: "archaeology-4", question: "How far can the available archaeological evidence legitimately illuminate this passage without proving an interpretation?" },
    ],
    language_terminology: [
        { id: "language-1", question: "Which Hebrew, Aramaic, or Greek words in this passage deserve closer investigation?" },
        { id: "language-2", question: "What is the relevant semantic range of an important term, and which meanings fit this passage?" },
        { id: "language-3", question: "Are there idioms, translation choices, or textual-linguistic issues that could affect how this passage is understood?" },
        { id: "language-4", question: "What evidence from ancient usage supports or limits the possible meaning of this term?" },
    ],
};
