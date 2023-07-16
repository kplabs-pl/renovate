import {extractPackageFile} from './extract'

import { Fixtures } from '../../../../test/fixtures';

const pyprojectFull = Fixtures.get('pyproject.full.toml');

describe('modules/manager/kp-hatch/extract', () => {
    describe('extractPackageFile()', () => {
        let filename = '';

        it('empty', async () => {
            const res = await extractPackageFile('', filename);
            expect(res?.deps).toMatchSnapshot();
            expect(res?.deps).toHaveLength(0);
        });

        it('full', async () => {
            const res = await extractPackageFile(pyprojectFull, filename);
            expect(res?.deps).toMatchSnapshot();
            expect(res?.deps).toHaveLength(10);
        });
    });
});