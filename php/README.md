# kLog SDK for PHP

[![Packagist](https://img.shields.io/packagist/v/kriverdevice/klog-sdk-php.svg)](https://packagist.org/packages/kriverdevice/klog-sdk-php)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks)

Official REST ingest client for PHP 8.1+ (cURL).  
Español: [README.es.md](README.es.md)

```bash
composer require kriverdevice/klog-sdk-php
```

```php
use Klog\Client;
use Klog\Config;

$client = new Client(new Config(
    baseUrl: getenv('KLOG_URL') ?: 'https://klog-api.krisskira.com',
    tenantId: getenv('KLOG_TENANT_ID'),
    token: getenv('KLOG_TOKEN'),
    applicationId: getenv('KLOG_APPLICATION_ID'),
));
$client->info('checkout.paid', ['amount' => 19.99]);
$client->flush();
$client->close();
```

Use from Laravel controllers/jobs, Symfony services, or WordPress plugins — not from Blade with a leaked token.

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks)
- Source: [tree/main/php](https://github.com/klog-platform/klog-sdks/tree/main/php) (`composer.json` at monorepo root for Packagist)
- Releases: Packagist versions come from git tags `vX.Y.Z` only (not `sdk-php-v*`)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)
