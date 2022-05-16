port=4000;
quasar build -m pwa;
cd dist/pwa;
php -S localhost:$port;
