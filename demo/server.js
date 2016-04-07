var json_server = require('json-server');
var router = json_server.router({
    /*
     * /users
     */
    users: [
        {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            dob: '1994-04-04'
        },
        {
            id: 2,
            first_name: 'Jack',
            last_name: 'Smith',
            dob: '1995-12-16'
        }
    ],
    /*
     * /users/:id/profile
     */
    profile: [
        {
            id: 1,
            email: 'john.doe@example.com'
        },
        {
            id: 2,
            email: 'jack.smith@example.com'
        }
    ]
});

var server = json_server
    .create()
    .use(json_server.defaults({
        static: './demo'
    }))
    .use(json_server.rewriter({
        '/api/': '/',
        '/users/:id/profile/': '/profile/:id'
    }))
    .use(router);

server.listen(8080);
