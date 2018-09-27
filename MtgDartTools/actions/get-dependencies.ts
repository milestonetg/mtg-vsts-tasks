import * as fs from 'fs';
import * as path from 'path';

import * as task from 'vsts-task-lib/task';

import { getDartPath, getPubPath } from './executable-paths';

/**
 * Runs 'pub get'.
 */
export async function getDependencies(): Promise<void> {
  const sdkPath: string = task.getPathInput('sdkPath', true);

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

  // Move into the source directory
  const sourcePath: string = task.getPathInput('sourcePath', true);
  task.cd(sourcePath);

  // Run 'pub get'
  const verbose: boolean = task.getBoolInput('verbose', true);

  let args: string = 'get';

  if (verbose) {
    args += ' -v';
  }

  console.info(`Running 'pub ${args}'...`);
  console.info(`Pub working directory: ${sourcePath}`);

  const pubStatusCode: number = await task.exec(pubPath, args);

  if (pubStatusCode !== 0) {
    throw new Error(`Pub exited with code ${pubStatusCode}.`);
  }
}