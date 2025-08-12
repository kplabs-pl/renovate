import type { Category } from '../../../constants';
import { PypiDatasource } from '../../datasource/pypi';

export { extractPackageFile } from './extract';

export const supportedDatasources = [PypiDatasource.id];

export const defaultConfig = {
  managerFilePatterns: ['/(^|/)Jenkinsfile$/'],
};

export const categories: Category[] = ['python'];
