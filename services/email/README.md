### Email library usage:

### Create message template

```javascript

const sendMessage = require('../message');

const messageName = async (to, objectWithVariables) => {
  await sendMessage(to, emailSubject, `./templates/${nameOfTemplate}`, {
  varialbe1 = objectWithVariables.variable1, 
  varialbe2 = objectWithVariables.variable2
  });
};

module.exports = messageName;

```

### Usage message template

```

messageName("email@example.com", objectWithVariables)

```
