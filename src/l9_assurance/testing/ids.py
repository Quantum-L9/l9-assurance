from __future__ import annotations


class DeterministicIds:
    def __init__(self, prefix: str = "id") -> None:
        self.prefix = prefix
        self.counter = 0

    def next(self) -> str:
        self.counter += 1
        return f"{self.prefix}_{self.counter:04d}"
