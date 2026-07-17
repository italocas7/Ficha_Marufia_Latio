from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from data_rules import normalize_spell_levels  # noqa: E402


class StrictSpellLevelTests(unittest.TestCase):
    def assert_invalid(self, levels, expected):
        spell = {"name": "Magia de Teste", "levels": [{"level": level, "text": f"N{level}"} for level in levels]}
        with self.assertRaisesRegex(ValueError, expected):
            normalize_spell_levels(spell)

    def test_rejects_duplicate_level(self):
        self.assert_invalid([1, 2, 2, 4, 5, 6, 7, 8, 9, 10], "esperado nível 3, encontrado 2")

    def test_rejects_missing_level(self):
        self.assert_invalid([1, 2, 4, 5, 6, 7, 8, 9, 10], "esperado nível 3, encontrado 4")

    def test_rejects_out_of_order_level(self):
        self.assert_invalid([1, 3, 2, 4, 5, 6, 7, 8, 9, 10], "esperado nível 2, encontrado 3")


if __name__ == "__main__":
    unittest.main()
