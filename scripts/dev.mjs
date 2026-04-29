import { spawn } from 'node:child_process';

const processes = [
  spawn('dotnet run --project desktop-helper/ScreenGuide.DesktopHelper/ScreenGuide.DesktopHelper.csproj', {
    stdio: 'inherit',
    shell: true,
  }),
  spawn('npm run dev:web', {
    stdio: 'inherit',
    shell: true,
  }),
];

const stopAll = () => {
  for (const child of processes) {
    if (!child.killed) child.kill();
  }
};

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});

for (const child of processes) {
  child.on('exit', code => {
    if (code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}
