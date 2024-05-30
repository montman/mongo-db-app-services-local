# mongo-db-app-services-local

## Installation

Run ```git clone``` in your github repository root. Make sure that your MongoDB App Services application source is inside a subfolder of your project repository.

Add `config.json` and `tokens.json` in `.gitignore`.

Edit the default config file as follows:
```json
{
  "apiKey":"the api key of your account",
  "apiSecret":"the api secret of your account",
  "groupId":"the group id of your application",
  "appId":"the app id of your application",
  "appFolder":"the name of your application folder"
}

```

Run

```npm i```

## Usage

Run 

```npm run realm```

to run a function.

### Cli parameters

```-f=<String>```

Filters the available functions that starts with ```String```. Example:

```npm run realm -- -f=N```

will filter the available functions that starts with `N`.
