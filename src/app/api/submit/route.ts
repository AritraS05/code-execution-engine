// src/app/api/submit/route.ts (App Router)
// /pages/api/submit.js (Pages Router)
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { code, language, input } = await req.json();
  const jobId = crypto.randomUUID();
  const tempDir = path.join(process.cwd(), "judgeSandbox", "temp", jobId);
  fs.mkdirSync(tempDir, { recursive: true });

  // Prepare files
    let srcFile: string;
    if (language === "cpp") srcFile = "main.cpp";
    else if (language === "python") srcFile = "main.py";
    else if (language === "js") srcFile = "main.js";
    else throw new Error("Unknown language: " + language);

  fs.writeFileSync(path.join(tempDir, srcFile), code);
  fs.writeFileSync(path.join(tempDir, "input.txt"), input);
  fs.copyFileSync(path.join(process.cwd(), "judgeSandbox", "run.sh"), path.join(tempDir, "run.sh"));
  fs.copyFileSync(path.join(process.cwd(), "judgeSandbox", "dockerfiles", `${language}.Dockerfile`), path.join(tempDir, "Dockerfile"));

  const imageTag = `judge-${jobId}`;
  let output = "", error = "";
  try {
    execSync(`docker build -t ${imageTag} ${tempDir}`);
    execSync(`docker run --rm -m 128m --cpus=0.5 --pids-limit=64 -v ${tempDir}:/app ${imageTag} bash run.sh input.txt output.txt`);
    output = fs.readFileSync(path.join(tempDir, "output.txt"), "utf8");
    return NextResponse.json({ output, verdict: "Accepted" });
  } catch (err: any) {
    error = err.message || "Unknown error";
    return NextResponse.json({ error, verdict: "Error" });
  } finally {
    execSync(`docker rmi ${imageTag}`);
    fs.rmSync(tempDir, { recursive: true });
  }
}
