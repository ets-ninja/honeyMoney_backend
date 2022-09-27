# Honey Money App Backend

<img src="https://static.vecteezy.com/system/resources/previews/002/521/570/original/cartoon-cute-bee-holding-a-honey-comb-signboard-showing-victory-hand-vector.jpg" width="400"/>

### Install server dependencies.

### Now you can run server by:

```
npm start
```

### Lint

```
npm run lint
```

### Format

```
npm run prettier
```

# Endpoints

start local development server, then go to: http://localhost:5000/api/api_docs/

# Short description
| Endpoint  | Method  | Headers | Params |
| :------------ |:---------------:|:------:|-----:|
|/api/user    | GET |  Autorization: "Bearer TOKEN_HERE" | - |
|/api/user/signup    | POST | - | firstName, lastName, publicName, email, password |
|/api/user/update | PATCH | Autorization: "Bearer TOKEN_HERE" | firstName, lastName, publicName, password |
|/api/auth/validate_email?email=%email_to_validate_here%    | GET |  -| -|
|/api/auth/login   | POST | - | email, password |

## Logger

####Info There are 6 levels:

1.  error
2.  warn
3.  info
4.  http
5.  verbose
6.  debug
7.  silly

Logger will be consoling levels that are higher in order only. Right now config
levels are `info` for production and `debug` for development. You can change
them in `./service/logger/..` file if you need to widen or reduce logging
levels.

####Usage

1. import logger in your file
2. use required level and type your message as argument

```javascript
const logger = require("./services/logger");

  logger.error(New Error('message)) // will also log error stack trace
  logger.error('message');
  logger.debug('message')
```
