export interface Database {
    public: {
        Tables: {
            studies: {
                Row: { id: string; user_id: string; title: string; status: string; passage_start_book: string; passage_start_chapter: number; passage_start_verse: number; passage_end_book: string; passage_end_chapter: number; passage_end_verse: number; created_at: string; };
                Insert: { id: string; user_id: string; title: string; status: string; passage_start_book: string; passage_start_chapter: number; passage_start_verse: number; passage_end_book: string; passage_end_chapter: number; passage_end_verse: number; created_at?: string; };
                Update: Partial<Database["public"]["Tables"]["studies"]["Insert"]>;
                Relationships: [];
            };
            study_observations: {
                Row: { id: string; study_id: string; user_id: string; verse_book: string; verse_chapter: number; verse_verse: number; target_translation: string | null; target_word_index: number | null; target_word_text: string | null; target_markup_symbol: string | null; statement: string; created_at: string; };
                Insert: { id: string; study_id: string; user_id: string; verse_book: string; verse_chapter: number; verse_verse: number; target_translation?: string | null; target_word_index?: number | null; target_word_text?: string | null; target_markup_symbol?: string | null; statement: string; created_at?: string; };
                Update: Partial<Database["public"]["Tables"]["study_observations"]["Insert"]>;
                Relationships: [];
            };
            study_interpretations: { Row: { id: string; study_id: string; user_id: string; statement: string; created_at: string; }; Insert: { id: string; study_id: string; user_id: string; statement: string; created_at?: string; }; Update: Partial<Database["public"]["Tables"]["study_interpretations"]["Insert"]>; Relationships: []; };
            interpretation_observations: { Row: { interpretation_id: string; observation_id: string; }; Insert: { interpretation_id: string; observation_id: string; }; Update: Partial<Database["public"]["Tables"]["interpretation_observations"]["Insert"]>; Relationships: []; };
            interpretation_evidence: { Row: { id: string; interpretation_id: string; study_id: string; user_id: string; evidence_type: string; description: string; created_at: string; }; Insert: { id: string; interpretation_id: string; study_id: string; user_id: string; evidence_type: string; description: string; created_at?: string; }; Update: Partial<Database["public"]["Tables"]["interpretation_evidence"]["Insert"]>; Relationships: []; };
            study_applications: { Row: { id: string; study_id: string; interpretation_id: string; user_id: string; principle: string; personal: string; ministry: string; action: string; created_at: string; }; Insert: { id: string; study_id: string; interpretation_id: string; user_id: string; principle: string; personal: string; ministry: string; action: string; created_at?: string; }; Update: Partial<Database["public"]["Tables"]["study_applications"]["Insert"]>; Relationships: []; };
            biblical_theology_entries: { Row: { id: string; study_id: string; user_id: string; theme: string; synthesis: string; interpretation_ids: string[]; created_at: string; }; Insert: { id: string; study_id: string; user_id: string; theme: string; synthesis: string; interpretation_ids?: string[]; created_at?: string; }; Update: Partial<Database["public"]["Tables"]["biblical_theology_entries"]["Insert"]>; Relationships: []; };
            expository_sermons: { Row: { id: string; study_id: string; user_id: string; title: string; big_idea: string | null; purpose: string | null; introduction?: string | null; context?: string | null; conclusion?: string | null; manuscript?: string | null; delivery_notes?: string | null; manuscript_sections: Array<{ id: string; title: string; content: string; outlinePointId?: string }>; created_at: string; }; Insert: { id: string; study_id: string; user_id: string; title: string; big_idea?: string | null; purpose?: string | null; introduction?: string | null; context?: string | null; conclusion?: string | null; manuscript?: string | null; delivery_notes?: string | null; manuscript_sections?: Array<{ id: string; title: string; content: string; outlinePointId?: string }>; created_at?: string; }; Update: Partial<Database["public"]["Tables"]["expository_sermons"]["Insert"]>; Relationships: []; };
            sermon_outline_points: { Row: { id: string; sermon_id: string; user_id: string; heading: string; truth: string; position: number; supporting_observation_ids: string[]; supporting_interpretation_ids: string[]; supporting_evidence_ids: string[]; supporting_application_ids: string[]; supporting_biblical_theology_ids: string[]; created_at: string; }; Insert: { id: string; sermon_id: string; user_id: string; heading: string; truth: string; position: number; supporting_observation_ids?: string[]; supporting_interpretation_ids?: string[]; supporting_evidence_ids?: string[]; supporting_application_ids?: string[]; supporting_biblical_theology_ids?: string[]; created_at?: string; }; Update: Partial<Database["public"]["Tables"]["sermon_outline_points"]["Insert"]>; Relationships: []; };
            sermon_occurrences: { Row: { id: string; sermon_id: string; user_id: string; scheduled_at: string; status: "scheduled" | "completed" | "cancelled"; venue: string; service_name: string; notes: string; preached_at: string | null; created_at: string; }; Insert: { id: string; sermon_id: string; user_id: string; scheduled_at: string; status?: "scheduled" | "completed" | "cancelled"; venue?: string; service_name?: string; notes?: string; preached_at?: string | null; created_at?: string; }; Update: Partial<Database["public"]["Tables"]["sermon_occurrences"]["Insert"]>; Relationships: []; };
        };
        Views: {};
        Functions: {};
        Enums: {};
        CompositeTypes: {};
    };
}
