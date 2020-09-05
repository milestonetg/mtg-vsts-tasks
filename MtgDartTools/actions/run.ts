import * as task from 'azure-pipelines-task-lib/task';

const notWhitespace = /\S/;

/**
 * Runs 'pub run <executable>'.
 */
export async function run(): Promise<void> {
  // Move into the source directory
  let sourcePath: string = task.getPathInput('sourcePath', true)!;
  task.cd(sourcePath);

  // Run 'pub run'
  let verbose: boolean = task.getBoolInput('verbose');
  let executable: string = task.getInput('runExecutable', true)!;
  let runArgs: string | undefined = task.getInput('runArguments');

  if (!notWhitespace.test(executable)) {
    throw new Error('No executable was given to run.');
  }

  let args: Array<string> = ['run', executable];

  if (runArgs && notWhitespace.test(runArgs)) {
    args.push(runArgs);
  }

  if (verbose) {
    args.push('-v');
  }

  let argsStr: string = args.join(' ');

  console.info(`Running 'pub ${argsStr}'...`);
  console.info(`Pub working directory: ${sourcePath}`);

  let pubStatusCode: number = await task.exec('pub', argsStr);

  if (pubStatusCode !== 0) {
    throw new Error(`Pub exited with code ${pubStatusCode}.`);
  }
}