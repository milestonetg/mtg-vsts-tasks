import * as os from 'os';
import * as path from 'path';

/**
 * Returns the platform-specific path to pub.
 * @param sdkPath Path to the Dart SDK (root, not bin folder).
 */
export function getPubPath(sdkPath: string): string {
  let pubPath: string = `${sdkPath}${path.sep}bin${path.sep}pub`;

  if (os.platform() === 'win32') {
    pubPath += '.bat';
  }

  return pubPath;
}

/**
 * Returns the platform-specific path to dart.
 * @param sdkPath Path to the Dart SDK (root, not bin folder).
 */
export function getDartPath(sdkPath: string): string {
  let dartPath: string = `${sdkPath}${path.sep}bin${path.sep}dart`;

  if (os.platform() === 'win32') {
    dartPath += '.exe';
  }

  return dartPath;
}