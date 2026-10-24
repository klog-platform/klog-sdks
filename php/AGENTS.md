# SDK PHP kLog

Cliente de ingesta REST para PHP 8.1+.

El manifiesto Packagist vive en la **raíz del monorepo** (`composer.json`), con autoload hacia `php/src`. El código permanece en `php/`.

```bash
# Desde la raíz de klog-sdks
composer install
composer test
```

La raíz del repo también corre `lint` (`php -l`), `test` y `build` con `npm run check`.

Paquete: `kriverdevice/klog-sdk-php`. Solo envía eventos; no usa GraphQL. El token no debe registrarse en logs.

Versiones en Packagist: solo tags `vX.Y.Z` (o `X.Y.Z`). Los tags `sdk-php-v*` disparan el deploy pero **no** crean versiones Composer. Registrar el repo en Packagist con la URL raíz `https://github.com/klog-platform/klog-sdks` tras merge a `main`.

Responder en español.
