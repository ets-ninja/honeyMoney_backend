# Honey Money App

### Install server dependencies.

### Now you can run server by:

```
npm start
```

## Logger

####Info
There are 6 levels:

1.  error
2.  warn
3.  info
4.  http
5.  verbose
6.  debug
7.  silly

Logger will be consoling levels that are higher in order only. Right now config levels are `info` for production and `debug` for development. You can change them in `./service/logger/..` file if you need to widen or reduce logging levels.

####Usage

1. import logger in your file
2. use required level and type your message as argument

```javascript
const logger = require("./services/logger");

  logger.error(New Error('message)) // will also log error stack trace
  logger.error('message');
  logger.debug('message')
```

---
