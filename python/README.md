# kLog SDK para Python

```bash
pip install -e .
```

```python
import os
from klog_sdk import Client

client = Client.from_env()
client.info("Pedido creado", {"orderId": "42"})
client.flush()
client.close()
```

Variables: `KLOG_URL`, `KLOG_TENANT_ID`, `KLOG_TOKEN`, `KLOG_APPLICATION_ID`.

- `201` creado / `202` dropped.
- Reintentos en red, `429`, `502`–`504`.
- No reintenta `400`/`401`/`403`.
- Usa `urllib` de la stdlib (sin dependencias de red externas).
