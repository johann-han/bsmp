interface NewStudyButtonProps {

    onClick?: () => void;

}

export function NewStudyButton({
    onClick,
}: NewStudyButtonProps) {

    return (

        <button
            onClick={onClick}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
            + New Study
        </button>

    );

}