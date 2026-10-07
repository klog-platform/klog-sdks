# kLog SDK para PHP

```bash
composer require klog/sdk-php
```

```php
<?php
use Klog\Client;
use Klog\Config;

$client = Client::fromEnv();
$result = $client->info('Pedido creado', ['orderId' => '42']);
$client->flush();
$client->close();
```

Variables: `KLOG_URL`, `KLOG_TENANT_ID`, `KLOG_TOKEN`, `KLOG_APPLICATION_ID`.

- `201` creado / `202` dropped.
- Reintentos en red, `429`, `502`–`504`.
- No reintenta `400`/`401`/`403`.
- Usa cURL (extensión `curl` de PHP).
