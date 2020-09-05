import * as path from 'path';

import * as task from 'azure-pipelines-task-lib/task';

const notWhitespace = /\S/;

/**
 * Builds a Dart package with build_runner.
 */
export async function build(): Promise<void> {
  // Get source and destination paths
  let sourcePath: string = task.getPathInput('sourcePath', true)!;
  let destinationPath: string = task.getPathInput('destinationPath', true)!;

  // Move into the source directory
  task.cd(sourcePath);

  // Build a relative path for the output argument
  //
  // Due to a bug in build_runner, using an absolute path will result in
  // only part of the output being copied to the output directory.
  let relativePath: string = path.relative(sourcePath, destinationPath);

  // Run build_runner
  let releaseMode: boolean = task.getBoolInput('release');
  let verbose: boolean = task.getBoolInput('verbose');
  let config: string | undefined = task.getInput('config');
  let buildInputFolder: string | undefined = task.getInput('buildInputFolder');
  let lowResourcesMode: boolean = task.getBoolInput('lowResourcesMode');
  let additionalArgs: string | undefined = task.getInput('buildArguments');

  let outputValue: string = relativePath;

  if (buildInputFolder && notWhitespace.test(buildInputFolder)) {
    outputValue = `${buildInputFolder}:${outputValue}`;
  } 

  let args: Array<string> = ['run', 'build_runner', 'build', '-o', outputValue];

  if (config && notWhitespace.test(config)) {
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

  if (additionalArgs && notWhitespace.test(additionalArgs)) {
    args.push(additionalArgs);
  }

  let argsStr: string = args.join(' ');

  console.info(`Running 'pub ${argsStr}'...`);
  console.info(`Pub working directory: ${sourcePath}`);

  let pubStatusCode: number = await task.exec('pub', argsStr);

  if (pubStatusCode !== 0) {
    throw new Error(`Pub exited with code ${pubStatusCode}.`);
  }
}