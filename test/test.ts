import { expect, use } from "chai";
import asPromised from "chai-as-promised";
import { makeSession } from "../../src/runtime";

use(asPromised);

import { run } from "../index.node";
describe("running queries", () => {
    const logic0 = `
        module todomvc
        sorts
            todos :: 1..3
            todo_state :: { complete, incomplete }
            filters :: { all, active, completed }

            new_todo :: actions
                attributes
                    text : strings

            todo_action :: actions
                attributes
                    target : todos
            toggle_todo :: todo_action
            destroy_todo :: todo_action
            edit_todo :: todo_action
                attributes
                    text : strings

            set_all :: actions
                attributes
                    state: todo_state
            clear_completed :: actions
            set_active_filter :: actions
                attributes
                    filter : filters
        statics
            complement : booleans -> booleans
        fluents
            basic 
                next_todo : todos
        
                destroyed : todos -> booleans
        
                text : todos -> strings

                active : todos -> booleans

                completed : todos -> booleans

                active_filter : filters
            defined
                visible : todos -> booleans
        axioms
            complement(true) = false.
            complement(false) = true.
    
            occurs(A) causes
                text(Todo) = Text,
                completed(Todo) = false,
                next_todo = Todo + 1
            if
                instance(A, new_todo),
                text(A) = Text,
                next_todo = Todo.
   
            occurs(A) causes completed(Todo) if
                instance(A, toggle_all),
                state(A) = complete.

            occurs(A) causes -completed(Todo) if
                instance(A, toggle_all),
                state(A) = incomplete.

            occurs(A) causes completed(Todo) = Comp if
                instance(A, toggle_todo),
                target(A) = Todo,
                completed(Todo) = Completed,
                complement(Completed) = Comp.
    
            occurs(A) causes text(Todo) = Text if
                instance(A, edit_todo),
                target(A) = Todo,
                text(A) = Text.
    
            occurs(A) causes destroyed(Todo) if
                instance(A, clear_completed),
                completed(Todo).

            occurs(A) causes active_filter = F if
                instance(A, set_active_filter),
                filter(A) = F.

            visible(Todo) if active(Todo), active_filter = all.
            visible(Todo) if active(Todo), completed(Todo), active_filter = completed.
            visible(Todo) if active(Todo), -completed(Todo), active_filter = active.
 
        initially
            next_todo = 1.
            active_filter = all.
        `;

    const logic = `
        module todomvc
        sorts
            todos :: 1..3
            filters :: { all, active, completed }

            new_todo :: actions
                attributes
                    new_text : string
        fluents
            basic 
                next_todo : todos
        
                text : todos -> strings

                active : todos -> booleans

                active_filter : filters
            defined
                visible : todos -> booleans
        axioms
            occurs(A) causes
                text(Todo) = Text,
                next_todo = Todo + 1
            if
                instance(A, new_todo),
                new_text(A) = Text,
                next_todo = Todo.
   
            visible(Todo) if active(Todo), active_filter = all.
        initially
            next_todo = 1.
            active_filter = all.
        `;
    it("querying initial state", async () => {
        const query = makeSession(run, logic);

        const queries = [
            "next_todo = Todo.",
            "active_filter = Filter."
        ];
        const result = await query(queries, []);
        
        console.log(result);
        expect(result.get(queries[0])[0]).to.deep.equal({ Todo: 1 });
        expect(result.get(queries[1])[0]).to.deep.equal({ Filter: "all" });
    });

    it.only("querying history", async () => {
        const query = makeSession(run, logic);

        const queries = [
            "visible(Todo), text(Todo) = Text.",
        ];

        const result = await query(queries, [
            ["new_todo",  {new_text: "todo1"}],
            ["new_todo",  {new_text: "todo2"}],
            ["new_todo",  {new_text: "todo3"}],
        ]);
        console.log(result);
        expect(result.get(queries[0])[0].Todo).to.have.members([1, 2, 3]);
    });
});

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
