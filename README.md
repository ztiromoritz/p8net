# p8net 
Pico8 Multiplayer Boilerplate

## Start

### 1. Create a .env file with a path to your pico-8 installation.

```
.env
----

P8_HOME=$HOME/opt/pico-8

```

### 2. Open the pico-8 with the correct settings:
```
./scripts/p8-open.sh
```

### 3. Start the dev server
```
npm start # to start the dev server
```

### 4. navigate to :
[http://localhost:6108/client/](http://localhost:6108/client/)

## Todo
 - [ ] Use Lua on server side
 - [ ] Buffer GPIO in and out
 - [x] Test Template with two games
 - [ ] Template for local multiplayer (wasd) vs (arrow)

## Links
 * CRT Plate: https://www.lexaloffle.com/bbs/?tid#33488
