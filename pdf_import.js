(function () {
  "use strict";

  const ATTR_FIELD_MAP = {
    FOR: ["For.Atr"],
    DES: ["Des.Atr"],
    CON: ["Con.Atr"],
    APA: ["Apa.Atr"],
    CAR: ["Car.Atr"],
    SAB: ["Sab.Atr"],
    INT: ["Int.Atr"],
    POD: ["Pod.Atr"],
  };

  const SKILL_FIELD_MAP = [
    ["Per.Arre", "Arremessar"],
    ["Per.Art", "Arte/Oficio"],
    ["Per.Atle", "Atletismo"],
    ["Per.Atua", "Atuacao"],
    ["Per.Ava", "Avaliacao"],
    ["Per.Ble", "Blefar"],
    ["Per.Cav", "Cavalgar"],
    ["Per.Charme", "Charme"],
    ["Per.Cont", "Contabilidade"],
    ["Per.Diplo", "Diplomacia"],
    ["Per.Direito", "Direito"],
    ["Per.Disfarce", "Disfarce"],
    ["Per.Enc", "Encontrar"],
    ["Per.Escu", "Escutar"],
    ["Per.Esquivar", "Esquivar"],
    ["Per.Furt", "Furtividade"],
    ["Per.Hist", "Historia"],
    ["Per.Inti", "Intimidacao"],
    ["Per.Intui", "Intuicao"],
    ["Per.Labia", "Labia"],
    ["Per.Animais", "Lidar com Animais"],
    ["Per.Brigar", "Lutar (Brigar)"],
    ["Per.Cultura", "Lutar (Culturais)"],
    ["Per.Medicina", "Medicina"],
    ["Per.Natu", "Natureza"],
    ["Per.Naveg", "Navegacao"],
    ["Per.Persu", "Persuasao"],
    ["Per.Pretidigita\u00e7\u00e3o", "Prestidigitacao"],
    ["Per.Rastre", "Rastrear"],
    ["Per.Reli", "Religiao"],
    ["Per.Sobrev", "Sobrevivencia"],
    ["Per.T\u00e1tica", "Tatica"],
  ];

  const NOTE_FIELD_MAP = {
    traits: ["Tra\u00e7os", "Tracos"],
    ideal: ["Ideal"],
    flaws: ["Defeitos"],
    bonds: ["Liga\u00e7\u00f5es", "Ligacoes"],
    eyes: ["Olhos"],
    age: ["Idade"],
    height: ["Altura"],
    hair: ["Cabelos"],
    skin: ["Pele"],
    weight: ["Peso"],
    appearance: ["Aparencia", "Apar\u00eancia"],
    history: ["Hist\u00f3ria", "Historia"],
    allies: ["Aliados e Organiza\u00e7\u00f5es", "Aliados e Organizacoes"],
    patron: ["Patrono"],
    other: ["Outras Caracter\u00edsticas", "Outras Caracteristicas"],
  };

  const STRUCTURE_FIELDS = [
    "Nome",
    "For.Atr",
    "HP MAX",
    "Per.Arre",
    "Corpo",
    "Tra\u00e7os",
    "Vazio 1",
  ];

  function clean(value) {
    if (Array.isArray(value)) return value.map(clean).filter(Boolean).join("\n");
    if (value && typeof value === "object") {
      if ("name" in value) return clean(value.name);
      const text = String(value);
      return text === "[object Object]" ? "" : clean(text);
    }
    return String(value ?? "")
      .replace(/\u0000/g, "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();
  }

  function compact(value) {
    return clean(value).replace(/\s+/g, " ").trim();
  }

  function fold(value) {
    return compact(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  }

  function numberFrom(value) {
    const match = compact(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function useful(value) {
    const text = clean(value);
    return Boolean(text && !["/Off", "Off", "false", "False"].includes(text));
  }

  function annotationValue(annotation) {
    if (!annotation || typeof annotation !== "object") return clean(annotation);
    const keys = ["value", "fieldValue", "defaultValue", "buttonValue", "exportValue"];
    for (const key of keys) {
      const value = clean(annotation[key]);
      if (useful(value)) return value.replace(/^\//, "");
    }
    return "";
  }

  async function readFormFields(pdf) {
    const fields = {};
    try {
      if (typeof pdf.getFieldObjects === "function") {
        const objects = (await pdf.getFieldObjects()) ?? {};
        for (const [name, widgets] of Object.entries(objects)) {
          const list = Array.isArray(widgets) ? widgets : [widgets];
          const value = list.map(annotationValue).find(useful) ?? "";
          fields[name] = value;
        }
      }
    } catch (error) {
      fields.__fieldObjectError = error.message;
    }

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const annotations = await page.getAnnotations({ intent: "display" });
        for (const annotation of annotations) {
          const name = annotation.fieldName;
          if (!name) continue;
          const value = annotationValue(annotation);
          if (!Object.hasOwn(fields, name) || (!useful(fields[name]) && useful(value))) fields[name] = value;
        }
      }
    } catch (error) {
      fields.__annotationError = error.message;
    }

    return fields;
  }

  async function extractText(pdf) {
    let text = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return text.trim();
  }

  function fieldGetter(fields) {
    const folded = new Map(Object.keys(fields).map((key) => [fold(key), key]));
    return function get(names) {
      for (const name of Array.isArray(names) ? names : [names]) {
        const exact = fields[name];
        if (useful(exact)) return clean(exact);
        const foldedKey = folded.get(fold(name));
        if (foldedKey && useful(fields[foldedKey])) return clean(fields[foldedKey]);
      }
      return "";
    };
  }

  function matchDbName(name, values) {
    const target = fold(name);
    return values.find((value) => fold(value) === target) ?? "";
  }

  function importedSkillName(name, db) {
    const stripped = compact(name).replace(/\([^)]*%?\)/g, "").trim();
    const aliases = {
      "ARTE/OFICIO": "Arte/Oficio",
      ATUACAO: "Atuacao",
      AVALIACAO: "Avaliacao",
      INTIMIDACAO: "Intimidacao",
      INTUICAO: "Intuicao",
      LABIA: "Labia",
      NAVEGACAO: "Navegacao",
      PERSUASAO: "Persuasao",
      "LUTAR (CULT.)": "Lutar (Culturais)",
      "LUTAR (CULTURAL)": "Lutar (Culturais)",
      "LUTAR (ARREMESSO)": "Lutar (Armas de Arremesso)",
      "LUTAR (ARREMESSOS)": "Lutar (Armas de Arremesso)",
      "LUTAR (ARMA LONGA)": "Lutar (Armas Longas)",
      "LUTAR (ARMAS LONGA)": "Lutar (Armas Longas)",
      "LUTAR (ARMA CURTA)": "Lutar (Armas Curtas)",
      PERCEPCAO: "Percepcao",
      PRESTIDIGITACAO: "Prestidigitacao",
      RELIGIAO: "Religiao",
      SOBREVIVENCIA: "Sobrevivencia",
      TATICA: "Tatica",
    };
    const candidate = aliases[fold(stripped)] ?? stripped;
    const dbNames = db?.skills?.map((skill) => skill.name) ?? [];
    return matchDbName(candidate, dbNames) || candidate;
  }

  function splitTextItems(text) {
    return clean(text)
      .split(/\n+| {2,}/)
      .map((item) => compact(item))
      .filter(Boolean);
  }

  function parseWeapons(get) {
    const weapons = [];
    for (let index = 1; index <= 4; index += 1) {
      const name = get(`Arma ${index}`);
      const damage = get(index === 1 ? "Dano" : `Dano ${index}`);
      const bonus = get([`B\u00f4nus ${index}`, `Bonus ${index}`]);
      if (!name && !damage && !bonus) continue;
      weapons.push({
        name: name || `Arma importada ${index}`,
        damage,
        property: bonus ? `Bonus: ${bonus}` : "",
        description: [name, damage, bonus ? `Bonus: ${bonus}` : ""].filter(Boolean).join(" | "),
      });
    }
    return weapons;
  }

  function parseEquipment(get) {
    const text = [get("Equipamentos"), get("Equi")].filter(Boolean).join("\n");
    const seen = new Set();
    return splitTextItems(text).filter((item) => {
      const key = fold(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((item) => ({
      name: item.slice(0, 80),
      description: item,
      category: "Equipamento Importado",
    }));
  }

  function parseSkills(get, db) {
    const skills = {};
    for (const [field, skillName] of SKILL_FIELD_MAP) {
      const value = numberFrom(get(field));
      if (value === null) continue;
      skills[importedSkillName(skillName, db)] = value;
    }
    for (let index = 1; index <= 4; index += 1) {
      const label = get(`Vazio ${index}`);
      const value = numberFrom(get(`Per.Vazio${index}`));
      if (!label || value === null) continue;
      skills[importedSkillName(label, db)] = value;
    }
    return skills;
  }

  function parseFromFields(fields, db) {
    const get = fieldGetter(fields);
    const data = {
      character: {
        name: get("Nome"),
        familyBackgroundName: get("Antecedente F"),
        personalBackgroundName: get("Antecedente P"),
        cultureName: get("Cultura"),
        gender: get("Sexo"),
        birth: get("Nascimento"),
        age: get("Idade"),
      },
      attributes: {},
      resources: {
        hpCurrent: numberFrom(get("HP Atual")),
        pmCurrent: numberFrom(get("PTS Atual")),
      },
      calculated: {
        hpMax: numberFrom(get("HP MAX")),
        pmMax: numberFrom(get("PTS MAX")),
        ca: numberFrom(get("CA")),
        body: numberFrom(get("Corpo")),
        bonus: get(["B\u00f4nus", "Bonus"]),
        dodge: numberFrom(get("Per.Esquivar")),
      },
      skills: parseSkills(get, db),
      notes: {},
      inventory: {
        money: {
          L: numberFrom(get("Dinheiro Libras")),
          D: numberFrom(get(["Dinherio D", "Dinheiro D"])),
          X: numberFrom(get("Dinheiro X")),
        },
        weapons: parseWeapons(get),
        equipment: parseEquipment(get),
        patrimonio: get(["Patrim\u00f4nio", "Patrimonio"]),
      },
    };

    for (const attrName of Object.keys(ATTR_FIELD_MAP)) {
      const value = numberFrom(get(ATTR_FIELD_MAP[attrName]));
      if (value !== null) data.attributes[attrName] = value;
    }
    for (const [noteKey, fieldNames] of Object.entries(NOTE_FIELD_MAP)) {
      data.notes[noteKey] = get(fieldNames);
    }
    return data;
  }

  function lineValue(text, labels) {
    const lines = clean(text).split(/\n+/);
    for (const label of Array.isArray(labels) ? labels : [labels]) {
      const foldedLabel = fold(label);
      for (const line of lines) {
        const foldedLine = fold(line);
        const index = foldedLine.indexOf(foldedLabel);
        if (index < 0) continue;
        const value = line.slice(index + label.length).replace(/[_:]+/g, " ").trim();
        if (value) return value;
      }
    }
    return "";
  }

  function parseFromText(text, db) {
    const fields = {};
    const data = parseFromFields(fields, db);
    data.character.name = lineValue(text, ["NOME", "PERSONAGEM"]);
    data.character.age = lineValue(text, "IDADE");
    data.character.gender = lineValue(text, ["SEXO", "GENERO"]);
    data.character.birth = lineValue(text, "NASCIMENTO");
    data.character.cultureName = lineValue(text, "CULTURA");
    data.resources.hpCurrent = numberFrom(lineValue(text, ["VIDA ATUAL", "VIDA MAXIMA"]));
    data.resources.pmCurrent = numberFrom(lineValue(text, ["PTS ATUAL", "PONTOS DE MAGIA"]));
    data.calculated.hpMax = numberFrom(lineValue(text, "VIDA MAXIMA"));
    data.calculated.ca = numberFrom(lineValue(text, "CA"));
    data.calculated.pmMax = numberFrom(lineValue(text, "PONTOS DE MAGIA"));
    for (const attrName of Object.keys(ATTR_FIELD_MAP)) {
      const match = text.match(new RegExp(`${attrName}\\s*:?\\s*(\\d{1,3})`, "i"));
      if (match) data.attributes[attrName] = numberFrom(match[1]);
    }
    return data;
  }

  function hasFormStructure(fields) {
    const keys = new Set(Object.keys(fields).map(fold));
    return STRUCTURE_FIELDS.filter((field) => keys.has(fold(field))).length >= 3;
  }

  function hasTextStructure(text) {
    const value = fold(text);
    return ["PERSONAGEM", "ATRIBUTOS", "PERICIAS", "ANTECEDENTES"].filter((label) => value.includes(label)).length >= 3;
  }

  function hasImportedValues(data) {
    return countImportedValues(data) > 0;
  }

  function importedEntries(value, path = "", result = []) {
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries()) importedEntries(item, `${path}[${index}]`, result);
      return result;
    }
    if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) importedEntries(item, path ? `${path}.${key}` : key, result);
      return result;
    }
    if (useful(value)) result.push([path, value]);
    return result;
  }

  function countImportedValues(data) {
    return importedEntries(data).filter(([path]) => !path.startsWith("calculated.")).length;
  }

  function sameImportedValue(left, right) {
    if (typeof left === "number" || typeof right === "number") return Number(left) === Number(right);
    return fold(left) === fold(right);
  }

  function mergeItemLists(formItems, textItems) {
    const result = [];
    const seen = new Set();
    for (const item of [...(formItems ?? []), ...(textItems ?? [])]) {
      const key = fold(item?.name || item?.description || JSON.stringify(item));
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  function mergePdfData(formData, textData) {
    const conflicts = [];
    const merge = (formValue, textValue, path = "") => {
      if (Array.isArray(formValue) || Array.isArray(textValue)) {
        return mergeItemLists(Array.isArray(formValue) ? formValue : [], Array.isArray(textValue) ? textValue : []);
      }
      if ((formValue && typeof formValue === "object") || (textValue && typeof textValue === "object")) {
        const result = {};
        const keys = new Set([...Object.keys(formValue ?? {}), ...Object.keys(textValue ?? {})]);
        for (const key of keys) result[key] = merge(formValue?.[key], textValue?.[key], path ? `${path}.${key}` : key);
        return result;
      }
      const hasForm = useful(formValue);
      const hasText = useful(textValue);
      if (hasForm && hasText && !sameImportedValue(formValue, textValue)) {
        conflicts.push({ path, formValue, textValue });
      }
      return hasForm ? formValue : hasText ? textValue : formValue ?? textValue ?? "";
    };
    return { data: merge(formData, textData), conflicts };
  }

  function valueAt(data, path) {
    return path.split(".").reduce((acc, key) => acc?.[key], data);
  }

  function missingFields(data) {
    const required = [
      ["Nome", "character.name"],
      ["Antecedente Familiar", "character.familyBackgroundName"],
      ["Antecedente Pessoal", "character.personalBackgroundName"],
      ["Cultura", "character.cultureName"],
      ["Sexo/Genero", "character.gender"],
      ["Nascimento", "character.birth"],
      ["Idade", "character.age"],
      ["Vida Maxima", "calculated.hpMax"],
      ["CA", "calculated.ca"],
      ["Pontos de Magia", "calculated.pmMax"],
      ["Corpo", "calculated.body"],
      ["Bonus", "calculated.bonus"],
      ["Esquiva", "calculated.dodge"],
      ["Tracos de Personalidade", "notes.traits"],
      ["Ideal", "notes.ideal"],
      ["Defeitos", "notes.flaws"],
      ["Ligacoes", "notes.bonds"],
      ["Olhos", "notes.eyes"],
      ["Altura", "notes.height"],
      ["Cabelos", "notes.hair"],
      ["Pele", "notes.skin"],
      ["Peso", "notes.weight"],
      ...Object.keys(ATTR_FIELD_MAP).map((attrName) => [attrName, `attributes.${attrName}`]),
    ];
    const missing = required.filter(([, path]) => {
      const value = valueAt(data, path);
      return value === null || value === undefined || value === "";
    }).map(([label]) => label);
    if (!Object.keys(data.skills).length) missing.push("Pericias");
    return [...new Set(missing)];
  }

  async function importFromPdf(file, options = {}) {
    const pdfjsLib = options.pdfjsLib;
    if (!pdfjsLib?.getDocument) throw new Error("Biblioteca PDF nao carregada.");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: bytes, disableWorker: true }).promise;
    const fields = await readFormFields(pdf);
    const text = await extractText(pdf);
    const hasFields = hasFormStructure(fields);
    const formData = parseFromFields(fields, options.db);
    const textData = parseFromText(text, options.db);
    const formHasValues = hasImportedValues(formData);
    const textHasValues = hasImportedValues(textData);
    const merged = mergePdfData(formData, textData);
    const recognized = hasFields || hasTextStructure(text);
    const source = formHasValues && textHasValues ? "form+text" : formHasValues ? "form" : "text";
    return {
      recognized,
      source,
      fieldCount: Object.keys(fields).filter((key) => !key.startsWith("__")).length,
      importedValueCount: countImportedValues(merged.data),
      data: merged.data,
      conflicts: merged.conflicts,
      missing: recognized ? missingFields(merged.data) : [],
      diagnostics: {
        fieldObjectError: fields.__fieldObjectError ?? "",
        annotationError: fields.__annotationError ?? "",
      },
    };
  }

  window.MARUFIA_PDF_IMPORTER = { importFromPdf, mergePdfData, countImportedValues };
})();
