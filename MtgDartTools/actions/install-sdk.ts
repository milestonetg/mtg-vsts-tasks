import * as os from 'os';
import * as path from 'path';

import * as toolLib from 'azure-pipelines-tool-lib/tool';
import * as task from 'azure-pipelines-task-lib/task';

const toolName = 'dart-sdk';

let osPlatform: string = os.platform();
let osArch: string = os.arch();

/**
 * Installs the Dart SDK.
 * 
 * Uses a cached version if the requested version is in the Azure Pipelines tool cache.
 * 
 * The SDK bin will be prepended to PATH.
 */
export async function installSdk(): Promise<void> {
  const sdkVersion: string = task.getInput('sdkVersion', true)!;

  // Check tool cache for exact version
  let toolPath: string | undefined = toolLib.findLocalTool(toolName, sdkVersion);

  // Download and install if not found
  if (!toolPath) {
    toolPath = await acquireDartSdk(sdkVersion);
  }

  // Prepend bin to PATH
  toolPath = path.join(toolPath, 'bin');
  toolLib.prependPath(toolPath);
}

async function acquireDartSdk(version: string): Promise<string> {
  // Clean version
  version = toolLib.cleanVersion(version);

  // Get SDK URL
  let sdkUrl: string = getSdkUrl(version);

  // Download
  let downloadPath: string = await toolLib.downloadTool(sdkUrl);

  // Extract
  let extractPath: string | undefined = task.getVariable('Agent.TempDirectory');
  if (!extractPath) {
    throw new Error('Expected Agent.TempDirectory to be set');
  }

  extractPath = path.join(extractPath, 'dart-sdk');
  extractPath = await toolLib.extractZip(downloadPath, extractPath);

  // Install
  return await toolLib.cacheDir(path.join(extractPath, 'dart-sdk'), toolName, version);
}

/**
 * Returns the full SDK URL for the given version, task inputted channel, 
 * and system platform and architecture.
 */
function getSdkUrl(sdkVersion: string): string {
  const sdkChannel: string = task.getInput('sdkChannel', true) || 'stable';

  let sdkPlatform: string;
  if (osPlatform === 'win32') {
    sdkPlatform = 'windows';
  } else if (osPlatform === 'linux') {
    sdkPlatform = 'linux';
  } else if (osPlatform === 'darwin') {
    sdkPlatform = 'macos';
  } else {
    throw new Error('Unsupported platform: ' + osPlatform);
  }

  let sdkArchitecture: string = osArch;
  if (sdkArchitecture == 'x32') {
    sdkArchitecture = 'x86';
  }

  return 'https://storage.googleapis.com/dart-archive/'
    + 'channels/' + sdkChannel
    + '/release/' + sdkVersion
    + '/sdk/dartsdk-' + sdkPlatform
    + '-' + sdkArchitecture + '-release.zip';
}
