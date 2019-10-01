import {expect, use} from "chai";
import asPromised from "chai-as-promised";
use(asPromised);

import { run } from "../index.node";

describe('run', async () => {
    expect(run('a. b. c :- a, b.')).to.eventually.deep.equal({});
});
