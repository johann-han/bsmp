"use client";

import { useState } from "react";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";

interface NewStudyDialogProps {

    open: boolean;

    onClose: () => void;

    onCreate: (
        title: string,
        passage: string,
    ) => void;

}

export function NewStudyDialog({
    open,
    onClose,
    onCreate,
}: NewStudyDialogProps) {

    const [title, setTitle] =
        useState("");

    const [passage, setPassage] =
        useState("");

    if (!open) {

        return null;

    }

    return (

        <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl">

            <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-xl">

                <h2 className="mb-6 text-2xl font-semibold text-slate-900">

                    Create New Study

                </h2>

                <div className="mt-6 space-y-6">

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">

                            Study Title

                        </label>

                        <Input
                            value={title}
                            onChange={(e) =>
                                setTitle(
                                    e.target.value,
                                )
                            }
                        />

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">

                            Bible Passage

                        </label>

                        <Input
                            placeholder="Romans 8:1-39"
                            value={passage}
                            onChange={(e) =>
                                setPassage(
                                    e.target.value,
                                )
                            }
                        />

                    </div>

                </div>

                <div className="mt-8 flex justify-end gap-3">

                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={() => {

                            onCreate(
                                title,
                                passage,
                            );

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