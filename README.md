# Honey Money App Backend
<img src="https://static.vecteezy.com/system/resources/previews/002/521/570/original/cartoon-cute-bee-holding-a-honey-comb-signboard-showing-victory-hand-vector.jpg" width="400"/>
### Install server dependencies.

### Now you can run server by:

```
npm start
```
# Endpoints
| Endpoint  | Method  | Headers | Params |
| :------------ |:---------------:|:------:|-----:|
|/api/user    | GET |  Autorization: "Bearer TOKEN_HERE" | - |
|/api/user/signup    | POST | - | firstName, lastName, publicName, email, password |
|/api/user/update | PATCH | Autorization: "Bearer TOKEN_HERE" | firstName, lastName, publicName, password |
|/api/auth/validate_email?email=%email_to_validate_here%    | GET |  -| -|
|/api/auth/login   | POST | - | email, password |