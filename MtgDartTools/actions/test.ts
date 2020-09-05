import * as task from 'azure-pipelines-task-lib/task';

const notWhitespace = /\S/;

/**
 * Runs 'pub run test'.
 */
export async function test(): Promise<void> {
  // Move into the source directory
  let sourcePath: string = task.getPathInput('sourcePath', true)!;
  task.cd(sourcePath);

  // Run 'pub run test'
  let verbose: boolean = task.getBoolInput('verbose');
  let testPlatform: string | undefined = task.getInput('testPlatform');
  let testTags: string | undefined = task.getInput('testTags');
  let testExcludeTags: string | undefined = task.getInput('testExcludeTags');
  let testTimeout: string | undefined = task.getInput('testTimeout');
  let additionalArgs: string | undefined = task.getInput('testArguments');

  let args: Array<string> = ['run', 'test'];

  if (verbose) {
    args.push('-v');
  }

  if (testPlatform && notWhitespace.test(testPlatform)) {
    args.push('-p');
    args.push(`"${testPlatform}"`);
  }

  if (testTags && notWhitespace.test(testTags)) {
    args.push('-t');
    args.push(`"${testTags}"`);
  }

  if (testExcludeTags && notWhitespace.test(testExcludeTags)) {
    args.push('-x');
    args.push(`"${testExcludeTags}"`);
  }

  if (testTimeout && notWhitespace.test(testTimeout)) {
    args.push('--timeout');
    args.push(`"${testTimeout}"`);
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