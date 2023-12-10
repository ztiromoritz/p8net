# p8net 
Pico8 Multiplayer Boilerplate

## Requirements
 * A Pico 8 copy (tested on linux only)
 * node/npm 

## Start

### 1. Create a .env file with a path to your pico-8 installation.

```
.env
----

P8_BIN=$HOME/opt/pico-8

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

### 5. Edit the code 
You can edit client and server code within pico-8

The last tab will interpreted by the server.
The function in the last tab should not be called from within the client code. 
(Although it will actually work and can be used to save tokens, by sharing code between client an server.)
Some p8 specific api might not work on the server (yet). Like ALL() for example.

## Notes

Currently there is no clear seperation between the framework written in JS
(src/{client,server}) and the game (src/p8net.p8).



## Todo
 - [x] Use Lua on server side
 - [x] Buffer GPIO in and out
 - [x] Test Template with two games
 - [x] Share consts between client an server. This should be possible if defined in last tab
 - [ ] Handle only one tab
 - [ ] Template for local multiplayer (wasd) vs (arrow)

## Links
 * CRT Plate: https://www.lexaloffle.com/bbs/?tid#33488
