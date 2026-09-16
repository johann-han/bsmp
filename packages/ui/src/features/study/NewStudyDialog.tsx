"use client";

import { useEffect, useState } from "react";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";

interface NewStudyDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate: (title: string, passage: string) => void;
    initialTitle?: string;
    initialPassage?: string;
}

export function NewStudyDialog({
    open,
    onClose,
    onCreate,
    initialTitle = "",
    initialPassage = "",
}: NewStudyDialogProps) {
    const [title, setTitle] = useState(initialTitle);
    const [passage, setPassage] = useState(initialPassage);

    useEffect(() => {
        if (!open) return;
        setTitle(initialTitle);
        setPassage(initialPassage);
    }, [open, initialTitle, initialPassage]);

    if (!open) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">
                <h2 className="mb-8 text-3xl font-bold text-slate-900">
                    Create New Study
                </h2>

                <div className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Study Title
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Bible Passage
                        </label>
                        <Input
                            placeholder="Romans 8:1–39"
                            value={passage}
                            onChange={(e) => setPassage(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            onCreate(title, passage);
                            onClose();
                        }}
                    >
                        Create Study
                    </Button>
                </div>
            </div>
        </div>
    );
}
