import { NextResponse } from "next/server";

import { repository } from "../../../lib/repository";



export async function GET() {

    const studies =
        await repository.findAll();

    return NextResponse.json(

        studies.map((study) => ({

            id: study.id.value,

            title: study.title.value,

            passage: study.passage.toString(),

            status: "Draft",

        })),

    );

}