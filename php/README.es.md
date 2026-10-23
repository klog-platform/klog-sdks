# SDK PHP kLog

[![Packagist](https://img.shields.io/packagist/v/kriverdevice/klog-sdk-php.svg)](https://packagist.org/packages/kriverdevice/klog-sdk-php)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks)

Cliente oficial de ingesta REST para PHP 8.1+ (cURL).  
English: [README.md](README.md)

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

Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks) · Código: [tree/main/php](https://github.com/klog-platform/klog-sdks/tree/main/php)
