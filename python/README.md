# kLog SDK for Python

[![PyPI](https://img.shields.io/pypi/v/klog-sdk.svg)](https://pypi.org/project/klog-sdk/)
[![Docs](https://img.shields.io/badge/docs-klog.krisskira.com-success.svg)](https://klog.krisskira.com/docs/sdks?lang=en)

Official REST ingest client for Python 3.10+ (`urllib` only).  
Español: [README.es.md](README.es.md)

- Docs: [klog.krisskira.com/docs/sdks](https://klog.krisskira.com/docs/sdks?lang=en)
- Source: [tree/main/python](https://github.com/klog-platform/klog-sdks/tree/main/python)
- OpenAPI: [docs/ingest-api](https://klog.krisskira.com/docs/ingest-api)

## Install

```bash
pip install klog-sdk
```

## Usage

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

Works in Django, Flask, FastAPI, Celery workers, and scripts. Prefer calling from the server — not from browser templates with a secret token.
