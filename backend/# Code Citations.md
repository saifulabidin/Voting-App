# Code Citations

## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (exist
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (existingUser) {
      return res
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (existingUser) {
      return res.status(400).json({ message
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({ username, password });
    await
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({ username, password });
    await user.save();

    res.
```


## License: unknown
https://github.com/AKN414-IND/ICT_project_final/blob/0c4a28c31768851ed01c3fe23aa4bfae4d50bd31/backend/controllers/usersController.js

```
;
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({ username, password });
    await user.save();

    res.status(201).json
```

