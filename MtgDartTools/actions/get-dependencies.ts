import * as task from 'azure-pipelines-task-lib/task';

/**
 * Runs 'pub get'.
 */
export async function getDependencies(): Promise<void> {
  // Move into the source directory
  const sourcePath: string = task.getPathInput('sourcePath', true)!;
  task.cd(sourcePath);

  // Run 'pub get'
  const verbose: boolean = task.getBoolInput('verbose');

  let args: string = 'get';

  if (verbose) {
    args += ' -v';
  }

  console.info(`Running 'pub ${args}'...`);
  console.info(`Pub working directory: ${sourcePath}`);

  const pubStatusCode: number = await task.exec('pub', args);

  if (pubStatusCode !== 0) {
    throw new Error(`Pub exited with code ${pubStatusCode}.`);
  }
}