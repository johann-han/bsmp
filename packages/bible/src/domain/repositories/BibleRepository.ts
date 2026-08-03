import { Bible } from "../aggregates/Bible.js";

export interface BibleRepository {

    find(): Promise<Bible>;

}