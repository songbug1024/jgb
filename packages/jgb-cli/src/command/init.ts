import chalk from 'chalk';
import * as downloadRepo from 'download-git-repo';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import { logger } from 'jgb-shared/lib/Logger';
import * as path from 'path';
import * as tildify from 'tildify';
import * as home from 'user-home';
import checkVersion from '../utils/checkVersion';

export default async function init(
  template: string,
  rawName: string,
  program: any
) {
  const inPlace = !rawName || rawName === '.';
  const name = inPlace ? path.relative('../', process.cwd()) : rawName;
  const to = path.resolve(rawName || '.');
  const clone = program.clone || false;
  const offline = program.offline || false;
  const tmp = path.join(home, '.jgb_templates', template.replace(/\//g, '-'));
  /**
   * use offline cache
   */
  if (offline) {
    console.log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`);
    template = tmp;
  }

  if (fs.existsSync(to)) {
    inquirer
      .prompt([
        {
          type: 'confirm',
          message: inPlace
            ? 'Generate project in current directory?'
            : 'Target directory exists. Continue?',
          name: 'ok'
        }
      ])
      .then(async (answers: any) => {
        if (answers.ok) {
          await run(template, tmp);
        }
      })
      .catch();
  } else {
    await run(template, tmp);
  }
}

async function run(template: string, tmp: string) {
  if (isLocalPath(template)) {
    const templatePath = getTemplatePath(template);
    if (fs.existsSync(templatePath)) {
      await gen(templatePath);
    } else {
      logger.warn(`Local template "${template}" not found.`);
    }
  } else {
    await checkVersion();
    await downloadAndGenerate(template, tmp);
  }
}

async function downloadAndGenerate(template: string, tmp: string) {
  return new Promise(resolve => {
    downloadRepo(template, tmp, { clone: false }, async err => {
      if (err) {
        logger.error(
          'Failed to download repo ' + template + ': ' + err.message.trim()
        );
      }
      await gen(tmp);
      resolve();
    });
  });
}

async function gen(templatePath: string) {
  // todo: gen template
}

function isLocalPath(templatePath: string) {
  // templatePath example:
  // .jgb_templates
  // E:\workspace\jgb_templates\standard
  return /^[./]|(^[a-zA-Z]:)/.test(templatePath);
}

function getTemplatePath(templatePath: string) {
  return path.isAbsolute(templatePath)
    ? templatePath
    : path.normalize(path.join(process.cwd(), templatePath));
}
