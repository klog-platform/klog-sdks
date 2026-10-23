# SDK Python kLog

[![PyPI](https://img.shields.io/pypi/v/klog-sdk.svg)](https://pypi.org/project/klog-sdk/)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks)

Cliente oficial de ingesta REST para Python 3.10+ (solo `urllib`).  
English: [README.md](README.md)

```bash
pip install klog-sdk
```

```python
import os
from klog_sdk import Client

client = Client(
    base_url=os.getenv("KLOG_URL", "https://klog-api.krisskira.com"),
    tenant_id=os.environ["KLOG_TENANT_ID"],
    token=os.environ["KLOG_TOKEN"],
    application_id=os.environ["KLOG_APPLICATION_ID"],
)
client.info("batch.done", {"rows": 42})
client.flush()
client.close()
```

Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks) · Código: [tree/main/python](https://github.com/klog-platform/klog-sdks/tree/main/python)
