import { InputHTMLAttributes } from "react";

type InputProps =
    InputHTMLAttributes<HTMLInputElement>;

export function Input(
    props: InputProps,
) {

    return (

        <input
            {...props}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-600 focus:outline-none"
        />

    );

}