import type { PackageDependency, PackageFileContent } from "../types";
import { JsonMap, parse } from '@iarna/toml';
import { RANGE_PATTERN } from '@renovatebot/pep440';
import { regEx } from "../../../util/regex";
import { PypiDatasource } from "../../datasource/pypi";
import * as pep440Versioning from '../../versioning/pep440';

export const packagePattern =
  '[a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]';
export const extrasPattern = '(?:\\s*\\[[^\\]]+\\])?';

const rangePattern: string = RANGE_PATTERN;
const specifierPartPattern = `\\s*${rangePattern.replace(
  regEx(/\?<\w+>/g),
  '?:'
)}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
export const dependencyPattern = `(?<package>${packagePattern})(${extrasPattern})(?<specifier>${specifierPattern})`;


function extractBuildSystemRequires(pyproject: JsonMap): PackageDependency[] {
    let buildSystem = pyproject['build-system'] as JsonMap;
    let requires = buildSystem?.requires as string[];

    if(requires == null) return [];

    return requires.map((dep: string) => {
        let r = regEx(dependencyPattern).exec(dep);
        return {
            depName: r?.groups?.['package'],
            currentValue: r?.groups?.['specifier'],
            datasource: PypiDatasource.id,
            versioning: pep440Versioning.id,
            depType: 'devDependencies',
        };
    });
}

function extractProjectDependencies(pyproject: JsonMap): PackageDependency[] {
    let project = pyproject.project as JsonMap;
    let dependencies = project?.dependencies as string[];

    if(dependencies == null) return [];

    return dependencies.map((dep: string) => {
        let r = regEx(dependencyPattern).exec(dep);
        return {
            depName: r?.groups?.['package'],
            currentValue: r?.groups?.['specifier'],
            datasource: PypiDatasource.id,
            versioning: pep440Versioning.id,
            depType: 'dependencies',
        };
    });
}

function extractProjectOptionalDependencies(pyproject: JsonMap): PackageDependency[] {
    let project = pyproject.project as JsonMap;
    let optionalDependencies = project?.['optional-dependencies'] as JsonMap;

    if(optionalDependencies == null) return [];

    let result: PackageDependency[] = [];

    for(let depGroup of Object.keys(optionalDependencies)) {
        let dependencies = optionalDependencies[depGroup] as string[];
        result = [
            ...result,
            ...(dependencies.map((dep: string) => {
                let r = regEx(dependencyPattern).exec(dep);
                return {
                    depName: r?.groups?.['package'],
                    currentValue: r?.groups?.['specifier'],
                    datasource: PypiDatasource.id,
                    versioning: pep440Versioning.id,
                    depType: `${depGroup}Dependencies`,
                };
            }))
        ];
    }

    return result;
}

function extractHatchEnvDependencies(pyproject: JsonMap): PackageDependency[] {
    let tool = pyproject.tool as JsonMap;
    let hatch = tool?.hatch as JsonMap;
    let envs = hatch?.envs as JsonMap;

    if(envs == null) return [];

    let result: PackageDependency[] = [];

    for(let envName of Object.keys(envs)) {
        let dependencies = (envs[envName] as JsonMap).dependencies as string[];
        if(dependencies == null) continue;

        result = [
            ...result,
            ...(dependencies.map((dep: string) => {
                let r = regEx(dependencyPattern).exec(dep);
                return {
                    depName: r?.groups?.['package'],
                    currentValue: r?.groups?.['specifier'],
                    datasource: PypiDatasource.id,
                    versioning: pep440Versioning.id,
                    depType: `${envName}EnvDependencies`,
                };
            }))
        ];
    }

    return result;
}

export async function extractPackageFile(
    content: string,
    packageFile: string
  ): Promise<PackageFileContent | null> {
    const pyproject = parse(content);

    return {
        deps: [
            ...extractBuildSystemRequires(pyproject),
            ...extractProjectDependencies(pyproject),
            ...extractProjectOptionalDependencies(pyproject),
            ...extractHatchEnvDependencies(pyproject),
        ],
    };
}
