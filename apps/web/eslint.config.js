import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
    ...nextJsConfig,
    {
        files: ["src/features/preaching/SermonDeliverySectionNavigation.tsx"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "react-hooks/exhaustive-deps": "off",
        },
    },
    {
        files: ["src/features/preaching/SermonDeliveryWorkspace.tsx"],
        rules: {
            "react-hooks/exhaustive-deps": "off",
        },
    },
];
