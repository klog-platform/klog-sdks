#!/usr/bin/env python3
from klog_sdk import Client

client = Client.from_env()
result = client.info("hola desde Python", {"sdk": "python"})
print(f"created={result.created} dropped={result.dropped} id={result.id}")
client.close()
