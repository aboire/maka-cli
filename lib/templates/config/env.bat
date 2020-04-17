@echo off
:: This .bat file will be sourced before starting your application.
:: You can use it to put environment variables you want accessible
:: to the server side of your app by using process.env.MY_VAR
::
:: Example:

:: set MAIL_URL="smtp://gmail.com:25"
:: set MONGO_URL="mongodb://localhost:27017/<%= app %>"
:: set ROOT_URL="http://localhost:3000"
::
::
:: in reference to https://forums.meteor.com/t/meteor-stuck-at-starting-your-app/25592/28
if exists app\.meteor\local\db\METEOR-PORT (
  del app\.meteor\local\db\METEOR-PORT
)
