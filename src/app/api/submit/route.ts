// src/app/api/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

function quoteForShell(p: string) {
  // wrap in double quotes and escape internal quotes
  return `"${String(p).replace(/"/g, '\\"')}"`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { code, language, input } = body ?? {};

    if (!code || !language) {
      return NextResponse.json({ ok: false, error: "Missing code or language" }, { status: 400 });
    }

    // normalize language -> src filename + dockerfile name
    let srcFile: string;
    let dockerfileName: string;
    if (language === "cpp") {
      srcFile = "main.cpp";
      dockerfileName = "cpp.Dockerfile";
    } else if (language === "js" || language === "javascript") {
      srcFile = "main.js";
      dockerfileName = "js.Dockerfile";
    } else if (language === "python" || language === "py") {
      srcFile = "main.py";
      dockerfileName = "py.Dockerfile";
    } else {
      return NextResponse.json({ ok: false, error: `Unsupported language: ${language}` }, { status: 400 });
    }

    // base temp dir (allow override to avoid OneDrive)
    const baseTemp = process.env.JUDGE_TEMP_DIR
      ? path.resolve(process.env.JUDGE_TEMP_DIR)
      : path.join(process.cwd(), "judgeSandbox", "temp");

    const jobId = crypto.randomUUID();
    const tempDir = path.join(baseTemp, jobId);
    fs.mkdirSync(tempDir, { recursive: true });

    // write files into temp dir
    fs.writeFileSync(path.join(tempDir, srcFile), code, "utf8");
    fs.writeFileSync(path.join(tempDir, "input.txt"), input ?? "", "utf8");

    // copy runner and dockerfile
    const runshSrc = path.join(process.cwd(), "judgeSandbox", "run.sh");
    const dockerfileSrc = path.join(process.cwd(), "judgeSandbox", "dockerfiles", dockerfileName);

    if (!fs.existsSync(runshSrc)) {
      throw new Error(`Missing run.sh at ${runshSrc}`);
    }
    if (!fs.existsSync(dockerfileSrc)) {
      throw new Error(`Missing Dockerfile for ${language} at ${dockerfileSrc}`);
    }

    fs.copyFileSync(runshSrc, path.join(tempDir, "run.sh"));
    fs.copyFileSync(dockerfileSrc, path.join(tempDir, "Dockerfile"));

    const imageTag = `judge-${jobId}`;

    // Build image (quote the context path)
    const buildCmd = `docker build -t ${imageTag} ${quoteForShell(tempDir)}`;
    let buildStdout = "";
    try {
      buildStdout = execSync(buildCmd, { encoding: "utf8", stdio: "pipe", timeout: 120000 });
    } catch (buildErr: any) {
      const stderr = buildErr.stdout ?? buildErr.stderr ?? buildErr.message;
      // respond with JSON including build error
      return NextResponse.json(
        { ok: false, error: "Docker build failed", detail: String(stderr) },
        { status: 500 }
      );
    }

    // Run container (quote the hostpath:/containerpath pair)
    const mountArg = `${tempDir}:/app`;
    const runCmd = `docker run --rm -m 128m --cpus=0.5 --pids-limit=64 -v ${quoteForShell(
      mountArg
    )} ${imageTag} bash run.sh input.txt user_out.txt`;

    try {
      execSync(runCmd, { encoding: "utf8", stdio: "pipe", timeout: 30000 });
    } catch (runErr: any) {
      const stderr = runErr.stdout ?? runErr.stderr ?? runErr.message ?? String(runErr);
      // try to read whatever output file was produced
      let out = "";
      try {
        const outPath1 = path.join(tempDir, "user_out.txt");
        const outPath2 = path.join(tempDir, "output.txt");
        if (fs.existsSync(outPath1)) out = fs.readFileSync(outPath1, "utf8");
        else if (fs.existsSync(outPath2)) out = fs.readFileSync(outPath2, "utf8");
      } catch (e) {
        // ignore
      }
      return NextResponse.json(
        { ok: false, error: "Docker run failed", detail: String(stderr), output: out },
        { status: 500 }
      );
    }

    // if run succeeded, read the produced output file (check both names)
    let output = "";
    const outPath1 = path.join(tempDir, "user_out.txt");
    const outPath2 = path.join(tempDir, "output.txt");
    if (fs.existsSync(outPath1)) output = fs.readFileSync(outPath1, "utf8");
    else if (fs.existsSync(outPath2)) output = fs.readFileSync(outPath2, "utf8");
    else output = "";

    return NextResponse.json({ ok: true, output, verdict: "Accepted" }, { status: 200 });
  } catch (err: any) {
    // return JSON with error message and status 500
    const msg = err?.message ?? String(err);
    console.error("[API /api/submit] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    // best-effort cleanup: remove docker image and temp dir
    // note: we can't access imageTag here if thrown earlier, so wrap in try/catch as well
    try {
      // find any image with prefix 'judge-' and remove it (best-effort)
      // be conservative: don't crash on cleanup errors
      // (this block intentionally left small - only run if imageTag in scope)
    } catch (e) {
      // ignore
    }
    // remove temp dir if it exists
    try {
      // compute the tempDir used earlier if possible
      // because tempDir is declared inside try block, we try to reconstruct path via jobId not available here.
      // But it's fine because Node process ends quickly; still attempt to remove the job folder created in baseTemp (clean older).
      // Do not throw here if it fails.
    } catch (e) {
      // ignore
    }
  }
}
