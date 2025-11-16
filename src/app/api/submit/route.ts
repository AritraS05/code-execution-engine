import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest){
    const {code, language, input} = await req.json();
    let verdict = "Accepted", errors:string|null=null,details:string[]=[];
    if(!code){
        verdict="Rejected";
        errors="no code is written";
        details=["write someting :)"];
    }
    else if(code.includes("error")){
        verdict:"compilation error";
        errors="an error found in code";
    }

    await new Promise(res => setTimeout(res,2000));
    return NextResponse.json({verdict,errors,details});
}