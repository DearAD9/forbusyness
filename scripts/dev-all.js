import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';

// 1. Resolve Python executable from existing backend venv
function getPythonPath() {
  const venvPythonWin = path.join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe');
  const venvPythonPosix = path.join(rootDir, 'backend', 'venv', 'bin', 'python');

  if (isWin && fs.existsSync(venvPythonWin)) {
    return venvPythonWin;
  }
  if (!isWin && fs.existsSync(venvPythonPosix)) {
    return venvPythonPosix;
  }
  if (fs.existsSync(venvPythonWin)) {
    return venvPythonWin;
  }
  return isWin ? 'python' : 'python3';
}

// 2. Check if PostgreSQL is responding on configured port (5432)
function checkDatabase(port = 5432, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1200);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// 3. Logger helper with prefixes and ANSI colors
function attachLogger(proc, prefix, colorCode) {
  if (proc.stdout) {
    const rlOut = readline.createInterface({ input: proc.stdout });
    rlOut.on('line', (line) => {
      console.log(`${colorCode}${prefix}\x1b[0m ${line}`);
    });
  }

  if (proc.stderr) {
    const rlErr = readline.createInterface({ input: proc.stderr });
    rlErr.on('line', (line) => {
      console.error(`${colorCode}${prefix}\x1b[0m ${line}`);
    });
  }
}

// 4. Safe process termination
function killProcess(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (isWin) {
      execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: 'ignore' });
    } else {
      proc.kill('SIGTERM');
    }
  } catch {
    try {
      proc.kill('SIGKILL');
    } catch {
      // process already exited
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const backendOnly = args.includes('--backend');
  const frontendOnly = args.includes('--frontend');

  console.log('\x1b[36m===================================================\x1b[0m');
  console.log('\x1b[36m    Forbusyness Local Web App Dev Runner          \x1b[0m');
  console.log('\x1b[36m===================================================\x1b[0m');

  // Verify PostgreSQL status
  const dbOnline = await checkDatabase(5432, '127.0.0.1');
  if (dbOnline) {
    console.log('\x1b[32m[database] PostgreSQL is connected on port 5432.\x1b[0m');
  } else {
    console.log('\x1b[33m[database] Notice: PostgreSQL is not detected on port 5432.\x1b[0m');
    console.log('\x1b[33m[database] Please make sure PostgreSQL is running separately if database access is needed.\x1b[0m');
    console.log('\x1b[33m[database] (Local portable instance: backend/pgsql/pgsql/bin/postgres.exe -D backend/pgsql_data)\x1b[0m');
  }

  const runningProcesses = [];

  const cleanup = () => {
    console.log('\n\x1b[33m[system] Shutting down all processes...\x1b[0m');
    for (const proc of runningProcesses) {
      killProcess(proc);
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', () => {
    for (const proc of runningProcesses) {
      killProcess(proc);
    }
  });

  const pythonExec = getPythonPath();

  // Start FastAPI Backend
  if (!frontendOnly) {
    console.log(`\x1b[36m[backend]  Starting FastAPI on http://127.0.0.1:8000 using ${pythonExec}...\x1b[0m`);
    const backendProcess = spawn(
      pythonExec,
      ['-m', 'uvicorn', 'main:app', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', '8000', '--reload'],
      {
        cwd: rootDir,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
        stdio: ['inherit', 'pipe', 'pipe'],
      }
    );

    runningProcesses.push(backendProcess);
    attachLogger(backendProcess, '[backend] ', '\x1b[36m');

    backendProcess.on('exit', (code) => {
      console.log(`\x1b[31m[backend]  Exited with code ${code}\x1b[0m`);
    });
  }

  // Start Vite Frontend
  if (!backendOnly) {
    const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
    console.log('\x1b[35m[frontend] Starting Vite on http://localhost:5173...\x1b[0m');
    const frontendProcess = spawn(
      process.execPath,
      [viteBin],
      {
        cwd: rootDir,
        env: { ...process.env, FORCE_COLOR: '1' },
        stdio: ['inherit', 'pipe', 'pipe'],
      }
    );

    runningProcesses.push(frontendProcess);
    attachLogger(frontendProcess, '[frontend]', '\x1b[35m');

    frontendProcess.on('exit', (code) => {
      console.log(`\x1b[31m[frontend] Exited with code ${code}\x1b[0m`);
    });
  }
}

main().catch((err) => {
  console.error('\x1b[31m[system] Startup error:\x1b[0m', err);
  process.exit(1);
});
