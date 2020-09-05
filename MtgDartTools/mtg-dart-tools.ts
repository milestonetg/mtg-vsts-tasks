import * as task from 'azure-pipelines-task-lib/task';
import { installSdk } from './actions/install-sdk';
import { getDependencies } from './actions/get-dependencies';
import { test } from './actions/test';
import { build } from './actions/build';
import { run } from './actions/run';

/**
 * Task entrypoint.
 */
async function main(): Promise<void> {
  const actionStr: string = task.getInput('action', true)!;

  console.info(`Action: ${actionStr}`);

  if (actionStr !== 'install') {
    // Display pub and dart versions
    await task.exec('dart', '--version');
    await task.exec('pub', '--version');
  }

  // Run action
  switch (actionStr) {
    case 'install':
      return installSdk();
    case 'get':
      return getDependencies();
    case 'test':
      return test();
    case 'build':
      return build();
    case 'run':
      return run();
    default:
      throw new Error(`Invalid action: '${actionStr}'.`);
  }
}

const mainPromise = main();
mainPromise.then(() => task.setResult(task.TaskResult.Succeeded, ''));
mainPromise.catch((error) => task.setResult(task.TaskResult.Failed, error));