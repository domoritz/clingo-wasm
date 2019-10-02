import { expect, use } from "chai";
import asPromised from "chai-as-promised";
use(asPromised);

import { run } from "../index.node";

describe('run', async () => {
    it('should work', async () => {
        const { Call, Time, ...result } = await run('a. b. c :- a, b.', 0);
        expect(result).to.deep.equal({
            Result: 'SATISFIABLE',
            Models: {
                Number: 1,
                More: 'no',
            },
            Calls: 1,
        });
        expect(Call[0].Witnesses[0].Value).to.deep.equal(['b', 'a', 'c']);
    });

    it('should accept options', async () => {
        const { Call, Time, ...result } = await run('a. b. c :- a, b.', 0, '--enum-mode brave');
        expect(result).to.deep.equal({
            Result: 'SATISFIABLE',
            Models: {
                Number: 1,
                More: 'no',
                Brave: 'yes',
                Consequences: { True: 3, Open: 0 }
            },
            Calls: 1,
        });
        expect(Call[0].Witnesses[0].Value).to.deep.equal(['b', 'a', 'c']);
    });
});
