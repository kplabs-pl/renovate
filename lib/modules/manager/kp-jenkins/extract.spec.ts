import { Fixtures } from '../../../../test/fixtures';
import {extractPackageFile} from './extract'


const jenkinsfileFull = Fixtures.get('Jenkinsfile.full');

describe('modules/manager/kp-jenkins/extract', () => {
    describe('extractPackageFile()', () => {
        const filename = '';

        it('empty', async () => {
            const res = await extractPackageFile('', filename);
            expect(res?.deps).toMatchSnapshot();
            expect(res?.deps).toHaveLength(0);
        });

        it('full', async () => {
            const res = await extractPackageFile(jenkinsfileFull, filename);
            expect(res?.deps).toMatchSnapshot();
            expect(res?.deps).toHaveLength(7);
        });
    });
});
