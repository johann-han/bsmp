export interface Database {
    public: {
        Tables: {
            studies: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    status: string;
                    passage_start_book: string;
                    passage_start_chapter: number;
                    passage_start_verse: number;
                    passage_end_book: string;
                    passage_end_chapter: number;
                    passage_end_verse: number;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    user_id: string;
                    title: string;
                    status: string;
                    passage_start_book: string;
                    passage_start_chapter: number;
                    passage_start_verse: number;
                    passage_end_book: string;
                    passage_end_chapter: number;
                    passage_end_verse: number;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["studies"]["Insert"]>;
                Relationships: [];
            };
            study_observations: {
                Row: {
                    id: string;
                    study_id: string;
                    user_id: string;
                    verse_book: string;
                    verse_chapter: number;
                    verse_verse: number;
                    statement: string;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    study_id: string;
                    user_id: string;
                    verse_book: string;
                    verse_chapter: number;
                    verse_verse: number;
                    statement: string;
                    created_at?: string;
                };
                Update: Partial<Database["public"]["Tables"]["study_observations"]["Insert"]>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}
