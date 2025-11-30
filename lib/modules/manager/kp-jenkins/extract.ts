import { RANGE_PATTERN } from '@renovatebot/pep440';
import { logger } from '../../../logger';
import { regEx } from '../../../util/regex';
import { PypiDatasource } from '../../datasource/pypi';
import * as pep440Versioning from '../../versioning/pep440';
import type { PackageDependency, PackageFileContent } from '../types';

const packagePattern = '[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]';
const extrasPattern = '(?:\\s*\\[[^\\]]+\\])?';

const rangePattern: string = RANGE_PATTERN;
const specifierPartPattern = `\\s*${rangePattern.replace(
  regEx(/\?<\w+>/g),
  '?:',
)}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
const dependencyPattern = `(?<package>${packagePattern})(${extrasPattern})(?<specifier>${specifierPattern})`;

function extractPythonDependency(
  dependencyText: string,
  name: string,
): PackageDependency | null {
  if (dependencyText.includes('${')) {
    logger.warn(
      {
        dependency: dependencyText,
      },
      'Variables unsupported',
    );

    return null;
  }

  const dependencyMatch = regEx(dependencyPattern).exec(dependencyText);
  return {
    depName: dependencyMatch?.groups?.['package'],
    currentValue: dependencyMatch?.groups?.['specifier'],
    datasource: PypiDatasource.id,
    versioning: pep440Versioning.id,
    depType: name,
  };
}

function extract_withPipxInstalled(jenkinsfile: string): PackageDependency[] {
  const withPipxInstalledPattern = `withPipxInstalled\\s*\\(\\s*['"](?<pythonVersion>[\\d.]+)['"]\\s*,\\s*(?<requirements>.*?)\\s*\\)`;

  let result: PackageDependency[] = [];

  let requirementsMatch: RegExpExecArray | null;
  const requirementsRegex = regEx(withPipxInstalledPattern, 'gms');
  while ((requirementsMatch = requirementsRegex.exec(jenkinsfile)) !== null) {
    if (requirementsMatch?.groups?.requirements.startsWith('[')) {
      const requirementPattern = `['"].*?['"]`;
      const requirementRegex = regEx(requirementPattern, 'gms');
      let requirementMatch: RegExpExecArray | null;
      while (
        (requirementMatch = requirementRegex.exec(
          requirementsMatch?.groups?.requirements,
        )) !== null
      ) {
        const packageDependency = extractPythonDependency(
          requirementMatch[0],
          'withPipxInstalled',
        );
        if (packageDependency === null) {
          continue;
        }

        result = [...result, packageDependency];
      }
    } else if (requirementsMatch?.groups?.requirements) {
      const packageDependency = extractPythonDependency(
        requirementsMatch?.groups?.requirements,
        'withPipxInstalled',
      );
      if (packageDependency === null) {
        continue;
      }

      result = [...result, packageDependency];
    }
  }

  return result;
}

export async function extractPackageFile(
  content: string,
  packageFile: string,
): Promise<PackageFileContent | null> {
  return {
    deps: [...extract_withPipxInstalled(content)],
  };
}
