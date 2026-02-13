import type { WingetInstallerType } from '@/types/winget';

function getDefaultExtension(installerType?: WingetInstallerType): string {
  switch (installerType) {
    case 'msi':
    case 'wix':
      return '.msi';
    case 'msix':
      return '.msix';
    case 'appx':
      return '.appx';
    case 'zip':
      return '.zip';
    case 'exe':
    case 'inno':
    case 'nullsoft':
    case 'burn':
    case 'portable':
      return '.exe';
    case 'pwa':
      return '.msix';
    default:
      return '.exe';
  }
}

export function resolveInstallerFileName(
  url: string,
  installerType?: WingetInstallerType
): string {
  const fallback = `installer${getDefaultExtension(installerType)}`;

  try {
    const urlObj = new URL(url);
    const rawFileName = urlObj.pathname.split('/').pop();
    const fileName = rawFileName ? decodeURIComponent(rawFileName).trim() : '';

    if (!fileName) {
      return fallback;
    }

    if (/\.[a-z0-9]{1,8}$/i.test(fileName)) {
      return fileName;
    }

    return `${fileName}${getDefaultExtension(installerType)}`;
  } catch {
    return fallback;
  }
}
