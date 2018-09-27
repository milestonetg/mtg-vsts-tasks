import * as fs from 'fs';
import * as path from 'path';

import * as task from 'vsts-task-lib/task';

import { getDartPath, getPubPath } from './executable-paths';

/**
 * Builds a Dart package with build_runner.
 */
export async function build(): Promise<void> {
  const sdkPath: string = task.getInput('sdkPath', true);

  // Build a path to pub
  const pubPath = getPubPath(sdkPath);

  if (!fs.existsSync(pubPath)) {
    throw new Error(`Could not find pub at ${pubPath}.`);
  }

  // Build a path to dart
  const dartPath = getDartPath(sdkPath);

  if (!fs.existsSync(pubPath)) {
    throw new Error(`Could not find dart at ${dartPath}.`);
  }

  // Display pub and dart versions
  await task.exec(dartPath, '--version');
  await task.exec(pubPath, '--version');

  // Get source and destination paths
  const sourcePath: string = task.getInput('sourcePath', true);
  const destinationPath: string = task.getInput('destinationPath', true);

  // Move into the source directory
  task.cd(sourcePath);

  // Build a relative path for the output argument
  //
  // Due to a bug in build_runner, using an absolute path will result in
  // only part of the output being copied to the output directory.
  const relativePath: string = path.relative(sourcePath, destinationPath);

  // Run build_runner
  const releaseMode: boolean = task.getBoolInput('release', true);
  const verbose: boolean = task.getBoolInput('verbose', true);
  const config: string = task.getInput('config', false);

  let args: Array<string> = ['run', 'build_runner', 'build', '-o', relativePath];

  if (config && /\S/.test(config)) {
    // Note: /\S/ ensures the string is not empty or whitespace
    args.push('-c');
    args.push(config);
  }

  if (releaseMode) {
    args.push('-r');
  }

  if (verbose) {
    args.push('-v');
  }

  let argsStr: string = args.join(' ');

  console.info(`Running 'pub ${argsStr}'...`);
  console.info(`Pub working directory: ${sourcePath}`);

  const pubStatusCode: number = await task.exec(pubPath, argsStr);

  if (pubStatusCode !== 0) {
    throw new Error(`Pub exited with code ${pubStatusCode}.`);
  }
}