"""Cliente de ingesta kLog para Python."""

from .client import Client, Config, Entry, HTTPError, Result

__all__ = ["Client", "Config", "Entry", "HTTPError", "Result"]
__version__ = "0.1.0"
