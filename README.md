# microservice-base

Common node.js microservice package.

#### (Note: don't share data structures, database schemata, or other internal representations of objects)

The first common module is server.js.  You can pass in custom express routes as per this example:
```javascript
import { cloudWatch, localPort } from 'config';
import Server from 'microservice-base';
import routes from './routes';

export default function() {
    const server = new Server({
        name: 'ACCOUNT-SERVICE',
        localPort,
        logConfig: cloudWatch,
        routes: routes
    });

    server.start();
    return server;
}
```
This will provide these common routes:
```
/
/api/verifysite
```

