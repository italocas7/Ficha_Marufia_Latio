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

    def test_escalar_is_replaced_and_background_bonuses_are_structured(self):
        skill_names = {skill["name"] for skill in self.database["skills"]}
        self.assertEqual(len(skill_names), 37)
        self.assertNotIn("Escalar", skill_names)

        family = {item["name"]: item for item in self.database["backgrounds"]["family"]}
        personal = {item["name"]: item for item in self.database["backgrounds"]["personal"]}
        self.assertEqual((len(family), len(personal)), (12, 12))
        self.assertEqual(family["Construtor de Fortalezas"]["bonuses"], [
            {"skill": "Atletismo", "value": 5},
            {"skill": "Tática", "value": 5},
        ])
        self.assertEqual(personal["Peregrino Devoto"]["bonuses"], [
            {"skill": "Religião", "value": 5},
            {"skill": "Sobrevivência", "value": 5},
            {"skill": "Atletismo", "value": 5},
        ])
        for background in [*family.values(), *personal.values()]:
            self.assertTrue(background["bonuses"])
            self.assertTrue(all(bonus["skill"] in skill_names for bonus in background["bonuses"]))

        lapimes = next(culture for region in self.database["regions"] for culture in region["cultures"] if culture["name"] == "Lapimeš")
        self.assertIn({"skill": "Atletismo", "value": 5}, lapimes["skillBonuses"])

    def test_pdf_fixture_is_a_real_form_pdf(self):
        payload = (ROOT / "tests" / "fixtures" / "Ficha_Marufia_Automatica.pdf").read_bytes()
        self.assertTrue(payload.startswith(b"%PDF-"))
        self.assertIn(b"/AcroForm", payload)
        self.assertGreater(len(payload), 100_000)

    def test_spell_actions_and_talent_rules_are_structured(self):
        spells = {spell["id"]: spell for spell in all_spells(self.database)}
        jade = spells["n-tra-o-de-jade"]["levels"][0]
        temper = spells["p-cargas-de-t-mpera"]["levels"][0]
        root = spells["c-raiz-da-terra"]["levels"][7]
        self.assertEqual((jade["activationAction"], jade["secondaryActions"]), ("bonus", ["reaction"]))
        self.assertEqual((temper["activationAction"], temper["secondaryActions"]), ("bonus", ["reaction"]))
        self.assertEqual((root["activationAction"], root["secondaryActions"]), ("standard", ["movement"]))
        for spell in spells.values():
            for level in spell["levels"]:
                self.assertIsNotNone(level["activationCost"])
                self.assertNotEqual(level["mechanicsSource"]["activationCost"], "missing")

        talents = {talent["name"]: talent for talent in self.database["talents"]}
        self.assertEqual(talents["Atleta"]["mode"], "mixed")
        self.assertEqual(talents["Amado Pela Magia"]["mode"], "passive")
        self.assertTrue(talents["Amado Pela Magia"]["stackable"])
        self.assertEqual(talents["Lobo Solitário"]["conditionalMods"]["attackMod"], 10)


if __name__ == "__main__":
    unittest.main()
