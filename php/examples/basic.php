<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use Klog\Client;

$client = Client::fromEnv();
$result = $client->info('hola desde PHP', ['sdk' => 'php']);
fwrite(STDOUT, sprintf("created=%s dropped=%s id=%s\n", $result->created ? 'true' : 'false', $result->dropped ? 'true' : 'false', $result->id));
$client->close();
