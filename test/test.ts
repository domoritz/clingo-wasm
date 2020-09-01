import { expect } from "chai";
import { makeSession } from "../../src/runtime";

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

describe("running queries", () => {
    const logic = `
        module todomvc
        sorts
            todos :: 1..4
            filters :: { all, active, completed }
            
            new_todo :: actions
                attributes
                    new_text : strings
            todo_action :: actions
                attributes
                    target : todos
            toggle_todo :: todo_action
            destroy_todo :: todo_action
            edit_todo :: todo_action
                attributes
                    edit_text : strings

            set_all :: actions
                attributes
                    set_completed: booleans
            clear_completed :: actions
            set_active_filter :: actions
                attributes
                    filter : filters
        statics
            complement : booleans -> booleans
        fluents
            basic 
                next_todo : todos
        
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
                active(Todo),
                next_todo = Todo + 1
            if
                instance(A, new_todo),
                new_text(A) = Text,
                next_todo = Todo.
            
            occurs(A) causes completed(Todo) = Comp if
                instance(A, toggle_todo),
                target(A) = Todo,
                completed(Todo) = Completed,
                complement(Completed) = Comp.
    
            occurs(A) causes text(Todo) = Text if
                instance(A, edit_todo),
                target(A) = Todo,
                edit_text(A) = Text.

            occurs(A) causes -active(Todo) if
                instance(A, destroy_todo),
                target(A) = Todo.

            occurs(A) causes completed(Todo) = Completed if
                instance(A, set_all),
                set_completed(A) = Completed.

            occurs(A) causes -active(Todo) if
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
    it("querying initial state", async () => {
        const query = makeSession(run, logic);

        const queries = [
            "next_todo = Todo.",
            "active_filter = Filter."
        ];
        const result = await query(queries, []);
        expect(result.get(queries[0])[0]).to.deep.equal({ Todo: 1 });
        expect(result.get(queries[1])[0]).to.deep.equal({ Filter: "all" });
    });

    it("querying history", async () => {
        const query = makeSession(run, logic);

        const queries = [
            "visible(Todo), text(Todo) = Text.",
            "completed(Todo) = Completed."
        ];

        const result = await query(queries, [
            ["new_todo", { new_text: '"Learn logic programming"' }],
            ["new_todo", { new_text: '"Build awesome apps"' }],
            ["new_todo", { new_text: '"Formally verify them with Flamingo"' }],
        ]);
        expect(result.get(queries[0])).to.have.deep.members([
            { Todo: 1, Text: 'Learn logic programming' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' }
        ]);
        expect(result.get(queries[1])).to.have.deep.members([
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);
    });

    it("action sequence works correctly", async () => {
        const query = makeSession(run, logic);
        const queries = [
            "visible(Todo), text(Todo) = Text.",
            "completed(Todo) = Completed, active(Todo).",
        ];

        const getResult = async () => {
            const result = await query(queries, history);
            return (result.get(queries[0]) ?? [])
                .concat(result.get(queries[1]))
        };

        const history = [
            ["new_todo", { new_text: '"Learn logic programming"' }],
            ["new_todo", { new_text: '"Build awesome apps"' }],
            ["new_todo", { new_text: '"Formally verify them with Flamingo"' }]
        ] as any;

        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Text: 'Learn logic programming' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["edit_todo", { target: 1, edit_text: "edited" }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Text: 'edited' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["toggle_todo", { target: 1 }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Text: 'edited' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: true },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["toggle_todo", { target: 1 }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Text: 'edited' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["toggle_todo", { target: 1 }])
        history.push(["destroy_todo", { target: 2 }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Text: 'edited' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: true },
            { Todo: 3, Completed: false }
        ]);

        history.push(["clear_completed", {}])
        expect(await getResult()).to.have.deep.members([
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 3, Completed: false }
        ]);

        history.push(["set_all", { set_completed: true }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 3, Completed: true }
        ]);

        history.push(["new_todo", { new_text: '"A new todo"' }]);
        history.push(["set_active_filter", { filter: "active" }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 4, Text: 'A new todo' },
            { Todo: 3, Completed: true },
            { Todo: 4, Completed: false }
        ]);
    });

    it("negation works", async () => {
        const query = makeSession(run, logic);
        const queries = [
            "visible(Todo), text(Todo) = Text.",
            "completed(Todo) = Completed.",
        ];

        const getResult = async () => {
            const result = await query(queries, history);
            return (result.get(queries[0]) ?? [])
                .concat(result.get(queries[1]))
        };

        const history = [
            ["new_todo", { new_text: '"Learn logic programming"' }],
            ["new_todo", { new_text: '"Build awesome apps"' }],
            ["new_todo", { new_text: '"Formally verify them with Flamingo"' }]
        ] as any;

        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Text: 'Learn logic programming' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["set_active_filter", { filter: "active" }])
        expect(await getResult()).to.have.deep.members([
             { Todo: 1, Text: 'Learn logic programming' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["set_active_filter", { filter: "completed" }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["set_active_filter", { filter: "active" }])
        expect(await getResult()).to.have.deep.members([
             { Todo: 1, Text: 'Learn logic programming' },
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: false },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["toggle_todo", { target: 1 }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 2, Text: 'Build awesome apps' },
            { Todo: 3, Text: 'Formally verify them with Flamingo' },
            { Todo: 1, Completed: true },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);

        history.push(["set_active_filter", { filter: "completed" }])
        expect(await getResult()).to.have.deep.members([
            { Todo: 1, Text: 'Learn logic programming' },
            { Todo: 1, Completed: true },
            { Todo: 2, Completed: false },
            { Todo: 3, Completed: false }
        ]);
    });
});

