const eventric = require('eventric');

// Create the Domain Context
var todoContext = eventric.context('Todo');

//Define the Domain events

todoContext.defineDomainEvents({
    TodoCreated: function ({ title }) {
        return this.title = title;
    },
    TodoTitleChanged: function ({ title }) {
        return this.title = title;
    },
    TodoFinished: function () { }
});

var Todo;

todoContext.addAggregate('Todo', Todo = class Todo {
    create({ title }) {
        if (!title) {
            throw new Error('title missing');
        }
        return this.$emitDomainEvent('TodoCreated', {
            title: title
        });
    }

    changeTitle({ title }) {
        if (!title) {
            throw new Error('title missing');
        }
        if (this.isFinished) {
            throw new Error('todo already finished');
        }
        return this.$emitDomainEvent('TodoTitleChanged', {
            title: title
        });
    }

    finish() {
        return this.$emitDomainEvent('TodoFinished');
    }

    handleTodoFinished() {
        return this.isFinished = true;
    }

});


todoContext.addCommandHandlers({
    CreateTodo: function ({ title }) {
        console.log("CreateTodo Command Invoked");
        return this.$aggregate.create('Todo', {
            title: title
        }).then(function (todo) {
            console.log("New todo created " + JSON.stringify(todo))
            return todo.$save();
        });
    },
    ChangeTodoTitle: function ({ todoId, title }) {
        console.log("ChangeTodoTitle Command Invoked");
        return this.$aggregate.load('Todo', todoId).then(function (todo) {
            console.log("Loaded the todo for updating: " + todoId)
            todo.changeTitle({
                title: title
            });
            console.log("preparing to save the  updated  todo")
            return todo.$save();
        });
    },
    FinishTodo: function ({ todoId }) {
        console.log("FinishTodo Command Invoked");
        return this.$aggregate.load('Todo', todoId).then(function (todo) {
            console.log("Loaded the todo for finishing ")
            todo.finish();
            return todo.$save();
        });
    }
});

// Domain event handlers can be registered for specific events and 
// even for specific aggregate instances.

todoContext.subscribeToDomainEvent('TodoFinished', function (domainEvent) {
    return console.log('SubEvtHlr: finished todo', domainEvent.aggregate.id);
});

todoContext.subscribeToDomainEventWithAggregateId('TodoTitleChanged', 'some aggregate id', function (domainEvent) {
    return console.log('SubEvtHlr: change title to: ', domainEvent.payload.title);
});


// PROJECTIONS
// Projections always replay an event stream from the beginning. 
// They are used to create or populate read models.

var todoCountProjection, todoCountReadModel, todosProjection, todosReadModel;

todosReadModel = {};

todosProjection = {
    initialize: function (params, done) {
        return done();
    },
    handleTodoCreated: function (domainEvent) {
        return todosReadModel[domainEvent.aggregate.id] = {
            title: domainEvent.payload.title
        };
    },
    handleTodoTitleChanged: function (domainEvent) {
        return todosReadModel[domainEvent.aggregate.id].title = domainEvent.payload.title;
    },
    handleTodoFinished: function (domainEvent) {
        return todosReadModel[domainEvent.aggregate.id].isFinished = true;
    }
};

todoContext.addProjection(todosProjection);

todoCountReadModel = 0;

// Query Handlers

todoContext.addQueryHandlers({
    getTodoList: function (params) {
        return todosReadModel;
    },
    getTodoCount: function (params) {
        return todoCountReadModel;
    }
});


todoContext.initialize().then(function () {
    console.log("-----Context Intialized-------")
    console.log("-----Sending command to add todo -------")
    return todoContext.command('CreateTodo', {
        title: 'My first todo'
    });
}).then(function (todoId) {
    console.log("-----Sending command to update todo -------")
    return todoContext.command('ChangeTodoTitle', {
        todoId: todoId,
        title: 'My first changed todo'
    }).then(function () {
        console.log("-----Sending Finishtodo command -------")
        return todoContext.command('FinishTodo', {
            todoId: todoId
        });
    });
}).then(function () {
    console.log("-----Sending query to get todolist -------")
    return todoContext.query('getTodoList', {});
}).then(function (todoList) {
    console.log("-----Displaying query to get todolist -------")
    console.log('current todos:', todoList);
    return todoContext.query('getTodoCount');
}).then(function (todoCount) {
    console.log("-----Displaying query to get todo count -------")
    return console.log('current todo count:', todoCount);
});

