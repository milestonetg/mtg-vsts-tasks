import * as task from 'vsts-task-lib/task';
import { downloadSdk } from './actions/download-sdk';
import { getDependencies } from './actions/get-dependencies';
import { build } from './actions/build';

/**
 * Task entrypoint.
 */
async function main(): Promise<void> {
  const actionStr: string = task.getInput('action', true);

  console.info(`Action: ${actionStr}`);

  switch (actionStr) {
    case 'downloadSdk':
      return downloadSdk();
    case 'get':
      return getDependencies();
    case 'build':
      return build();
    default:
      throw new Error(`Invalid action: '${actionStr}'.`);
  }
}

const mainPromise = main();
mainPromise.then(() => task.setResult(task.TaskResult.Succeeded, ''));
mainPromise.catch((error) => task.setResult(task.TaskResult.Failed, error));