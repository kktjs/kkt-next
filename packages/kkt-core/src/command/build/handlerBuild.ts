// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

require('../../config/env');

import path from 'path';
import fs from 'fs-extra';
import color from 'colors-cli/safe';
import checkRequiredFiles from 'react-dev-utils/checkRequiredFiles';
import { measureFileSizesBeforeBuild, printFileSizesAfterBuild} from 'react-dev-utils/FileSizeReporter';
import printHostingInstructions from 'react-dev-utils/printHostingInstructions';
import { checkBrowsers } from 'react-dev-utils/browsersHelper';
import build from './build';
import configFactory from '../../config/webpack.config';
import * as paths from '../../config/paths';
import { Argv } from 'yargs';

const useYarn = fs.existsSync(paths.yarnLockFile);

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

function copyPublicFolder() {
  if (!fs.existsSync(paths.appPublic)) return;
  fs.copySync(paths.appPublic, paths.appBuild, {
    dereference: true,
    filter: file => file !== paths.appHtml,
  });
}

const isInteractive = process.stdout.isTTY;
export default async (args: Argv & {
  checkRequiredFiles: boolean;
  emptyDir: boolean;
}) => {
  try {
    // Generate configuration
    const config = await configFactory('production', args);
    // Warn and crash if required files are missing
    if (args.checkRequiredFiles && !checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
      process.exit(1);
    }

    let appBuild = paths.appBuild;
    if (config.output && config.output.path) {
      appBuild = config.output.path;
    }

    await checkBrowsers(paths.appPath, isInteractive);
    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    if (args.emptyDir) {
      await fs.emptyDir(appBuild);
    }

    // First, read the current file sizes in build directory.
    // This lets us display how much they changed later.
    const previousFileSizes = await measureFileSizesBeforeBuild(appBuild);

    // Merge with the public folder
    await copyPublicFolder();

    // Create the production build and print the deployment instructions.
    const buildResult = await build(previousFileSizes, config);
    if (buildResult.warnings.length) {
      console.log(color.yellow('Compiled with warnings.\n'));
      console.log(buildResult.warnings.join('\n\n'));
      console.log(
        '\nSearch for the ' +
        color.underline(color.yellow('keywords')) +
        ' to learn more about each warning.'
      );
      console.log(
        'To ignore, add ' +
        color.cyan('// eslint-disable-next-line') +
        ' to the line before.\n'
      );
    } else {
      console.log(color.green('Compiled successfully.\n'));
    }
    console.log('File sizes after gzip:\n');

    printFileSizesAfterBuild(
      buildResult.stats,
      previousFileSizes,
      paths.appBuild,
      WARN_AFTER_BUNDLE_GZIP_SIZE,
      WARN_AFTER_CHUNK_GZIP_SIZE
    );
    console.log();
    const appPackage = require(paths.appPackageJson);
    const publicUrl = paths.publicUrlOrPath;
    const publicPath = config.output.publicPath;
    const buildFolder = path.relative(process.cwd(), paths.appBuild);
    printHostingInstructions(
      appPackage,
      publicUrl,
      publicPath,
      buildFolder,
      useYarn
    );
  } catch (err) {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  }
}