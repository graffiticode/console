# Graffiticode APP

## Run 

## Develop all locally

1. Run Graffiticode Auth in terminal

    This runs the firebase emulators and GC Auth.

    ```bash
    # In the Graffiticode Auth directory
    npm run dev
    ```

1. Run Graffiticode API in terminal

    ```bash
    # In the Graffiticode API directory
    FIRESTORE_EMULATOR_HOST="localhost:8080" AUTH_URL="http://localhost:4100" npx nodemon src/app.js
    ```

1. Run Graffiticode APP in terminal

    ```bash
    # In the Graffiticode APP directory
    npm run dev
    ```
