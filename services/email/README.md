# Email library usage

### Create message template

```javascript

const sendMessage = require('../message');

const messageName = async (to, objectWithVariables) => {
  await sendMessage(to, emailSubject, `./templates/${nameOfTemplate}`, {
    objectWithVariables
  });
};

module.exports = messageName;

```

### Create html template

```html

<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>
          {{objectWithVariables.variable1}}
          {{objectWithVariables.variable2}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>

```

### Usage message template

```javascript

messageName("email@example.com", {
  varialbe1 = objectWithVariables.variable1, 
  varialbe2 = objectWithVariables.variable2
});

```
