from __future__ import annotations

import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))

from validate_data import all_spells, load_canonical, validate_database  # noqa: E402


class DatabaseIntegrityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.database = load_canonical()

    def test_database_is_valid(self):
        self.assertEqual(validate_database(self.database), [])

    def test_every_spell_has_exactly_ten_levels(self):
        for spell in all_spells(self.database):
            with self.subTest(spell=spell["name"]):
                self.assertEqual([level["level"] for level in spell["levels"]], list(range(1, 11)))

    def test_perception_and_world_laws(self):
        perception = next(skill for skill in self.database["skills"] if skill["name"] == "Percepção")
        self.assertEqual(perception["base"], 15)
        self.assertEqual(len(self.database["worldLaws"]), 76)
        siphon = next(law for law in self.database["worldLaws"] if law["ID"] == "UTI-29")
        self.assertIn("POD", siphon["Resistência sugerida"].upper())


if __name__ == "__main__":
    unittest.main()
