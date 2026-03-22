## Project setup

## Navigate inside the Server Directory
`````
cd Server
`````

`````
npm install
`````

## Set your sensitive information in your .env file (use the .env.example as an example);
`````
PORT=8080
HOST_URL=http://localhost:8080/
APP_TITLE=RentAuto

# PostgreSQL Database Config - Required
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_DATABASE=

# Optional
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
`````

## Run
`````
npm start
`````

## Usage
`````
Open http://localhost:8080/
`````
