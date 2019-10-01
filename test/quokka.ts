import { run } from "../index.node";

run("a. b.").then(x => console.log(x.Call[0].Witnesses[0].Value));