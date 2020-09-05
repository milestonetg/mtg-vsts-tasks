import * as task from 'azure-pipelines-task-lib/task';

const notWhitespace = /\S/;

/**
 * Runs 'pub get'.
 */
export async function getDependencies(): Promise<void> {
  // Move into the source directory
  let sourcePath: string = task.getPathInput('sourcePath', true)!;
  task.cd(sourcePath);

  // Run 'pub get'
  let verbose: boolean = task.getBoolInput('verbose');
  let additionalArgs: string | undefined = task.getInput('getArguments');

  let args: string = 'get';

  if (verbose) {
    args += ' -v';
  }

  if (additionalArgs && notWhitespace.test(additionalArgs)) {
    args += ` ${additionalArgs}`;
  }

  console.info(`Running 'pub ${args}'...`);
  console.info(`Pub working directory: ${sourcePath}`);

  let pubStatusCode: number = await task.exec('pub', args);

  if (pubStatusCode !== 0) {
    throw new Error(`Pub exited with code ${pubStatusCode}.`);
  }
}