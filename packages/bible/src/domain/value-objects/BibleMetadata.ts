import { ValueObject } from "@bsmp/shared";

export interface BibleMetadataProps {
    displayName: string;
    abbreviation: string;
}

export class BibleMetadata extends ValueObject<BibleMetadataProps> {

    public static create(
        props: BibleMetadataProps,
    ): BibleMetadata {

        return new BibleMetadata(props);

    }

    public get displayName(): string {
        return this.get("displayName");
    }

    public get abbreviation(): string {
        return this.get("abbreviation");
    }

}