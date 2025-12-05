// src/judge.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function quoteForShell(p) {
  // Wrap path in double quotes and escape any internal double quotes
  return `"${String(p).replace(/"/g, '\\"')}"`;
}

async function judge({ code, language, input }) {
  const jobId = crypto.randomUUID(); // uuid contains hyphens & hex
  const baseTemp = path.resolve(path.join(__dirname, '..', 'judgeSandbox', 'temp'));
  const tempDir = path.join(baseTemp, jobId);
  fs.mkdirSync(tempDir, { recursive: true });

  let srcFile;
  if (language === 'cpp') srcFile = 'main.cpp';
  else if (language === 'py') srcFile = 'main.py';
  else if (language === 'js') srcFile = 'main.js';
  else throw new Error('Unsupported language: ' + language);

  const dockerfileSrc = path.join(__dirname, '..', 'dockerfiles', `${language}.Dockerfile`);
  const runshSrc = path.join(__dirname, '..', 'run.sh');

  if (!fs.existsSync(dockerfileSrc)) {
    throw new Error(`Missing Dockerfile for ${language} at ${dockerfileSrc}`);
  }
  if (!fs.existsSync(runshSrc)) {
    throw new Error(`Missing run.sh at ${runshSrc}`);
  }

  try {
    fs.writeFileSync(path.join(tempDir, srcFile), code, 'utf8');
    fs.writeFileSync(path.join(tempDir, 'input.txt'), input ?? '', 'utf8');

    // Copy the Dockerfile and run.sh into the build context
    fs.copyFileSync(dockerfileSrc, path.join(tempDir, 'Dockerfile'));
    fs.copyFileSync(runshSrc, path.join(tempDir, 'run.sh'));

    // Build image (quote context path)
    const imageTag = `judge-${jobId}`; // lowercase + hyphens are allowed
    const buildCmd = `docker build -t ${imageTag} ${quoteForShell(tempDir)}`;
    execSync(buildCmd, { stdio: 'inherit', timeout: 120000 });

    // Run container: quote the hostpath:/containerpath pair to avoid Windows parsing issues
    const mountArg = `${tempDir}:/app`;
    const runCmd = `docker run --rm -m 128m --cpus=0.5 --pids-limit=64 -v ${quoteForShell(mountArg)} ${imageTag} bash run.sh input.txt user_out.txt`;

    let output = '';
    let error = '';

    try {
      execSync(runCmd, { encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
      const outPath = path.join(tempDir, 'user_out.txt');
      if (fs.existsSync(outPath)) {
        output = fs.readFileSync(outPath, 'utf8');
      } else {
        error = 'No user_out.txt produced by container.';
      }
    } catch (runErr) {
      const runErrMsg = runErr && runErr.message ? runErr.message : String(runErr);
      const stderr = runErr && runErr.stderr ? runErr.stderr.toString() : '';
      error = `Run failed: ${runErrMsg}` + (stderr ? `\nStderr:\n${stderr}` : '');
    } finally {
      // best-effort image cleanup
      try { execSync(`docker rmi ${imageTag}`, { stdio: 'ignore', timeout: 20000 }); } catch (e) { /* ignore */ }
    }

    return { output, error };
  } catch (err) {
    return { output: '', error: `Judge setup/build failed: ${err && err.message ? err.message : String(err)}` };
  } finally {
    // Always try to remove the temp directory (force)
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }
}

module.exports = { judge };
