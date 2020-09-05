import * as path from 'path';

import * as task from 'azure-pipelines-task-lib/task';

/**
 * Builds a Dart package with build_runner.
 */
export async function build(): Promise<void> {
  // Get source and destination paths
  const sourcePath: string = task.getPathInput('sourcePath', true)!;
  const destinationPath: string = task.getPathInput('destinationPath', true)!;

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
  const config: string | undefined = task.getInput('config');
  const buildInputFolder: string | undefined = task.getInput('buildInputFolder');
  const lowResourcesMode: boolean = task.getBoolInput('lowResourcesMode');

  let outputValue: string = relativePath;

  if (buildInputFolder && /\S/.test(buildInputFolder)) {
    // Note: /\S/ ensures the string is not empty or whitespace
    outputValue = `${buildInputFolder}:${outputValue}`;
  } 

  let args: Array<string> = ['run', 'build_runner', 'build', '-o', outputValue];

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

  if (lowResourcesMode) {
    args.push('--low-resources-mode');
  }

  let argsStr: string = args.join(' ');

  console.info(`Running 'pub ${argsStr}'...`);
  console.info(`Pub working directory: ${sourcePath}`);

  const pubStatusCode: number = await task.exec('pub', argsStr);

  if (pubStatusCode !== 0) {
    throw new Error(`Pub exited with code ${pubStatusCode}.`);
  }
}