import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as task from 'vsts-task-lib/task';
import * as yauzl from 'yauzl';

/**
 * Downloads the Dart SDK.
 */
export async function downloadSdk(): Promise<void> {
  // Create a temp directory
  const tempDirPath: string = await createTempDirectory();

  // Build a URL to the SDK
  const sdkUrl: string = getSdkUrl();

  // Download the SDK ZIP
  const sdkZipPath: string = path.join(tempDirPath, 'dart-sdk.zip');

  await downloadSdkZip(sdkUrl, sdkZipPath);

  // Extract the SDK ZIP
  await extractSdkZip(sdkZipPath);
}

/**
 * Creates a temporary directory and returns its full URI.
 */
function createTempDirectory(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const pathStart: string = path.join(os.tmpdir(), 'mtg-dart-tools-');

    fs.mkdtemp(pathStart, (error, folder) => {
      if (error) {
        reject(error);
      } else {
        resolve(folder);
      }
    });
  });
}

/**
 * Returns the full SDK URL from the task input.
 */
function getSdkUrl(): string {
  const sdkChannel: string = task.getInput('sdkChannel', true);
  const sdkVersion: string = task.getInput('sdkVersion', true);
  const sdkPlatform: string = task.getInput('sdkPlatform', true);
  const sdkArchitecture: string = task.getInput('sdkArchitecture', true);

  return 'https://storage.googleapis.com/dart-archive/'
    + 'channels/' + sdkChannel
    + '/release/' + sdkVersion
    + '/sdk/dartsdk-' + sdkPlatform
    + '-' + sdkArchitecture + '-release.zip';
}

/**
 * Downloads the Dart SDK ZIP file.
 * @param url The URI of the Dart SDK on the CDN.
 * @param outputPath The path to download to.
 */
function downloadSdkZip(url: string, outputPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.info(`Downloading ${url} into ${outputPath}...`);

    https.get(url, (response: http.IncomingMessage) => {
      // Ensure successful status code
      if (response.statusCode !== 200) {
        // Consume response anyway
        response.resume();

        // End with error
        reject(`Status code: ${response.statusCode}`);
        return;
      }

      // Get the file size
      const fileSizeStr = response.headers['content-length'];
      let fileSize: number = -1;

      if (fileSizeStr !== undefined) {
        fileSize = parseInt(fileSizeStr);
      } else {
        console.warn(
          "SDK download request is missing the 'content-length' header. "
          + "No download progress will be shown."
        );
      }

      // Listen for data chunks so we can show progress
      if (fileSize !== -1) {
        let downloadedBytes = 0;
        let lastPercentage: number = -1;

        response.on('data', (chunk: Buffer) => {
          downloadedBytes += chunk.length;

          const percentage: number = Math.floor((downloadedBytes / fileSize) * 100);

          if (percentage > lastPercentage) {
            lastPercentage = percentage;
            
            console.info(`Downloading ${percentage}%...`);
          }
        });
      }

      // Create a file stream
      const fileStream: fs.WriteStream = fs.createWriteStream(outputPath);

      // Start downloading the file
      const pipeStream: fs.WriteStream = response.pipe(fileStream);

      // Listen for completion
      pipeStream.on('finish', () => {
        console.info('Download complete.');

        fileStream.close();

        resolve();
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Extracts the SDK ZIP file.
 * @param sdkZipPath The path to the SDK ZIP file.
 */
function extractSdkZip(sdkZipPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const verbose: boolean = task.getBoolInput('verbose', true);

    // Get the destination path
    const sdkDestinationPath: string = task.getPathInput('sdkDestinationPath', true);
  
    console.info(`Extracting ${sdkZipPath} into ${sdkDestinationPath}...`);

    // Open the ZIP file
    yauzl.open(sdkZipPath, {lazyEntries: true}, async (error, zipFile) => {
      if (error) {
        reject(error);
        return;
      }

      if (zipFile === undefined) {
        reject('Yauzl gave us no error, but also no ZIP file!');
        return;
      }

      // Listen for entries
      zipFile.on('entry', (entry: yauzl.Entry) => {
        // Build the full path
        const fullEntryPath: string = path.join(sdkDestinationPath, entry.fileName);

        if (verbose) {
          console.log(`Extracting ${fullEntryPath}...`);
        }

        if (/\/$/.test(entry.fileName)) {
          // Directory
          fs.mkdirSync(fullEntryPath);

          // Keep reading
          zipFile.readEntry();
        } else {
          // File
          
          // Directory entires are optional, so we need to make the full
          // path up to the file...
          let folderPath: string = path.dirname(fullEntryPath);
          task.mkdirP(folderPath);

          // Read the entry file
          zipFile.openReadStream(entry, (error, readStream) => {
            if (error) {
              reject(error);
              return;
            }

            if (readStream === undefined) {
              reject('Yauzl gave us no error, but also no file stream!');
              return;
            }

            // Open a stream to output the file to
            const fileStream: fs.WriteStream = fs.createWriteStream(fullEntryPath);

            // Write the file
            const pipeStream = readStream.pipe(fileStream);

            // Listen for end of read/write
            pipeStream.on('finish', () => {
              fileStream.close();

              // Keep reading
              zipFile.readEntry();
            });
          });
        }
      });

      // Listen for completion
      zipFile.once('end', () => {
        resolve();
      });

      // Begin reading entries
      zipFile.readEntry();
    });
  });
}
