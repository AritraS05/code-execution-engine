const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function judge({ code, language, input }) {
  const jobId = crypto.randomUUID();
  const tempDir = path.join(__dirname, 'temp', jobId);
  fs.mkdirSync(tempDir, { recursive: true });
  let srcFile;
  if (language === 'cpp') srcFile = 'main.cpp';
  if (language === 'py') srcFile = 'main.py';
  if (language === 'js') srcFile = 'main.js';
  fs.writeFileSync(path.join(tempDir, srcFile), code);
  fs.writeFileSync(path.join(tempDir, 'input.txt'), input);
  fs.copyFileSync(path.join(__dirname, 'dockerfiles', `${language}.Dockerfile`), path.join(tempDir, 'Dockerfile'));
  fs.copyFileSync(path.join(__dirname, 'run.sh'), path.join(tempDir, 'run.sh'));
  const imageTag = `judge-${jobId}`;
  execSync(`docker build -t ${imageTag} ${tempDir}`);
  // Use resource limits for safety
  let output = '', error = '';
  try {
    execSync(`docker run --rm -m 128m --cpus=0.5 --pids-limit=64 -v ${tempDir}:/app ${imageTag} bash run.sh input.txt user_out.txt`);
    output = fs.readFileSync(path.join(tempDir, 'user_out.txt'), 'utf8');
  } catch (err) {
    error = err.message;
  }
  execSync(`docker rmi ${imageTag}`);
  fs.rmSync(tempDir, { recursive: true });
  return { output, error };
}
