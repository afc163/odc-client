const { execSync } = require('child_process');
const path = require('path');
const electronBuilder = require('electron-builder');
/**
 * build renderer
 */
async function buildWeb() {
  const result = execSync('npm run build:client', {
    stdio: 'inherit',
  });
  if (result && result.error) {
    console.error(result.error.message);
    return false;
  }
  return true;
}

async function buildClient(target) {
  const buildMap = {
    mac: [
      {
        ENV: '',
        ARCH: '',
        targets: electronBuilder.Platform.MAC.createTarget(),
      },
    ],
    'mac-jre': [
      {
        ENV: 'jre',
        ARCH: '',
        targets: electronBuilder.Platform.MAC.createTarget(),
      },
    ],
    win: [
      {
        ENV: '',
        ARCH: 'win64',
        targets: electronBuilder.Platform.WINDOWS.createTarget('nsis', electronBuilder.Arch.x64),
      },
      {
        ENV: '',
        ARCH: 'win32',
        targets: electronBuilder.Platform.WINDOWS.createTarget('nsis', electronBuilder.Arch.ia32),
      },
    ],
    'win-jre': [
      {
        ENV: 'jre',
        ARCH: 'win64',
        targets: electronBuilder.Platform.WINDOWS.createTarget('nsis', electronBuilder.Arch.x64),
      },
    ]
  };
  const command = buildMap[target];
  if (!command) {
    return false;
  }
  for (const c of command) {
    process.env.ENV = c.ENV;
    process.env.ARCH = c.ARCH;
    try {
      await electronBuilder.build({
        targets: c.targets,
      });
    } catch(e) {
      console.error('构建失败！', e)
      process.exit(1)
    }
  }
  return true;
}

async function run() {
  console.log('sign: ', process.env.CSC_LINK)
  switch (process.argv[2]) {
    case 'mac': {
      execSync('npm run prepack jar obclient', { stdio: 'inherit' });
      await buildWeb();
      await buildClient('mac');
      execSync('npm run prepack jre', {
        stdio: 'inherit',
        env: {
          ...process.env,
          platform: 'mac',
        },
      });
      await buildClient('mac-jre');
      return;
    }
    case 'win': {
      execSync('npm run prepack jar obclient', { stdio: 'inherit' });
      await buildWeb();
      await buildClient('win');
      execSync('npm run prepack jre', {
        stdio: 'inherit',
        env: {
          ...process.env,
          platform: 'win64',
        },
      });
      await buildClient('win-jre');
      return;
    }
    case 'all': {
      execSync('npm run prepack jar obclient', { stdio: 'inherit' });
      await buildWeb();
      await buildClient('mac');
      await buildClient('win');
      execSync('npm run prepack jre', {
        stdio: 'inherit',
        env: {
          ...process.env,
          platform: 'mac',
        },
      });
      await buildClient('mac-jre');
      execSync('npm run prepack jre', {
        stdio: 'inherit',
        env: {
          ...process.env,
          platform: 'win64',
        },
      });
      await buildClient('win-jre');
      return;
    }
    case 'test': {
      await buildClient('mac');
      return;
    }
  }
  console.log('[Done]Electron Builder')
}
run();
