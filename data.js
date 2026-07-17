window.MARUFIA_DB = {
  "schema": "latio-db-1",
  "sourceNotes": [
    "Manual do Jogador Mundo de Marufia 3.1.pdf",
    "TALENTOS.docx",
    "Book.xlsx",
    "Ficha Marufia Automática.pdf usada como referência visual e de campos."
  ],
  "attributes": [
    "FOR",
    "DES",
    "CON",
    "APA",
    "POD",
    "INT",
    "CAR",
    "SAB"
  ],
  "bodyTable": [
    {
      "min": 2,
      "max": 64,
      "mod": "-1d4",
      "load": "15kg",
      "push": "50kg",
      "body": -1,
      "label": "Frágil, doente",
      "block": 0
    },
    {
      "min": 65,
      "max": 100,
      "mod": "0",
      "load": "45kg",
      "push": "175kg",
      "body": 0,
      "label": "Médio",
      "block": 0
    },
    {
      "min": 101,
      "max": 124,
      "mod": "+1d4",
      "load": "60kg",
      "push": "240kg",
      "body": 1,
      "label": "Forte",
      "block": 1
    },
    {
      "min": 125,
      "max": 164,
      "mod": "+1d6",
      "load": "80kg",
      "push": "320kg",
      "body": 2,
      "label": "Muito Forte",
      "block": 2
    },
    {
      "min": 165,
      "max": 204,
      "mod": "+2d6",
      "load": "110kg",
      "push": "440kg",
      "body": 3,
      "label": "Sobrehumano",
      "block": 3
    }
  ],
  "skills": [
    {
      "name": "Arremessar",
      "base": 20,
      "description": "Testes de lançar armas de arremesso, pedras, dardos etc."
    },
    {
      "name": "Arte/Ofício",
      "base": 5,
      "description": "Pintura, escultura, ferreiro, carpintaria."
    },
    {
      "name": "Atletismo",
      "base": 20,
      "description": "Acrobacia, Saltar e Natação."
    },
    {
      "name": "Atuação",
      "base": 5,
      "description": "Teatro, declamação, fingir papéis."
    },
    {
      "name": "Avaliação",
      "base": 5,
      "description": "Determinar valor de objetos."
    },
    {
      "name": "Blefar",
      "base": 5,
      "description": "Mentiras convincentes, forjar histórias. (mentir diretamente.)"
    },
    {
      "name": "Cavalgar",
      "base": 5,
      "description": "Conduzir montarias."
    },
    {
      "name": "Charme",
      "base": 5,
      "description": "Encantar pessoas, causar boa impressão. (atrair; apelo"
    },
    {
      "name": "Contabilidade",
      "base": 5,
      "description": "Matemática aplicada, finanças."
    },
    {
      "name": "Diplomacia",
      "base": 5,
      "description": "Negociações formais, política, etiqueta. (convencer em"
    },
    {
      "name": "Direito",
      "base": 1,
      "description": "Leis, jurisprudência, contratos."
    },
    {
      "name": "Disfarce",
      "base": 1,
      "description": "Alterar aparência, sotaque, postura."
    },
    {
      "name": "Encontrar",
      "base": 25,
      "description": "Procurar objetos ocultos, perceber detalhes."
    },
    {
      "name": "Escutar",
      "base": 20,
      "description": "Ouvir sons distantes, conversas baixas."
    },
    {
      "name": "Esquivar",
      "base": "Meia DES",
      "description": "Reação corporal para evitar ataques ou projéteis. (Metade"
    },
    {
      "name": "Furtividade",
      "base": 20,
      "description": "Se mover silenciosamente, esconder-se."
    },
    {
      "name": "História",
      "base": 5,
      "description": "Conhecimentos do passado, lendas."
    },
    {
      "name": "Intimidação",
      "base": 15,
      "description": "Coagir através de força, ameaça ou postura."
    },
    {
      "name": "Intuição",
      "base": 5,
      "description": "Perceber emoções e intenções ocultas."
    },
    {
      "name": "Lábia",
      "base": 5,
      "description": "Convencer com rapidez, enganar superficialmente. (enrolar; apelo"
    },
    {
      "name": "Lidar com Animais",
      "base": 5,
      "description": "Treinar, acalmar, comandar."
    },
    {
      "name": "Lutar (Armas Curtas)",
      "base": 1,
      "description": "Espadas curtas, longas, sabres."
    },
    {
      "name": "Lutar (Armas de Arremesso)",
      "base": 1,
      "description": "Arcos, bestas e similares."
    },
    {
      "name": "Lutar (Armas de Haste)",
      "base": 1,
      "description": "Lanças, alabardas, glaives."
    },
    {
      "name": "Lutar (Armas Longas)",
      "base": 1,
      "description": "Machados de guerra, de arremesso."
    },
    {
      "name": "Lutar (Brigar)",
      "base": 25,
      "description": "Combate desarmado."
    },
    {
      "name": "Lutar (Culturais)",
      "base": 15,
      "description": "Arma especial de sua própria cultura, ex: Kopesh; Arco"
    },
    {
      "name": "Medicina",
      "base": 1,
      "description": "Anatomia, primeiros socorros."
    },
    {
      "name": "Natureza",
      "base": 10,
      "description": "Animais, plantas, climas."
    },
    {
      "name": "Navegação",
      "base": 10,
      "description": "Uso de estrelas, mapas, bússolas."
    },
    {
      "name": "Persuasão",
      "base": 10,
      "description": "Convencer com argumentação sólida. (Convencer; apelo"
    },
    {
      "name": "Prestidigitação",
      "base": 10,
      "description": "Trapaças manuais, pequenos truques."
    },
    {
      "name": "Rastrear",
      "base": 10,
      "description": "Seguir rastros, identificar pegadas."
    },
    {
      "name": "Religião",
      "base": 15,
      "description": "Deuses, ritos, fé."
    },
    {
      "name": "Sobrevivência",
      "base": 10,
      "description": "Caça, fogueira, abrigo."
    },
    {
      "name": "Tática",
      "base": 1,
      "description": "Estratégia de guerra e manobras."
    },
    {
      "name": "Percepção",
      "base": 15,
      "description": "Perceber detalhes, fluxos de energia, auras e manifestações mágicas."
    }
  ],
  "backgrounds": {
    "family": [
      {
        "id": "ferreiro-familiar",
        "name": "Ferreiro Familiar",
        "description": "Sua família forjava armas e armaduras, ensinando-lhe a arte da metalurgia.",
        "bonusText": "+5 em Arte/Ofício, +5 em Avaliação.",
        "bonuses": [
          {
            "skill": "Arte/Ofício",
            "value": 5
          },
          {
            "skill": "Avaliação",
            "value": 5
          }
        ]
      },
      {
        "id": "comerciante-heredit-rio",
        "name": "Comerciante Hereditário",
        "description": "Criado em uma linhagem de mercadores, você aprendeu a negociar e gerir trocas.",
        "bonusText": "+5 em Diplomacia, +5 em Contabilidade.",
        "bonuses": [
          {
            "skill": "Diplomacia",
            "value": 5
          },
          {
            "skill": "Contabilidade",
            "value": 5
          }
        ]
      },
      {
        "id": "ca-ador-ancestral",
        "name": "Caçador Ancestral",
        "description": "Sua linhagem viveu da caça, passando técnicas de rastreamento.",
        "bonusText": "+5 em Rastrear, +5 em Sobrevivência.",
        "bonuses": [
          {
            "skill": "Rastrear",
            "value": 5
          },
          {
            "skill": "Sobrevivência",
            "value": 5
          }
        ]
      },
      {
        "id": "m-dico-tradicional",
        "name": "Médico Tradicional",
        "description": "Descendente de curandeiros medievais, você conhece remédios e ervas.",
        "bonusText": "+5 em Medicina, +5 em Natureza.",
        "bonuses": [
          {
            "skill": "Medicina",
            "value": 5
          },
          {
            "skill": "Natureza",
            "value": 5
          }
        ]
      },
      {
        "id": "guarda-familiar",
        "name": "Guarda Familiar",
        "description": "Sua família serviu como protetores locais, treinando-o em combate.",
        "bonusText": "+5 em Lutar (Brigar), +5 em Intimidação.",
        "bonuses": [
          {
            "skill": "Lutar (Brigar)",
            "value": 5
          },
          {
            "skill": "Intimidação",
            "value": 5
          }
        ]
      },
      {
        "id": "agricultor-resiliente",
        "name": "Agricultor Resiliente",
        "description": "Criado em uma família de lavradores, você aprendeu a trabalhar a terra.",
        "bonusText": "+5 em Sobrevivência, +5 em Atletismo.",
        "bonuses": [
          {
            "skill": "Sobrevivência",
            "value": 5
          },
          {
            "skill": "Atletismo",
            "value": 5
          }
        ]
      },
      {
        "id": "escriba-mon-stico",
        "name": "Escriba Monástico",
        "description": "Sua família serviu a uma ordem religiosa, ensinando leitura e escrita.",
        "bonusText": "+5 em História, +5 em Religião.",
        "bonuses": [
          {
            "skill": "História",
            "value": 5
          },
          {
            "skill": "Religião",
            "value": 5
          }
        ]
      },
      {
        "id": "pescador-experiente",
        "name": "Pescador Experiente",
        "description": "Sua família viveu da pesca, ensinando técnicas de navegação e paciência.",
        "bonusText": "+5 em Navegação, +5 em Lidar com Animais.",
        "bonuses": [
          {
            "skill": "Navegação",
            "value": 5
          },
          {
            "skill": "Lidar com Animais",
            "value": 5
          }
        ]
      },
      {
        "id": "lenhador-robusto",
        "name": "Lenhador Robusto",
        "description": "Descendente de lenhadores, você domina o uso de machados e força bruta.",
        "bonusText": "+5 em Lutar (Armas Longas), +5 em Atletismo.",
        "bonuses": [
          {
            "skill": "Lutar (Armas Longas)",
            "value": 5
          },
          {
            "skill": "Atletismo",
            "value": 5
          }
        ]
      },
      {
        "id": "tecel-o-habilidoso",
        "name": "Tecelão Habilidoso",
        "description": "Sua família produzia tecidos e roupas, ensinando artesanato detalhado.",
        "bonusText": "+5 em Arte/Ofício, +5 em Prestidigitação.",
        "bonuses": [
          {
            "skill": "Arte/Ofício",
            "value": 5
          },
          {
            "skill": "Prestidigitação",
            "value": 5
          }
        ]
      },
      {
        "id": "mensageiro-gil",
        "name": "Mensageiro Ágil",
        "description": "Sua família trabalhou como correios ou emissários, valorizando velocidade.",
        "bonusText": "+5 em Furtividade, +5 em Esquivar.",
        "bonuses": [
          {
            "skill": "Furtividade",
            "value": 5
          },
          {
            "skill": "Esquivar",
            "value": 5
          }
        ]
      },
      {
        "id": "construtor-de-fortalezas",
        "name": "Construtor de Fortalezas",
        "description": "Criado por uma família de pedreiros, você entende construção e defesa.",
        "bonusText": "+5 em Atletismo, +5 em Tática.",
        "bonuses": [
          {
            "skill": "Atletismo",
            "value": 5
          },
          {
            "skill": "Tática",
            "value": 5
          }
        ]
      }
    ],
    "personal": [
      {
        "id": "artista-errante",
        "name": "Artista Errante",
        "description": "Viajou como trovador ou bardo, encantando vilarejos medievais.",
        "bonusText": "+5 em Atuação, +5 em Charme, +5 em História.",
        "bonuses": [
          {
            "skill": "Atuação",
            "value": 5
          },
          {
            "skill": "Charme",
            "value": 5
          },
          {
            "skill": "História",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Alegre e expressivo, sempre cantando ou contando histórias.",
            "Reservado, preferindo performances silenciosas e reflexivas.",
            "Exuberante, buscando atenção em todas as ocasiões.",
            "Melancólico, usando a arte para expressar dores passadas.",
            "Ingenioso, criando improvisos em qualquer situação.",
            "Carismático, conquistando todos com um sorriso."
          ],
          "ideals": [
            "Inspirar os outros com beleza e emoção.",
            "Preservar as tradições culturais através da arte.",
            "Ganhar fama e reconhecimento eterno.",
            "Ensinar lições morais por meio de histórias.",
            "Levar alegria a vilarejos sofridos.",
            "Criar obras que desafiem as normas."
          ],
          "bonds": [
            "Uma plateia fiel que o admira em uma taverna.",
            "Um mestre que o ensinou, agora desaparecido.",
            "Uma canção que carrega um segredo familiar.",
            "Um rival artístico que o desafia constantemente.",
            "Uma vila que o acolheu após uma performance.",
            "Um instrumento herdado de um parente falecido."
          ],
          "flaws": [
            "Vaidoso, sempre buscando aplausos.",
            "Inseguro, duvidando de seu próprio talento.",
            "Impaciente com audiências desinteressadas.",
            "Dependente de aprovação alheia.",
            "Exagera histórias para impressionar.",
            "Despreza quem não aprecia arte."
          ]
        }
      },
      {
        "id": "criminoso-arrependido",
        "name": "Criminoso Arrependido",
        "description": "Viveu como ladrão ou bandido, buscando redenção após crimes.",
        "bonusText": "+5 em Furtividade, +5 em Blefar, +5 em Prestidigitação.",
        "bonuses": [
          {
            "skill": "Furtividade",
            "value": 5
          },
          {
            "skill": "Blefar",
            "value": 5
          },
          {
            "skill": "Prestidigitação",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Reservado e desconfiado, evitando contatos.",
            "Sarcástico, usando humor para mascarar o passado.",
            "Astuto, sempre planejando saídas.",
            "Arrependido, carregando culpa em silêncio.",
            "Corajoso, enfrentando perigos sem hesitar.",
            "Misterioso, revelando pouco de si."
          ],
          "ideals": [
            "Provar seu valor com atos de redenção.",
            "Deixar o crime para trás e viver honestamente.",
            "Proteger os fracos de predadores como ele foi.",
            "Compensar os erros do passado com sacrifícios.",
            "Buscar perdão de uma divindade ou comunidade.",
            "Usar habilidades criminosas para o bem."
          ],
          "bonds": [
            "Um antigo parceiro criminoso que o traiu.",
            "Uma vítima que perdoou seus crimes.",
            "Uma guilda que ainda o persegue.",
            "Uma família que ignora seu passado sombrio.",
            "Um objeto roubado que carrega remorso.",
            "Um mentor que o ensinou a roubar."
          ],
          "flaws": [
            "Tentado por ganhos fáceis e ilícitos.",
            "Dificuldade em confiar em outros.",
            "Impulsivo, agindo sem pensar nas consequências.",
            "Assombrado por pesadelos do passado.",
            "Orgulhoso de habilidades que deveria abandonar.",
            "Medo de ser descoberto."
          ]
        }
      },
      {
        "id": "soldado-honor-vel",
        "name": "Soldado Honorável",
        "description": "Serviu como mercenário ou cavaleiro, aprendendo tática e disciplina.",
        "bonusText": "+5 em Tática, +5 em Atletismo, +5 em Intimidação.",
        "bonuses": [
          {
            "skill": "Tática",
            "value": 5
          },
          {
            "skill": "Atletismo",
            "value": 5
          },
          {
            "skill": "Intimidação",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Leal e direto, sempre cumprindo ordens.",
            "Corajoso, enfrentando perigos sem recuar.",
            "Sério, focado em dever e disciplina.",
            "Protetor, colocando outros antes de si.",
            "Estrategista, analisando cada batalha.",
            "Orgulhoso, exibindo cicatrizes de guerra."
          ],
          "ideals": [
            "Proteger os fracos e inocentes.",
            "Seguir um código de honra pessoal.",
            "Servir a um senhor ou causa maior.",
            "Trazer ordem ao caos da guerra.",
            "Ganhar glória em combate.",
            "Ensinar disciplina a novos guerreiros."
          ],
          "bonds": [
            "Um companheiro de armas que salvou sua vida.",
            "Um comandante que o treinou rigorosamente.",
            "Uma vila que defendeu em batalha.",
            "Uma arma herdada de um mentor.",
            "Uma promessa de vingança contra um inimigo.",
            "Uma família que espera seu retorno."
          ],
          "flaws": [
            "Rígido com regras, mesmo em situações flexíveis.",
            "Impaciente com covardes ou desertores.",
            "Assombrado por uma derrota passada.",
            "Orgulhoso demais para pedir ajuda.",
            "Cínico, vendo guerra em tudo.",
            "Violento em momentos de tensão."
          ]
        }
      },
      {
        "id": "s-bio-errante",
        "name": "Sábio Errante",
        "description": "Estudou em mosteiros ou cortes, buscando conhecimento profundo.",
        "bonusText": "+5 em História, +5 em Religião, +5 em Intuição.",
        "bonuses": [
          {
            "skill": "História",
            "value": 5
          },
          {
            "skill": "Religião",
            "value": 5
          },
          {
            "skill": "Intuição",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Curioso, sempre buscando novos conhecimentos.",
            "Reflexivo, meditando sobre o mundo.",
            "Paciente, ensinando com calma.",
            "Distante, perdido em pensamentos.",
            "Erudito, citando textos antigos.",
            "Introspectivo, questionando suas crenças."
          ],
          "ideals": [
            "Desvendar mistérios ocultos do mundo.",
            "Preservar o conhecimento para as gerações.",
            "Usar sabedoria para guiar os outros.",
            "Descobrir a verdade sobre divindades.",
            "Superar os limites do entendimento humano.",
            "Compartilhar aprendizado com os humildes."
          ],
          "bonds": [
            "Um mentor perdido em uma busca.",
            "Um tomo raro que ainda estuda.",
            "Uma biblioteca que o acolheu.",
            "Um discípulo que o traiu.",
            "Uma profecia que busca decifrar.",
            "Uma vila que depende de seu saber."
          ],
          "flaws": [
            "Obsessivo por respostas, ignorando perigos.",
            "Presunçoso, menosprezando os ignorantes.",
            "Distraindo-se com detalhes triviais.",
            "Relutante em agir sem certeza.",
            "Secretista, guardando conhecimento.",
            "Cético, rejeitando crenças alheias."
          ]
        }
      },
      {
        "id": "nobre-ca-do",
        "name": "Nobre Caído",
        "description": "Pertencia a uma casa feudal, mas perdeu status e influência.",
        "bonusText": "+5 em Diplomacia, +5 em Persuasão, +5 em História.",
        "bonuses": [
          {
            "skill": "Diplomacia",
            "value": 5
          },
          {
            "skill": "Persuasão",
            "value": 5
          },
          {
            "skill": "História",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Orgulhoso, mantendo a postura de nobreza.",
            "Eloquentemente, falando com graça.",
            "Melancólico, lamentando a perda de status.",
            "Astuto, usando influência remanescente.",
            "Autoridade, comandando mesmo sem poder.",
            "Reservado, escondendo sua origem."
          ],
          "ideals": [
            "Restaurar a honra e o nome da família.",
            "Provar que merece o título perdido.",
            "Governar com justiça, se possível.",
            "Vingar a queda de sua casa.",
            "Ganhar riqueza para recuperar status.",
            "Apoiar os desfavorecidos como ele."
          ],
          "bonds": [
            "Uma herança perdida que busca recuperar.",
            "Um servo leal que o acompanha.",
            "Uma rivalidade com outra casa nobre.",
            "Um castelo em ruínas que era seu lar.",
            "Uma promessa a um parente falecido.",
            "Um aliado que o traiu na queda."
          ],
          "flaws": [
            "Desprezo por inferiores ou plebeus.",
            "Orgulho excessivo, recusando ajuda.",
            "Nostalgia, vivendo no passado.",
            "Ganancioso, buscando status a qualquer custo.",
            "Manipulador, usando outros para subir.",
            "Medo de perder mais do que já perdeu."
          ]
        }
      },
      {
        "id": "peregrino-devoto",
        "name": "Peregrino Devoto",
        "description": "Viajou em peregrinação, fortalecendo espírito e resistência.",
        "bonusText": "+5 em Religião, +5 em Sobrevivência, +5 em Atletismo.",
        "bonuses": [
          {
            "skill": "Religião",
            "value": 5
          },
          {
            "skill": "Sobrevivência",
            "value": 5
          },
          {
            "skill": "Atletismo",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Piedoso, orando em todos os momentos.",
            "Determinado, enfrentando qualquer jornada.",
            "Humilde, servindo aos outros.",
            "Sereno, encontrando paz interior.",
            "Zeloso, defendendo sua fé.",
            "Resiliente, suportando provações."
          ],
          "ideals": [
            "Buscar a iluminação através da peregrinação.",
            "Espalhar a palavra de sua divindade.",
            "Provar sua devoção com sacrifícios.",
            "Ajudar peregrinos em suas jornadas.",
            "Encontrar um relicário sagrado.",
            "Purificar o mundo de pecados."
          ],
          "bonds": [
            "Um santuário sagrado que visita regularmente.",
            "Um guia espiritual que o inspirou.",
            "Uma relíquia que carrega consigo.",
            "Uma comunidade que depende de suas orações.",
            "Um inimigo que desafia sua fé.",
            "Uma promessa de redenção pessoal."
          ],
          "flaws": [
            "Intolerante com descrentes ou hereges.",
            "Fanático, forçando crenças aos outros.",
            "Vulnerável a dúvidas espirituais.",
            "Dependente de rituais para segurança.",
            "Julgador, condenando pecados alheios.",
            "Exausto por jornadas intermináveis."
          ]
        }
      },
      {
        "id": "servo-leal",
        "name": "Servo Leal",
        "description": "Trabalhou como criado ou escudeiro, aprendendo serviço e combate.",
        "bonusText": "+5 em Diplomacia, +5 em Lutar (Brigar), +5 em Cavalgar.",
        "bonuses": [
          {
            "skill": "Diplomacia",
            "value": 5
          },
          {
            "skill": "Lutar (Brigar)",
            "value": 5
          },
          {
            "skill": "Cavalgar",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Humilde, colocando outros em primeiro.",
            "Obediente, seguindo ordens sem questionar.",
            "Leal, defendendo seu mestre a qualquer custo.",
            "Pragmático, resolvendo problemas práticos.",
            "Discreto, evitando atenção.",
            "Respeitoso, honrando tradições de serviço."
          ],
          "ideals": [
            "Servir com honra e dedicação.",
            "Proteger seu senhor ou casa.",
            "Ganhar liberdade através de serviço.",
            "Aprender com os poderosos que serve.",
            "Criar um legado de lealdade.",
            "Apoiar os fracos como foi apoiado."
          ],
          "bonds": [
            "Um senhor feudal que o treinou.",
            "Uma família que o acolheu como servo.",
            "Um juramento de proteção a alguém.",
            "Um objeto dado por um mestre.",
            "Um rival que inveja seu serviço.",
            "Uma promessa de ascensão social."
          ],
          "flaws": [
            "Submisso demais, ignorando seus desejos.",
            "Cínico com a nobreza que serve.",
            "Inseguro sobre sua própria capacidade.",
            "Ressentido por falta de reconhecimento.",
            "Leal até o erro, mesmo contra a razão.",
            "Medo de falhar com quem depende dele."
          ]
        }
      },
      {
        "id": "mercador-aventureiro",
        "name": "Mercador Aventureiro",
        "description": "Viajou como comerciante, lidando com trocas e riscos.",
        "bonusText": "+5 em Contabilidade, +5 em Diplomacia, +5 em Persuasão.",
        "bonuses": [
          {
            "skill": "Contabilidade",
            "value": 5
          },
          {
            "skill": "Diplomacia",
            "value": 5
          },
          {
            "skill": "Persuasão",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Astuto, sempre negociando vantagens.",
            "Amigável, conquistando clientes.",
            "Ambicioso, focado em lucros.",
            "Pragmático, resolvendo problemas com trocas.",
            "Charlatão, exagerando produtos.",
            "Confiante, liderando negociações."
          ],
          "ideals": [
            "Acumular riqueza para segurança.",
            "Conectar povos através do comércio.",
            "Ganhar respeito como negociante.",
            "Explorar novas rotas comerciais.",
            "Ajudar comunidades com bens.",
            "Criar um império mercantil."
          ],
          "bonds": [
            "Uma caravana perdida que liderava.",
            "Um parceiro comercial traidor.",
            "Uma cidade que depende de suas rotas.",
            "Um item raro que comercializa.",
            "Uma família que financia seus negócios.",
            "Um rival que disputa mercados."
          ],
          "flaws": [
            "Ganancioso, priorizando lucro sobre ética.",
            "Desconfiado, questionando todos os acordos.",
            "Impaciente com negociações lentas.",
            "Arrogante, menosprezando pequenos comerciantes.",
            "Corrupto, aceitando subornos.",
            "Medo de falir completamente."
          ]
        }
      },
      {
        "id": "ferreiro-errante",
        "name": "Ferreiro Errante",
        "description": "Aprendeu a forjar armas em jornadas, aprimorando sua arte.",
        "bonusText": "+5 em Arte/Ofício, +5 em Avaliação, +5 em Atletismo.",
        "bonuses": [
          {
            "skill": "Arte/Ofício",
            "value": 5
          },
          {
            "skill": "Avaliação",
            "value": 5
          },
          {
            "skill": "Atletismo",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Resistente, suportando longas forjas.",
            "Prático, focado em soluções simples.",
            "Orgulhoso, exibindo suas criações.",
            "Calmo, trabalhando com paciência.",
            "Rústico, preferindo ferramentas a palavras.",
            "Inovador, experimentando novas técnicas."
          ],
          "ideals": [
            "Criar obras duradouras para a posteridade.",
            "Perfeiçoar a arte da forja.",
            "Proteger os que usam suas armas.",
            "Ensinar a forja a aprendizes.",
            "Ganhar fama como artesão.",
            "Usar ferro para construir paz."
          ],
          "bonds": [
            "Uma forja ancestral que mantém viva.",
            "Um mestre ferreiro que o treinou.",
            "Uma arma que forjou para um herói.",
            "Uma vila que depende de suas ferramentas.",
            "Um rival que desafia sua habilidade.",
            "Um segredo sobre uma criação lendária."
          ],
          "flaws": [
            "Impaciente com detalhes minuciosos.",
            "Orgulhoso demais de seu trabalho.",
            "Relutante em abandonar projetos falhos.",
            "Intolerante com ferreiros inferiores.",
            "Apegado a ferramentas antigas.",
            "Distraindo-se com novas ideias."
          ]
        }
      },
      {
        "id": "ca-ador-solit-rio",
        "name": "Caçador Solitário",
        "description": "Viveu nas florestas, caçando presas e evitando perigos.",
        "bonusText": "+5 em Rastrear, +5 em Sobrevivência, +5 em Furtividade.",
        "bonuses": [
          {
            "skill": "Rastrear",
            "value": 5
          },
          {
            "skill": "Sobrevivência",
            "value": 5
          },
          {
            "skill": "Furtividade",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Silencioso, movendo-se sem ser notado.",
            "Independente, confiando apenas em si.",
            "Observador, analisando cada detalhe.",
            "Rústico, vivendo como parte da natureza.",
            "Focado, ignorando distrações.",
            "Misterioso, escondendo suas intenções."
          ],
          "ideals": [
            "Proteger a natureza de predadores.",
            "Sobreviver com o mínimo possível.",
            "Caçar para sustentar comunidades.",
            "Dominar as florestas como território.",
            "Vingar a perda de um lar natural.",
            "Encontrar equilíbrio com a vida selvagem."
          ],
          "bonds": [
            "Uma floresta natal que defende.",
            "Um animal que o guia nas caçadas.",
            "Um inimigo que caça em seu território.",
            "Uma tribo que o acolheu.",
            "Um troféu de uma presa lendária.",
            "Um segredo sobre uma floresta amaldiçoada."
          ],
          "flaws": [
            "Dificuldade em confiar em outros.",
            "Intolerante com intrusos em seu domínio.",
            "Obsessivo por caçar presas específicas.",
            "Relutante em deixar a solidão.",
            "Violento com ameaças à natureza.",
            "Desconfiado de civilizações."
          ]
        }
      },
      {
        "id": "curandeiro-de-guerra",
        "name": "Curandeiro de Guerra",
        "description": "Atuou em campos de batalha, salvando vidas com habilidades médicas.",
        "bonusText": "+5 em Medicina, +5 em Intuição, +5 em Esquivar.",
        "bonuses": [
          {
            "skill": "Medicina",
            "value": 5
          },
          {
            "skill": "Intuição",
            "value": 5
          },
          {
            "skill": "Esquivar",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Compassivo, dedicando-se aos feridos.",
            "Alerta, sempre pronto para agir.",
            "Calmo, mantendo a compostura em caos.",
            "Determinados, nunca desistindo de um paciente.",
            "Sério, focado em salvar vidas.",
            "Gentil, confortando os moribundos."
          ],
          "ideals": [
            "Salvar vidas, mesmo ao custo próprio.",
            "Aliviar o sofrimento em batalhas.",
            "Provar que cura supera a guerra.",
            "Ensinar primeiros socorros aos outros.",
            "Honrar um juramento médico.",
            "Reduzir a dor do mundo."
          ],
          "bonds": [
            "Um paciente salvo que o inspira.",
            "Um campo de batalha que marcou sua vida.",
            "Um mentor que o treinou em guerra.",
            "Uma relíquia de cura que carrega.",
            "Uma promessa a um soldado moribundo.",
            "Uma vila que depende de seus cuidados."
          ],
          "flaws": [
            "Sobrecarga emocional por perdas.",
            "Relutante em lutar, mesmo em defesa.",
            "Obsessivo por salvar todos.",
            "Culpado por falhas passadas.",
            "Distraindo-se com pacientes.",
            "Intolerante com violência desnecessária."
          ]
        }
      },
      {
        "id": "bardo-de-taverna",
        "name": "Bardo de Taverna",
        "description": "Cantou em tavernas, aprendendo a entreter e manipular multidões.",
        "bonusText": "+5 em Atuação, +5 em Charme, +5 em Lábia.",
        "bonuses": [
          {
            "skill": "Atuação",
            "value": 5
          },
          {
            "skill": "Charme",
            "value": 5
          },
          {
            "skill": "Lábia",
            "value": 5
          }
        ],
        "tables": {
          "traits": [
            "Carismático, encantando com facilidade.",
            "Astuto, manipulando conversas.",
            "Alegre, trazendo vida às tavernas.",
            "Sarcástico, usando humor afiado.",
            "Misterioso, sugerindo segredos.",
            "Confiante, dominando a atenção."
          ],
          "ideals": [
            "Deixar um legado através de canções.",
            "Entreter para unir as pessoas.",
            "Ganhar fama como mestre do canto.",
            "Revelar verdades em suas histórias.",
            "Ajudar tavernas em dificuldade.",
            "Usar música para influenciar outros."
          ],
          "bonds": [
            "Uma taverna favorita que o acolhe.",
            "Um rival musical que o desafia.",
            "Uma canção que carrega um segredo.",
            "Um público que o idolatra.",
            "Um instrumento dado por um mestre.",
            "Uma promessa a um amigo tavernista."
          ],
          "flaws": [
            "Exagera histórias para impressionar.",
            "Dependente de aplausos para confiança.",
            "Invejoso de outros bardos.",
            "Impulsivo ao improvisar.",
            "Desleixado com promessas feitas.",
            "Manipulador para manter atenção."
          ]
        }
      }
    ]
  },
  "regions": [
    {
      "code": "A",
      "name": "Ilhas Albiônicas",
      "label": "Região A - Ilhas Albiônicas",
      "cultures": [
        {
          "id": "englos",
          "name": "Englos",
          "regionCode": "A",
          "region": "Ilhas Albiônicas",
          "nativeLanguage": "Englia; Nanýmir",
          "description": "Os Englos são um povo orgulhoso das Ilhas Albiônicas, conhecidos por suas crônicas épicas e diplomacia astuta. Guardiões de lendas antigas, habitam castelos de pedra e vilarejos cercados por colinas verdes, sempre atentos às intrigas da corte.",
          "weapon": "Yew Longbow (Arco Longo) - Causa 1d8 perfurante. Ignora 10 CA em alcance médio-alto e longo.",
          "skillBonusesText": "História +10, Diplomacia +5",
          "skillBonuses": [
            {
              "skill": "História",
              "value": 10
            },
            {
              "skill": "Diplomacia",
              "value": 5
            }
          ],
          "ability": "o Herdeiro das Lendas: Vantagem em Intuição para detectar mentiras/intenções. | Contador de Crônicas: Inspira aliados com +10 em 2 perícias sociais.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        },
        {
          "id": "celonios",
          "name": "Celonios",
          "regionCode": "A",
          "region": "Ilhas Albiônicas",
          "nativeLanguage": "Kleos; Anglia",
          "description": "Os Celonios, habitantes das terras altas das Ilhas Albiônicas, são mestres da natureza, vivendo em harmonia com florestas e montanhas. Sua conexão com os espíritos antigos os torna rastreadores inigualáveis.",
          "weapon": "Claymore (Arma Grande) – 1d10 cortante, precisa de duas mãos e causa +2 de dano ao empunhar com duas mãos.",
          "skillBonusesText": "Natureza +10, Rastrear +5",
          "skillBonuses": [
            {
              "skill": "Natureza",
              "value": 10
            },
            {
              "skill": "Rastrear",
              "value": 5
            }
          ],
          "ability": "o Espírito dos Antigos: Vantagens em cenas de perseguição. | Voz da Floresta: Vantagem em sobrevivência, encontrar e escutar.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        },
        {
          "id": "albios",
          "name": "Albios",
          "regionCode": "A",
          "region": "Ilhas Albiônicas",
          "nativeLanguage": "Albio; Anglia",
          "description": "Os Albios, navegadores destemidos das Ilhas Albiônicas, dominam os mares e penhascos com sua coragem. Suas lendas falam de heróis que enfrentam tempestades e monstros marinhos.",
          "weapon": "Shillelagh (Arma Longa) – 1d6 contundente e depois de atacar pode desferir outro golpe com a ponta da arma causando 1d4(3) de dano perfurante. E em extremos causa mais um ataque com a arma.",
          "skillBonusesText": "Navegação +10, Atletismo +5",
          "skillBonuses": [
            {
              "skill": "Navegação",
              "value": 10
            },
            {
              "skill": "Atletismo",
              "value": 5
            }
          ],
          "ability": "o Navegador das Brumas: Vantagem em navegações, também, enquanto a bordo, pode ao gastar a ação bônus, pode se movimentar sem tomar ataque de oportunidade. | Filho das Ilhas: Ignorar Terreno Difícil.",
          "weakness": "Penalidade de -10 em Direito.",
          "weaknessBonuses": [
            {
              "skill": "Direito",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "a-geas-das-brumas-antigas",
          "name": "Geas Das Brumas Antigas",
          "regionCode": "A",
          "region": "Ilhas Albiônicas",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO A - GEAS DAS BRUMAS ANTIGAS Geas é uma sentença mágica curta que pesa sobre uma ação específica do alvo. O Geas não controla a mente do alvo. Ele apenas cria uma consequência mágica caso o alvo viole a sentença. Exemplos de Geas válidos: • “Não atravesse esta linha.” • “Não ataque aquele aliado.” • “Não fuja da minha vista.” • “Não saque essa arma.” • “Não minta nesta resposta.” • “Não vire as costas ao duelo.” Exemplos inválidos: • “Não faça nada.” • “Não lute.” • “Obedeça tudo que eu disser.” • “Morra.” • “Não use nenhuma ação até o fim do combate.” A sentença precisa ser curta, concreta e limitada.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você pronuncia um Geas contra um alvo em até 9m. O alvo pode resistir com POD. Se falhar e quebrar a sentença até o início do seu próximo turno, sofre 1d10 de penalidade no teste relacionado à ação quebrada. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "O Geas também pode prender o deslocamento. Se a sentença envolver movimento, fuga, avanço ou travessia, o alvo perde 3m de movimento ao quebrá-la. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A penalidade aumenta para 2d10. O Geas pode durar 2 turnos, consumindo 1 PM por turno mantido. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao seu Geas quando ele envolver uma área, passagem, círculo de bruma ou limite territorial.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode conjurar o Geas como reação quando uma criatura em até 9m declarar uma ação. Se ela falhar em POD, a sentença se prende àquela ação. Para resistir, agora é necessário um sucesso Sólido.A penalidade aumenta para 3d10 Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "O Geas pode ser fixado em uma área de até 6m de diâmetro. A área se torna terreno difícil para inimigos que tenham falhado na resistência. Dura até 3 turnos. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": 3,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Se o alvo quebrar o Geas, além da penalidade, sofre 2d6 de dano mágico Denso.A penalidade aumenta para 4d10 Caso resista ao Geas, não sofre o dano. Consome 6 PM e 2 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano ao quebrar o Geas aumenta para 2d8. Caso o alvo tenha resistido parcialmente, sofre apenas metade do dano se quebrar a sentença. Consome 6 PM e 3 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano por quebrar o Geas se torna 3d8. Consome 8 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O Geas passa a ser chamado de Geas dos Reis Mortos. Os dados de penalidade se tornam d12, o dano por quebra se torna 4d8, e o usuário recebe +20 em SAB para resistir ou interferir em Mundo através da Densa. Consome 12 PM e 5 PM para manter.",
              "activationCost": 12,
              "maintenanceCost": 5,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "a-fio-de-awen",
          "name": "Fio De Awen",
          "regionCode": "A",
          "region": "Ilhas Albiônicas",
          "baseType": "Fina",
          "regional": true,
          "description": "REGIÃO A - FIO DE AWEN Quando o personagem usa Magia Fina no estilo albiônico e acerta um alvo, além do dano normal da Magia Fina, o alvo fica Marcado pelo Fio até o início do próximo turno do conjurador. Enquanto o alvo estiver Marcado pelo Fio, o conjurador escolhe um dos efeitos abaixo: 1. Rastro da Caçada: O primeiro teste de Rastrear, Encontrar ou Escutar feito contra o alvo marcado recebe +5. 2. Passo da Bruma: Se o alvo marcado se mover pelo menos 3m para se afastar do conjurador, o conjurador pode gastar sua reação para se mover 1,5m na direção dele, sem provocar ataque de oportunidade. 3. Corte da Crônica: Se um aliado atacar o alvo marcado antes do início do próximo turno do conjurador, esse aliado recebe +5 no teste de ataque, mas a marca desaparece depois desse ataque. Apenas um desses efeitos pode ser usado por conjuração. Apenas um alvo pode ser marcado por vez. Se o conjurador marcar outro alvo, a marca anterior desaparece.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você pode imbuir sua arma com Fio de Awen. Ao acertar um ataque corpo a corpo, causa 1d6 de dano mágico cortante. Se acertar, o alvo fica Marcado pelo Fio até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar o Fio de Awen a até 9m, seguindo a regra normal da Magia Fina. O alvo atingido também pode ser Marcado pelo Fio. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "O dano aumenta para 2d6. Quando usar o Passo da Bruma, você pode se mover 3m em vez de 1,5m. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "O bonus do Rastro da Caçada aumenta para +10.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 2d8 de dano. Ao imbuir a arma, dura 4 turnos e lhe dá 4 cargas. Consome 4 PM e 1 PM por turno mantido, cada Carga Consome 1 PM. O Eco pode ser usado normalmente; se o Eco acertar um alvo Marcado pelo Fio, você pode renovar a duração da marca até o início do seu próximo turno.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 4,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Voce pode se Beneficiar do Corte Da Crônica.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 3d8 de dano. O Eco causa 3d6. Enquanto a arma estiver imbuída, você pode manter o mesmo alvo Marcado pelo Fio por até 2 turnos, desde que acerte pelo menos um ataque contra ele nesse período.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Você cria uma arma natural de Magia Fina na mão. No estilo albiônico, essa arma parece uma lâmina, garra, fio, espinho ou arco de bruma (Uma flecha lançada a distância). pode utilizar sua ação bônus para atacar e Causar 3d6 de dano, consome 4 PM e dura a cena.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 4d8 de dano. Enquanto a arma estiver imbuída, o alvo Marcado pelo Fio não se beneficia de bruma, chuva, folhagem leve ou multidão para impedir testes de Rastrear, Encontrar ou Escutar feitos pelo conjurador. Consome 8 PM e 3 PM por turno.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Atacar com a arma natural da Magia Fina é considerado um ataque extra. O dano da arma criada aumenta para 4d6, consome 5 PM e dura a cena. O Eco causa 4d6, consome 3 PM, e pode renovar o Fio mesmo se o alvo tentar fugir, esconder-se ou atravessar terreno difícil.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "B",
      "name": "Frankia",
      "label": "Região B - Frankia",
      "cultures": [
        {
          "id": "frankus",
          "name": "Frankus",
          "regionCode": "B",
          "region": "Frankia",
          "nativeLanguage": "Nenýmir; O'Rivièc",
          "description": "Os Frankus são guerreiros e estrategistas da Frankia, famosos por suas táticas em campos abertos e cargas montadas. Suas cortes são centros de poder, onde a honra e a glória são forjadas em batalha.",
          "weapon": "Espada de Cavalaria Francesa (Espada Longa) – 1d8 cortante, você causa +1d6(4) de dano extra se fazer uma investida montado contra um inimigo.",
          "skillBonusesText": "Tática +10, Cavalgar +5",
          "skillBonuses": [
            {
              "skill": "Tática",
              "value": 10
            },
            {
              "skill": "Cavalgar",
              "value": 5
            }
          ],
          "ability": "o Guerreiro Franko: Ao investir enquanto montado, acerta todos os oponentes na linha. | Comandante de Linha: +10 em tática e +5 em cavalgar, caso esteja montado. (Esse bônus não se soma).",
          "weakness": "Penalidade de -10 em Rastrear.",
          "weaknessBonuses": [
            {
              "skill": "Rastrear",
              "value": -10
            }
          ]
        },
        {
          "id": "lusfrankus",
          "name": "Lusfrankus",
          "regionCode": "B",
          "region": "Frankia",
          "nativeLanguage": "Nanýmir; Do'Rivièr",
          "description": "Os Lusfrankus são diplomatas habilidosos da Frankia, mestres em negociações e intrigas cortesãs. Sua cultura valoriza a eloquência e a persuasão, moldando alianças delicadas.",
          "weapon": "Sabre Ocitano (Arma Curta) – 1d6 cortante e vantagem em jogadas de ataque; Sabre Francônico (Arma Curta) – 1d6 cortante e joga novamente dano baixo (1 ou 2 de dano) em ataques.",
          "skillBonusesText": "Diplomacia +10, Persuasão +5",
          "skillBonuses": [
            {
              "skill": "Diplomacia",
              "value": 10
            },
            {
              "skill": "Persuasão",
              "value": 5
            }
          ],
          "ability": "o Mediador Lusitano: Rerola pericias sociais. | “Eu Conheço um Cara”: Ganha +10 em até 3 perícias sociais ao citar a pessoa que conhece.",
          "weakness": "Penalidade de -10 em Intimidação.",
          "weaknessBonuses": [
            {
              "skill": "Intimidação",
              "value": -10
            }
          ]
        },
        {
          "id": "gallhus",
          "name": "Gallhus",
          "regionCode": "B",
          "region": "Frankia",
          "nativeLanguage": "Do'Rivièr",
          "description": "Os Gallhus, celtas da Frankia, são guerreiros ferozes que brandem lanças com maestria. Sua bravura em combate é lendária, inspirada por tradições tribais e espíritos guerreiros.",
          "weapon": "Gae Bolga (Arma de Haste) – 1d8 perfurante e causa 1d4 sangramento (teste CON para remover o efeito de sangramento).",
          "skillBonusesText": "Lutar (Armas de Haste) +10, Atletismo +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas de Haste)",
              "value": 10
            },
            {
              "skill": "Atletismo",
              "value": 5
            }
          ],
          "ability": "o Fúria Gaul: Vantagem em ataques corpo a corpo. | Espírito Tribal: Ao entrar em Morrendo não fica inconsciente, mas ao fim do combate você recebe Lesão Grave até descanso longo caso não esteja no estado.",
          "weakness": "Penalidade de -10 em Navegação.",
          "weaknessBonuses": [
            {
              "skill": "Navegação",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "b-juramento-de-ferro",
          "name": "Juramento De Ferro",
          "regionCode": "B",
          "region": "Frankia",
          "baseType": "Forte",
          "regional": true,
          "description": "REGIÃO B - JURAMENTO DE FERRO Quando usa Juramento de Ferro, o personagem recebe a CA normal da Magia Forte e também recebe Vigor Efetivo. Ele só pode ser usado em: • testes de FOR para empurrar, derrubar, segurar, resistir a manobras ou sustentar peso em combate; • testes de CON para resistir a impacto, queda, exaustão, sangramento ou ser desmontado; • dano físico causado por uma investida, golpe montado ou golpe corporal pesado. • bloqueio temporário.",
          "levels": [
            {
              "level": 1,
              "text": "Aumenta a CA em +5. Além disso, recebe +5 de Vigor Efetivo. Se estiver montado ou se mover pelo menos 3m em linha reta antes de acertar um ataque corpo a corpo, causa +2 de dano físico no primeiro alvo atingido. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Reduz 1d6 de dano mágico. Enquanto o Juramento estiver ativo, o Vigor Efetivo também pode ser usado como bônus ou reação para não ser derrubado, empurrado ou desmontado. Consome 1 PM para ativar e 1 pm para ativar o efeito do vigor efetivo.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "bonus",
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            },
            {
              "level": 3,
              "text": "Aumenta a CA em +10. O Vigor Efetivo permanece +10. O dano de investida ou golpe montado aumenta para +3. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Reduz 1d6 de dano físico. Se essa redução zerar o dano de um ataque corpo a corpo, o personagem não pode ser movido, derrubado ou desmontado por esse ataque, salvo efeito especial maior.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Aumenta a CA em +15. O Vigor Efetivo permanece em +10. O primeiro ataque corpo a corpo feito após investida, movimento de 3m ou ataque montado causa +4 de dano físico. Consome 3 PM e 1 PM para manter.",
              "activationCost": 3,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Reduz 2d6 de dano mágico e 1d6 de dano físico. Seu deslocamento é aumentado em 3 metros.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Aumenta a CA em +20. O Vigor Efetivo aumenta para +15. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Reduz 2d6 de dano mágico e 2d6 de dano físico. Em investidas o dano aumenta para +5 de dano físico.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N7",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Aumenta a CA em +25. O Vigor Efetivo aumenta para +20. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Aumenta a CA em +30 e reduz todo dano em 10. O Vigor Efetivo permanece +20. Uma vez por rodada, se acertar um ataque corpo a corpo após investida, movimento de 3m ou ataque montado, causa +6 de dano físico. Consome 8 PM e 3 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "b-rompante-da-linha",
          "name": "Rompante Da Linha",
          "regionCode": "B",
          "region": "Frankia",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO B - ROMPANTE DA LINHA Depois que o personagem acerta um ataque corpo a corpo, ele pode gastar sua ação bônus e os PM da Magia Impacto para liberar o Rompante da Linha. A energia explode no ponto de contato: punho, ombro, escudo, cabo da arma, lança, espada, armadura ou impacto da montaria. O ataque da arma causa o dano normal, o Rompante causa o dano da Magia Impacto. Se o personagem estiver montado ou tiver se movido pelo menos 3m em linha reta antes do ataque, o alvo também deve fazer um teste de CON. Se falhar, é empurrado. A partir do nível 6, quando a Magia Impacto poderia afetar a área, o Estilo Franko pode transformar essa área em uma linha de choque. No Manual, a Impacto nível 6 troca o alvo único por uma área e empurra alvos que falhem em CON.",
          "levels": [
            {
              "level": 1,
              "text": "Depois de acertar um ataque físico corpo a corpo, você pode gastar sua ação bônus para liberar o Rompante da Linha. O alvo sofre 1d8 de dano contundente mágico. Se você estava montado ou se moveu pelo menos 3m em linha reta antes do ataque, o alvo faz CON; se falhar, é empurrado 1,5m. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode projetar o Rompante até 9m como ação bônus, sem precisar acertar com arma. Nesse caso, causa apenas o dano da Magia Impacto e não soma dano de arma. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "O dano aumenta para 2d8. Se o Rompante foi usado após investida ou ataque montado, o empurrão aumenta para 3m em falha de CON. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar o ataque e ativar o Rompante, o alvo deve passar em CON ou fica atordoado por 1 turno. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "O dano aumenta para 3d8. Você pode declarar Quebra de Guarda: o alvo sofre -10 no teste de Esquiva contra esse golpe e não recebe benefício de cobertura parcial de escudos, fileiras ou barreiras leves. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode usar o Rompimento de Linha: em vez de atingir um único alvo, libera uma linha de choque de 4,5m. Escolha um alvo principal para sofrer o dano completo; os demais fazem receberão metade do dano, caso passem no teste de CON não serão nem empurrados 3m e nem receberão esse dano. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "O dano aumenta para 4d8. Se o alvo principal for empurrado contra parede, escudo, criatura ou obstáculo, sofre +2 de dano contundente físico. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você pode realizar um Rompante pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Você é empurrado 1,5m sem provocar ataque de oportunidade. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "O dano aumenta para 5d8, ou 5d10 se usado com ação padrão. A linha do Rompimento aumenta para 6m. Consome 10 PM.Se o alvo principal for empurrado contra parede, escudo, criatura ou obstáculo, sofre +4 de dano contundente físico.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON se torna 4,5m, o teste para resistir é dificultado em 20, e se usado com ação padrão os dados se tornam d12. Consome 12 PM..Se o alvo principal for empurrado contra parede, escudo, criatura ou obstáculo, sofre +6 de dano contundente físico.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "C",
      "name": "Marufia",
      "label": "Região C - Marufia",
      "cultures": [
        {
          "id": "nan-mir",
          "name": "Nanýmir",
          "regionCode": "C",
          "region": "Marufia",
          "nativeLanguage": "Nanýmir",
          "description": "Os Nanýmir, coração da região de Marufia, são um povo de lei e ordem, governando ducados com justiça e precisão. Suas florestas e fortalezas abrigam arquitetos de tratados e mestres da contabilidade.",
          "weapon": "Aurk (Arco Longo) - 1d10 perfurante e +10 em Lutar (Culturais); Ensk (Arma de Haste) 1d10 perfurante e ignora 10 CA.",
          "skillBonusesText": "Direito +10, Contabilidade +5",
          "skillBonuses": [
            {
              "skill": "Direito",
              "value": 10
            },
            {
              "skill": "Contabilidade",
              "value": 5
            }
          ],
          "ability": "o Guardião do Ducado: Vantagem em Lutar quando estiver contra outras culturas. | Mestre das Leis: Vantagem em 3 perícias de Inteligência.",
          "weakness": "Penalidade de -10 em Charme.",
          "weaknessBonuses": [
            {
              "skill": "Charme",
              "value": -10
            }
          ]
        },
        {
          "id": "n-rdalir",
          "name": "Nørdalir",
          "regionCode": "C",
          "region": "Marufia",
          "nativeLanguage": "Nanýmir; Nørdic",
          "description": "Os Nørdalir, navegadores do norte de Marufia, enfrentam mares gelados e terras inóspitas com coragem viking. Suas sagas celebram a sobrevivência e a exploração em climas hostis.",
          "weapon": "Machado Dinamarquês (Arma Longa) – 1d8 cortante e +2 dano contra alvos usando escudos. Quando acertar um golpe com extremo, você causa +3 de dano adicional a alvos com escudo.",
          "skillBonusesText": "Sobrevivência +10, Navegação +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Navegação",
              "value": 5
            }
          ],
          "ability": "o No Limite: Reduz um ponto de exaustão. | Guerreiro do Norte: Vantagem em Lutar em Climas Frios e ignora penalidades causadas por esse clima.",
          "weakness": "Penalidade de -10 em Diplomacia.",
          "weaknessBonuses": [
            {
              "skill": "Diplomacia",
              "value": -10
            }
          ]
        },
        {
          "id": "egr-mir",
          "name": "Egrýmir",
          "regionCode": "C",
          "region": "Marufia",
          "nativeLanguage": "Nanýmir",
          "description": "Os Egrýmir são caçadores silenciosos das florestas de Marufia, movendo-se como sombras entre as árvores. Sua ligação com a natureza os torna rastreadores e emboscadores excepcionais. São considerados descendentes dos Midkýmir (Povo da Montanha) e Druvýmir (Povo da Mata).",
          "weapon": "Martelo Lucerne (Arma de Haste) – 1d10 contundente e derruba o alvo com um Extremo; Martelo Egrýmir (Arma Longa) - 1d10 contundente e Ignora 5 de CA.",
          "skillBonusesText": "Furtividade +10, Rastrear +5",
          "skillBonuses": [
            {
              "skill": "Furtividade",
              "value": 10
            },
            {
              "skill": "Rastrear",
              "value": 5
            }
          ],
          "ability": "o Sombra da Floresta: Vantagem de Furtividade fora de construções. | Caçador Silencioso: Vantagem em Armas de Arremesso/Arremessar contra alvos desprevenidos.",
          "weakness": "Penalidade de -10 em Contabilidade.",
          "weaknessBonuses": [
            {
              "skill": "Contabilidade",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "c-edito-do-c-u",
          "name": "Edito Do Céu",
          "regionCode": "C",
          "region": "Marufia",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO C - EDITO DO CÉU O Edito do Céu se projeta em uma grande área. Ao ativar a magia, o usuário afeta todos os Atos Medidos. Atos Medidos afeta: Ataques, contra-ataques, Esquivar, Aparar, Bloquear, Manobras e Comandos.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você projeta o Edito do Céu em uma área de 4m de diâmetro. Alvos afetados resistem com POD. Se falharem, sofrem 1d10 de penalidade em todas as ações ligadas ao Ato Medido até o início do seu próximo turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Alvos que falharam na resistência têm o movimento reduzido em 3m enquanto permanecerem na área do Edito. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A penalidade aumenta para 2d10. O Edito pode ser lançado em cone de 6m ou área de 4m de diâmetro. Dura 2 turnos, consumindo 1 PM por turno mantido. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao Edito.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode usar o Edito como reação quando um alvo declarar uma ação ligada ao Ato Medido escolhido. Se ele falhar em POD, sofre 3d10 de penalidade naquela ação e continua afetado pelo Edito enquanto permanecer na área. O Edito também interfere automaticamente em Mundo: as propriedades do Mundo são suspensas em uma área de 4m de raio até o início do seu próximo turno. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "A área afetada se torna terreno difícil para alvos que falharam na resistência. O cone aumenta para 10m e a área circular aumenta para 8m de diâmetro. O Edito dura 3 turnos. Consome PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": 3,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A penalidade aumenta para 4d10. Uma vez por turno, se um alvo falhar em uma ação por causa do Edito, sofre 2d6 de dano mágico Denso. Consome 6 PM e 2 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano aumenta para 2d8. A interferência em Mundo aumenta para 6m de raio e permanece enquanto o Edito estiver mantido. A área circular do Edito aumenta para 12m de diâmetro e o cone para 18m. Consome 6 PM e 3 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano para 3d8. A interferência em Mundo aumenta para 7,5m de raio. Dentro dessa área, o Mundo perde suas propriedades de dificuldade, bônus, redução de custo e aumento de dados enquanto o Edito estiver mantido. Consome 8 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Os dados de penalidade se tornam d12 e o dano aumenta para 4d8. A interferência em Mundo aumenta para 9m de raio. Dentro dessa área, o Mundo perde suas propriedades principais e suas habilidades únicas enquanto o Edito estiver mantido. Consome 12 PM e 5 PM para manter.",
              "activationCost": 12,
              "maintenanceCost": 5,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "c-rugido-do-fiorde",
          "name": "Rugido Do Fiorde",
          "regionCode": "C",
          "region": "Marufia",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO C - RUGIDO DO FIORDE",
          "levels": [
            {
              "level": 1,
              "text": "Depois de acertar um ataque físico corpo a corpo com machado, arma longa, escudo, punho pé ou cabo de arma, você pode gastar sua ação bônus para causar 1d8 de dano contundente mágico. Se o alvo estiver usando escudo, ele faz CON; se falhar, sofre -2 no próximo Bloqueio ou -5 no próximo Aparar contra você até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Impacto até 9m. Se usada à distância, causa apenas o dano da Impacto; o efeito contra escudo ocorre quando o golpe for transmitido por contato físico, arma, escudo, convés, porta ou superfície rígida. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d8 de dano. Contra alvo usando escudo, se ele falhar em CON, o próximo ataque seu contra ele ignora 5 de CA. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar o Rugido, o alvo faz CON. Se falhar, fica atordoado por 1 turno. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 3d8 de dano. Você pode escolher entre dificultar Esquiva em 10 ou aplicar Quebra-Escudo, fazendo o alvo sofrer -4 no Bloqueio ou -10 em Aparar contra o próximo ataque. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode descarregar o Rugido em uma área curta de 3m de diâmetro. Criaturas escolhidas fazem CON; em falha, são empurradas 1,5m e sofrem metade do dano. Um alvo principal sofre dano completo. Alvos usando escudo também sofrem o efeito de Quebra-Escudo. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 4d8 de dano. Contra alvo usando escudo, se o ataque acertar, causa +2d6 de dano físico. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você realiza um Rugido pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 5d8, ou 5d10 com ação padrão. Contra alvo usando escudo, o efeito de Quebra-Escudo passa a ser -6 no Bloqueio ou -15 em Aparar. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON se torna 4,5m, o teste para resistir é dificultado em 20, e se usar ação padrão os dados se tornam d12. Se o alvo estiver usando escudo comum e falhar em CON, o escudo se quebra. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "c-raiz-da-terra",
          "name": "Raiz Da Terra",
          "regionCode": "C",
          "region": "Marufia",
          "baseType": "Forte",
          "regional": true,
          "description": "REGIÃO C - RAIZ DA TERRA A Raiz da Terra fortalece o corpo do usuário com Energia Forte. O personagem ganha CA, redução de dano, Vigor Efetivo e, nos níveis altos, pode erguer o Escudo da Terra. O Vigor Efetivo desta magia pode ser usado em: testes de FOR; testes de CON; testes de Atletismo; resistir ou realizar Empurrar, Derrubar, Agarrar e Desarmar;",
          "levels": [
            {
              "level": 1,
              "text": "Aumenta sua CA em +5. Você recebe Vigor Efetivo +5. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Reduz 1d6 de dano mágico em você. O Vigor Efetivo pode ser usado em testes físicos de resistência, força corporal e disputa de posição. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Aumenta sua CA em +10. O Vigor Efetivo aumenta para +10. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Reduz 1d6 de dano físico em você. Se essa redução zerar o dano de um ataque corpo a corpo, você permanece firme contra empurrão, queda ou deslocamento causado por esse ataque.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Aumenta sua CA em +15. O Vigor Efetivo aumenta para +15. Se estiver usando, arma contundente, arma de haste ou arma cultural Egrýmir, o primeiro teste para Derrubar feito por você na rodada recebe +10. Consome 3 PM e 1 PM para manter.",
              "activationCost": 3,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Reduz 2d6 de dano mágico e 1d6 de dano físico em você. Uma vez por rodada, se vencer uma disputa física usando Vigor Efetivo, pode se mover 3m sem provocar ataque de oportunidade do alvo envolvido na disputa. Consome 3 PM e 1 PM para manter.",
              "activationCost": 3,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Aumenta sua CA em +20. O Vigor Efetivo aumenta para +20. Se você acertar um alvo com martelo, arma contundente, arma de haste ou arma cultural Egrýmir depois de usar Vigor Efetivo na rodada, o alvo sofre -10 para resistir a Derrubar até o início do próximo turno dele. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Reduz 2d6 de dano mágico e 2d6 de dano físico em você. Você pode erguer o Escudo da Terra, uma barreira mágica compactada de 3m, que concede cobertura total a quem estiver atrás dela. O Escudo tem 15+4d8 PV. Criar o Escudo exige ação de movimento. O efeito principal consome 4 PM e PM para manter; o Escudo consome 6 PM e 3 PM para manter.",
              "activationCost": 4,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "movement"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            },
            {
              "level": 9,
              "text": "Aumenta sua CA em +25. O Vigor Efetivo aumenta para +25. Uma vez por rodada, se você derrubar um alvo com martelo, arma contundente, arma de haste ou arma cultural Egrýmir, seu próximo teste de contra esse alvo ou grupo recebe +20 até o fim da cena. Consome 6 PM e 1 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Aumenta sua CA em +30 e reduz todo dano sofrido por você em 10. O Vigor Efetivo permanece +25. O Escudo da Terra pode ter até 6m e 20+6d8 PV. Criar o Escudo exige ação de movimento. O efeito principal consome 8 PM e 3 PM para manter; o Escudo consome 10 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "movement"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "D",
      "name": "Slawia Ocidental",
      "label": "Região D - Slawia Ocidental",
      "cultures": [
        {
          "id": "slawios",
          "name": "Slawios",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Slowia",
          "description": "Os Slawios são guardiões das tradições do Grande Principado de Rodenia, preservando mitos e profecias em sagas orais. Sua devoção à religião e à história os torna sábios conselheiros.",
          "weapon": "Machado Eslavo (Arma Longa) – 1d8 cortante e em Extremo pode atacar novamente.",
          "skillBonusesText": "História +10, Religião +5",
          "skillBonuses": [
            {
              "skill": "História",
              "value": 10
            },
            {
              "skill": "Religião",
              "value": 5
            }
          ],
          "ability": "o Cronista Eslavo: Vantagem em Intuição. | Guardião das Tradições: +10 em resistência em SAB para aliados.",
          "weakness": "Penalidade de -10 em Navegação.",
          "weaknessBonuses": [
            {
              "skill": "Navegação",
              "value": -10
            }
          ]
        },
        {
          "id": "slabe-s",
          "name": "Slabeĉs",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Slowia",
          "description": "Os Slabeĉs são guerreiros robustos de Rodenia, cuja força e intimidação ecoam nas estepes. Suas espadas longas são temidas em formações de batalha.",
          "weapon": "Espada Eslava (Arma Curta) – 1d6 cortante e se estiver empunhando um escudo recebe +2 de CA.",
          "skillBonusesText": "Lutar (Armas Longas) +10, Atletismo +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas Longas)",
              "value": 10
            },
            {
              "skill": "Atletismo",
              "value": 5
            }
          ],
          "ability": "o Guerreiro Slabeĉ: Vantagem em Intimidação contra inimigos. | Fúria do Herdada: +2 dano em Armas Curtas/Longa e +3 dano em Formações Básicas.",
          "weakness": "Penalidade de -10 em Disfarce.",
          "weaknessBonuses": [
            {
              "skill": "Disfarce",
              "value": -10
            }
          ]
        },
        {
          "id": "sloprumios",
          "name": "Sloprumios",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Slowia; Kardish",
          "description": "Os Sloprumios são estrategistas de Rodenia, liderando hordas com precisão tática. Sua habilidade em combates campais os torna indispensáveis em guerras regionais.",
          "weapon": "Lança Eslava (Arma de Haste) – 1d8 perfurante e +10 de Iniciativa.",
          "skillBonusesText": "Tática +10, Cavalgar +5",
          "skillBonuses": [
            {
              "skill": "Tática",
              "value": 10
            },
            {
              "skill": "Cavalgar",
              "value": 5
            }
          ],
          "ability": "o Estratégia Sloprum: Vantagens em teste de Tática. | Líder de Horda: +10 em Atletismo para aliados em combate.",
          "weakness": "Penalidade de -10 em Persuasão.",
          "weaknessBonuses": [
            {
              "skill": "Persuasão",
              "value": -10
            }
          ]
        },
        {
          "id": "slomios",
          "name": "Slomios",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Slowia; Kardish",
          "description": "Os Slomios vivem em harmonia com a fauna de Rodenia, caçando e domesticando animais selvagens. Suas habilidades de sobrevivência os sustentam nas florestas densas.",
          "weapon": "Arco Eslavo (Arco Composto) – 1d8+1 perfurante e ignora 10 de CA.",
          "skillBonusesText": "Sobrevivência +10, Lidar com Animais +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Lidar com Animais",
              "value": 5
            }
          ],
          "ability": "o Caçador Slomio: Vantagem ao caçar um alvo. | Vínculo Selvagem: Acalma animal selvagem sem teste.",
          "weakness": "Penalidade de -10 em Diplomacia.",
          "weaknessBonuses": [
            {
              "skill": "Diplomacia",
              "value": -10
            }
          ]
        },
        {
          "id": "kzerios",
          "name": "Kzerios",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Kardish",
          "description": "Os Kzerios são arqueiros nômades das hordas, movendo-se como o vento pelas estepes. Seus arcos recurvos e montarias rápidas os tornam mestres de ataques à distância.",
          "weapon": "Arco Kazak (Arco Composto) – 1d8+1 perfurante; +5 em Lutar (Culturais) montado.",
          "skillBonusesText": "Cavalgar +10, Lutar (Armas de Arremesso) +5",
          "skillBonuses": [
            {
              "skill": "Cavalgar",
              "value": 10
            },
            {
              "skill": "Lutar (Armas de Arremesso)",
              "value": 5
            }
          ],
          "ability": "o Cavaleiro Kzerio: Vantagem em Armas de Arremesso/Cultural montado. | Arqueiro Nômade: Dispara flecha extra sem penalidade.",
          "weakness": "Desvantagem em Atletismo para escalar montanhas.",
          "weaknessBonuses": []
        },
        {
          "id": "kossarios",
          "name": "Kossarios",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Kardish",
          "description": "Os Kossarios são sentinelas das estepes, com ouvidos atentos e olhos afiados. Seus sabres rápidos e habilidades de navegação os tornam exploradores temidos.",
          "weapon": "Shashka Cossaca (Arma Curta) – 1d6 cortante; +2 dano em ataque montado.",
          "skillBonusesText": "Navegação +10, Escutar +5",
          "skillBonuses": [
            {
              "skill": "Navegação",
              "value": 10
            },
            {
              "skill": "Escutar",
              "value": 5
            }
          ],
          "ability": "o Vigia Kossario: Detecta armadilha/inimigo oculto em raio de 6m. | Sentinela das Estepes: Caso tenha se movimentado totalmente nesse round, recebe +5 em Ataques e +2 de dano.",
          "weakness": "Penalidade de -10 em Medicina.",
          "weaknessBonuses": [
            {
              "skill": "Medicina",
              "value": -10
            }
          ]
        },
        {
          "id": "v-lgaros",
          "name": "Vúlgaros",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Svaria",
          "description": "Os Vúlgaros são diplomatas tribais, unindo clãs com sabedoria e acordos. Suas habilidades em leis e negociações mantêm a paz nas terras de Rodenia.",
          "weapon": "Sabre Búlgaro (Arma Curta) – 1d6 cortante; ignora 5 CA.",
          "skillBonusesText": "Direito +10, Diplomacia +5",
          "skillBonuses": [
            {
              "skill": "Direito",
              "value": 10
            },
            {
              "skill": "Diplomacia",
              "value": 5
            }
          ],
          "ability": "o Diplomata Vúlgaro: Vantagem em 3 perícias sociais. | Medidas Drásticas: Ao entrar em um combate contra sua vontade, ganha +3 de dano.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        },
        {
          "id": "bosgaros",
          "name": "Bosgaros",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "nativeLanguage": "Svaria",
          "description": "Os Bosgaros são guerreiros ágeis, conhecidos por sua destreza com armas curtas. Sua cultura valoriza a velocidade e a precisão em combates corpo a corpo.",
          "weapon": "Machado Svarozub (Arma Curta) – 1d6 cortante e pode ser arremessado (alcance médio) dando mais 1d4 de dano; Machado Kamensek (Arma Curta) - 1d6 cortante e ao utilizar esses 2 machados ao mesmo tempo poderá, sem gastar sua ação bônus, atacar com ambas as armas, se utilizar escudos ou armaduras pesadas esse Bônus será neutralizado.",
          "skillBonusesText": "Lutar (Armas Curtas) +10, Esquivar +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas Curtas)",
              "value": 10
            },
            {
              "skill": "Esquivar",
              "value": 5
            }
          ],
          "ability": "o Lutador Bosgaro: Reação extra para Esquivar em um turno. | Guerreiro Duro: +3 dano com arma curta.",
          "weakness": "Penalidade de -10 em História.",
          "weaknessBonuses": [
            {
              "skill": "História",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "d-corte-do-vento-errante",
          "name": "Corte Do Vento Errante",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "baseType": "Fina",
          "regional": true,
          "description": "REGIÃO D - CORTE DO VENTO ERRANTE Passo do Vento: se acertar um ataque com Magia Fina o usuário pode se mover de 2 a 6 m sem provocar ataque de oportunidade do alvo atingido.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você imbui sua arma com Energia Fina, causando 1d6 de dano cortante mágico. Se tiver realizado Deslocamento Total neste round e acertar o ataque, pode usar Passo do Vento, movendo-se 2m sem provocar ataque de oportunidade do alvo atingido. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Fina até 9m. Se tiver realizado Deslocamento Total, pode usar o Passo do Vento antes ou depois do lançamento. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d6 de dano. O Passo do Vento aumenta para 4m. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "—",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 2d8 de dano e a arma pode permanecer imbuída com 4 cargas. Enquanto a arma estiver imbuída, você só pode usar Passo do Vento uma vez por rodada. Consome 4 PM e 1 PM por turno mantido.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "—",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 3d8 de dano. O Eco funciona normalmente; se o Eco acertar depois de Deslocamento Total, ele também pode ativar Passo do Vento, mas ainda respeitando o limite de uma vez por rodada. O passo de vento aumenta para 6m",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Você cria uma arma natural de Magia Fina na mão. No Estilo Slawio, ela toma forma de sabre de vento, machado de ar, garra de estepe ou lâmina de neve. A magia causa 4d8 de dano. Quando usa Passo do Vento, você",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "também recebe +5 no próximo teste de Rastrear, Encontrar ou Encontrar contra o alvo atingido até o fim da cena. Consome 8 PM e 3 PM por turno. A arma natural da Magia Fina funciona como ataque extra. O",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Passo do Vento pode ser usado após esse ataque extra, ainda respeitando o limite de uma vez por rodada.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N9",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "d-vig-lia-dos-cl-s",
          "name": "Vigília Dos Clãs",
          "regionCode": "D",
          "region": "Slawia Ocidental",
          "baseType": "Forte",
          "regional": true,
          "description": "REGIÃO D - VIGÍLIA DOS CLÃS Se estiver em Formação de Vigília, ou seja, está a até 1,5m de um aliado, não realizou Deslocamento Total neste round; está consciente e capaz de reagir; está usando escudo, ou qualquer arma. Podendo usar sua reação para proteger um aliado a até 1,5m. Essa proteção pode ser feita de duas formas: 1. Aparar pelo Clã: Antes do ataque inimigo ser resolvido, o usuário gasta sua reação para dar +5 de CA ao aliado contra aquele ataque. 2. Sofrer com o Clã: Depois que o aliado for atingido, mas antes do dano final ser aplicado, o usuário gasta sua reação para reduzir o dano sofrido pelo aliado em 1d6.",
          "levels": [
            {
              "level": 1,
              "text": "Aumenta sua CA em +5. Você ganha também 1 Carga e recupera a cada turno. Se estiver em Formação de Vigília, pode usar 1 Carga para dar +3 de CA a um aliado da Formação de Vigília. Consome 1 PM e mais 1 PM para ativar a Carga.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Reduz 1d6 de dano mágico em você. Em Formação de Vigília, você ganha a habilidade “Sofrer com o Clã” podendo reduzir 1d6 de dano mágico sofrido por um aliado. Consome 1 PM e mais 1 PM para ativar a Carga.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Aumenta sua CA em +10. O bônus de Aparar pelo Clã aumenta para +5 de CA contra um ataque. Consome 2 PM e mais 1 PM para ativar a Carga.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você consegue reduzir 1d6 de dano físico em você. Em Formação de Vigília, pode usar 1 Carga para reduzir 1d6 de dano físico sofrido por um aliado. Consome 2 PM e mais 2 PM para ativar a Carga.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Aumenta sua CA em +15. Agora você tem 2 Cargas que se recuperam a cada turno. Quando usar Aparar pelo Clã, o aliado recebe +10 de CA contra um ataque. Consome 3 PM e 1 PM para manter e você gasta 2 PM para ativar cada Carga.",
              "activationCost": 3,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Reduz 2d6 (ou 8) de dano mágico e 1d6 de dano físico em você. Ao usar a Sofrer com o Clã, você pode reduzir 1d6+4 de dano mágico de seu aliado. Consome 3 PM e 1 PM para manter e você gasta 2 PM para ativar cada Carga.",
              "activationCost": 3,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Aumenta sua CA em +20. O bônus de Aparar pelo Clã aumenta para +15 de CA. Se você proteger um aliado com Aparar pelo Clã e o ataque errar por causa deste bônus, você recebe +5 no próximo teste de ataque até o fim do seu próximo turno contra esse alvo. Consome 4 PM e 1 PM para manter e você gasta 2 PM para ativar cada Carga.",
              "activationCost": 4,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Reduz 2d6 de dano mágico e 2d6 de dano físico. O bônus de Sofrer pelo Clã aumenta para 1d6+4 de dano físico. Consome PM e 1 PM para manter e você gasta 3 PM para ativar cada Carga.",
              "activationCost": 3,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Aumenta sua CA em +25. O Aparar pelo Clã aumenta para +20 de CA. 6 PM e 1 PM para manter e você gasta 3 PM para ativar cada Carga.",
              "activationCost": 3,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Aumenta sua CA em +30 e reduz todo dano em 10. Agora você tem 3 Cargas por Turno. O Aparar pelo Clã aumenta para +25 e o Sofrer pelo Clã reduz todo dano em 10. Uma vez por rodada, se um aliado em até 3m tiver o PV reduzido a 0 por causa de algum dano, você pode usar sua reação e gastar o valor de ativação da magia (8 PM) para reduzir o dano recebido por ele em 2d8+2. Se isso impedir que ele chegue a 0 PV, ele permanece de pé. Consome 8 PM, 3 PM para manter e 4 PM para ativar cada Carga.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "E",
      "name": "Romanius",
      "label": "Região E - Romanius",
      "cultures": [
        {
          "id": "romanus",
          "name": "Romanus",
          "regionCode": "E",
          "region": "Romanius",
          "nativeLanguage": "Nanýmir",
          "description": "Os Romanus, herdeiros de um império glorioso, são mestres em táticas de formação e história. Suas legiões marcham com disciplina inabalável pelas terras de Romanius.",
          "weapon": "Gládio Romano (Arma Curta) – 1d6 perfurante e vantagem em ataques flanqueados; Pilum Romanum (Arma de Haste) - 1d8 perfurante e pode ser arremessável, caso acerte o arremesso remove 10 de CA, mas fica presa no alvo após isso.",
          "skillBonusesText": "Tática +10, História +5",
          "skillBonuses": [
            {
              "skill": "Tática",
              "value": 10
            },
            {
              "skill": "História",
              "value": 5
            }
          ],
          "ability": "o Legionário Romano: Vantagem em Lutar (Armas Curtas, ou Cultural do mesmo tipo) em formação. | Comandante de Falange: Vantagem em Lutar (Armas de Haste, ou Cultural do mesmo tipo) em Formação.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        },
        {
          "id": "cilicius",
          "name": "Cilicius",
          "regionCode": "E",
          "region": "Romanius",
          "nativeLanguage": "Nanýmir; Grekás; Nanýmir-Grekás",
          "description": "Os Cilicius, mercadores astutos de portos vibrantes, dominam o comércio e a avaliação de riquezas. Suas cidades costeiras são centros de troca e cultura.",
          "weapon": "Stiletto Siciliano (Arma Curta) – 1d4 perfurante, causa 1d4 sangramento e ignora 5 CA em ataque de oportunidade.",
          "skillBonusesText": "Avaliação +10, Contabilidade +5",
          "skillBonuses": [
            {
              "skill": "Avaliação",
              "value": 10
            },
            {
              "skill": "Contabilidade",
              "value": 5
            }
          ],
          "ability": "o Mercador Experiente: Vantagem contra mercadores/vendedores. | Olho para Lucro: Determina valor exato de item sem teste.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        },
        {
          "id": "floreus",
          "name": "Floreus",
          "regionCode": "E",
          "region": "Romanius",
          "nativeLanguage": "Nanýmir",
          "description": "Os Floreus são artistas e escultores de Romanius, criando obras-primas que encantam cortes e templos. Sua paixão pela arte reflete a glória de sua terra.",
          "weapon": "Espada Florentina (Arma Curta) – 1d6 cortante; +5 em Perícias sociais..",
          "skillBonusesText": "Arte/Ofício +10, Atuação +5",
          "skillBonuses": [
            {
              "skill": "Arte/Ofício",
              "value": 10
            },
            {
              "skill": "Atuação",
              "value": 5
            }
          ],
          "ability": "o Artista Floreu: Pode fazer um item improvisado com Arte/Ofício com vantagem. | Vislumbrante: Ao ativar a habilidade, alvos em até 6 metros devem fazer um teste de sabedoria para não ficarem Receosos/chocados, tendo -5 em testes contra | Usuário.",
          "weakness": "Penalidade de -10 em Intimidação.",
          "weaknessBonuses": [
            {
              "skill": "Intimidação",
              "value": -10
            }
          ]
        },
        {
          "id": "florentius",
          "name": "Florentius",
          "regionCode": "E",
          "region": "Romanius",
          "nativeLanguage": "Nanýmir",
          "description": "Os Florentius são curandeiros e herbalistas de Romanius, combinando ciência e natureza para salvar vidas. Suas boticas são famosas por remédios milagrosos.",
          "weapon": "Adaga Florentina (Arma Curta) – 1d4 perfurante e +5 ao Aparar. Um golpe contra um alvo que foi aparado lhe dará +5 de bônus de acerto .",
          "skillBonusesText": "Medicina +10, Natureza +5",
          "skillBonuses": [
            {
              "skill": "Medicina",
              "value": 10
            },
            {
              "skill": "Natureza",
              "value": 5
            }
          ],
          "ability": "o Curandeiro Florentino: Durante uma cena que não seja combate poderá curar 1d6 de vida em 1d4 aliados. | Herbalista Nato: Vantagem em Encontrar e Natureza para plantas medicinais e venenos na natureza.",
          "weakness": "Penalidade de -10 em Cavalgar.",
          "weaknessBonuses": [
            {
              "skill": "Cavalgar",
              "value": -10
            }
          ]
        },
        {
          "id": "romagnus",
          "name": "Romagnus",
          "regionCode": "E",
          "region": "Romanius",
          "nativeLanguage": "Nanýmir",
          "description": "Os Romagnus são oradores e advogados, dominando os tribunais de Romanius com retórica afiada. Sua influência molda as leis e alianças da região.",
          "weapon": "Sabre Romagno (Arma Curta) – 1d6 cortante; +15 em Persuasão.",
          "skillBonusesText": "Direito +10, Persuasão +5",
          "skillBonuses": [
            {
              "skill": "Direito",
              "value": 10
            },
            {
              "skill": "Persuasão",
              "value": 5
            }
          ],
          "ability": "o Advogado Romagno: Vantagem em 3 perícias sociais a escolha. | Orador do Fórum: Inspira audiência com vantagem em Atuação.",
          "weakness": "Penalidade de -10 em Rastrear.",
          "weaknessBonuses": [
            {
              "skill": "Rastrear",
              "value": -10
            }
          ]
        },
        {
          "id": "allemontes",
          "name": "Allemontes",
          "regionCode": "E",
          "region": "Romanius",
          "nativeLanguage": "Nanýmir",
          "description": "Os Allemontes, montanheses de Romanius, escalam picos com facilidade e sobrevivem em terrenos árduos. Suas fortalezas alpinas são inexpugnáveis.",
          "weapon": "Lança Piemontesa (Arma de Haste) – 1d8 perfurante, necessário duas mãos e +5 de dano ao tomar investida ou quando for atacado primeiro no turno.",
          "skillBonusesText": "Atletismo +10, Sobrevivência +5",
          "skillBonuses": [
            {
              "skill": "Atletismo",
              "value": 10
            },
            {
              "skill": "Sobrevivência",
              "value": 5
            }
          ],
          "ability": "o Montanhês Allemont: Ignora terrenos difíceis. | Explorador Alpino: Reduz em um ponto sua Exaustão.",
          "weakness": "Penalidade de -10 em Navegação.",
          "weaknessBonuses": [
            {
              "skill": "Navegação",
              "value": -10
            }
          ]
        },
        {
          "id": "savoius",
          "name": "Savoius",
          "regionCode": "E",
          "region": "Romanius",
          "nativeLanguage": "Nanýmir; Do'Rivièr",
          "description": "Os Savoius são cortesãos astutos, navegando as intrigas de Romanius e Lothar com diplomacia refinada. Sua presença é indispensável em negociações nobres.",
          "weapon": "Espada Savoia (Arma Curta) – 1d6 cortante e quando Aparar você recebe +10 no teste.",
          "skillBonusesText": "Diplomacia +10, Intuição +5",
          "skillBonuses": [
            {
              "skill": "Diplomacia",
              "value": 10
            },
            {
              "skill": "Intuição",
              "value": 5
            }
          ],
          "ability": "o Reserva de Emergência : Pode sacar 2d6(6) ducados. | Cortesão Astuto: Vantagem em negociação de itens Manufaturados.",
          "weakness": "Penalidade de -10 em Lutar (Brigar).",
          "weaknessBonuses": [
            {
              "skill": "Lutar (Brigar)",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "e-linha-do-gl-dio",
          "name": "Linha Do Gládio",
          "regionCode": "E",
          "region": "Romanius",
          "baseType": "Fina",
          "regional": true,
          "description": "REGIÃO E - LINHA DO GLÁDIO Quando o usuário acerta um alvo com Linha do Gládio enquanto estiver em formação, ele pode criar uma Brecha de Coorte. A Brecha de Coorte não é uma marca visível. Ela representa um erro de postura do inimigo: escudo alto demais, pé mal colocado, guarda aberta, perda de ritmo ou reação atrasada. A Brecha dura até o início do próximo turno do usuário ou até ser consumida. O próximo aliado em formação que atacar esse alvo pode consumir a Brecha e receber bônus no ataque. Limites importantes: • o próprio conjurador não pode consumir a Brecha que criou; • só pode existir uma Brecha de Coorte por alvo; • só pode criar uma Brecha por rodada; • a Brecha não aumenta dano; • se dois personagens criarem Brecha no mesmo alvo, vale apenas a maior; • a Brecha só funciona contra aquele alvo específico.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você imbui sua arma com Energia Fina, causando 1d6 de dano cortante mágico. Se estiver em formação e acertar o ataque, cria uma Brecha de Coorte +5 de acerto no alvo. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Fina até 9m. A Brecha continua sendo +5, mas só pode ser criada se o alvo estiver engajado com um aliado seu em formação ou dentro da linha de combate da sua formação. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d6 de dano. A Brecha de Coorte aumenta para +10. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "-",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 2d8 de dano. Ao imbuir, dura 4 turnos. A Brecha de Coorte aumenta para +15. Você ainda só pode criar uma Brecha por rodada. Consome 4 PM e 1 PM por turno mantido.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 4,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "A Brecha permanece +15. Além disso, o alvo sofre -5 em Esquivar contra o ataque que consumir a Brecha. Esse redutor só vale para esse ataque específico.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 3d8 de dano. A Brecha de Coorte permanece +15. Se o aliado consumir a Brecha e acertar o alvo, ele pode se mover até o limite de seu movimento disponível sem provocar ataque de oportunidade desse alvo. Esse movimento ainda provoca ataques de oportunidade de outros inimigos.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Você cria uma arma natural de Magia Fina na mão. No Estilo Romanius, ela assume forma de gládio, estilete, ponta de pilum, lâmina curta ou fio de cinzel. A Brecha aumenta para +20, e o redutor de Esquivar aumenta para -10 contra o ataque que consumir a Brecha.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 4d8 de dano. A Brecha de Coorte aumenta para +25. O redutor de Esquivar permanece -10. Consome 8 PM e 3 PM por turno.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "A arma natural funciona como ataque extra. A Brecha permanece +25, e o redutor de Esquivar aumenta para -15 contra o ataque que consumir a Brecha. Mesmo com ataque extra, você ainda pode criar uma Brecha por rodada.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N9",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "e-decreto-da-ordem",
          "name": "Decreto Da Ordem",
          "regionCode": "E",
          "region": "Romanius",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO E - Decreto da Ordem",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você declara um Decreto contra inimigos em uma área de 3m de diâmetro. Alvos afetados sofrem 1d10 de penalidade em ataques, Agarrar, Derrubar ou outras manobras feitas contra você ou contra aliados em formação com você. Podem resistir com POD. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Em vez de reduzir movimento, o Decreto passa a afetar defesas ativas. Alvos afetados sofrem a penalidade da Densa quando tentarem Esquivar ou Aparar ataques feitos por você ou por aliados em formação com você. Bloquear e Contra-atacar não são afetados diretamente neste nível. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A penalidade aumenta para 2d10. O Decreto pode ser lançado em cone de 4,5m ou área de 3m de diâmetro. Dura 2 turnos, consumindo 1 PM por turno mantido. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao Decreto. Normalmente são aliados, legionários, guardas ou membros da mesma linha.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode usar o Decreto como reação quando um inimigo declarar ataque, Agarrar, Derrubar, Esquivar ou Aparar contra você ou contra um aliado em formação com você. Se o alvo falhar em POD, sofre a penalidade da Densa naquela ação. A partir deste nível, também pode usar a Densa para interferir em Mundo, seguindo a regra base. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "O Decreto passa a afetar Bloqueio de forma limitada. Se um alvo afetado usar Bloquear contra um ataque seu ou de aliado em formação, a redução de dano do Bloqueio diminui em 2 ponto, mínimo. Além disso, se o alvo usar Contra-atacar, sofre a penalidade da Densa se for contra você ou contra sua formação.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A penalidade aumenta para 4d10. Se um alvo afetado errar um ataque, falhar em Aparar ou falhar em Esquivar contra você ou contra sua formação, sofre 2d6 de dano mágico Denso. Se resistir ao Decreto, não sofre esse dano. Consome 6 PM e 2 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano aumenta para 2d8. A redução sobre Bloqueio aumenta para 4 pontos, mínimo 1. Consome 6 PM e 3 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano para 3d8. Consome PM e 4 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N8",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Os dados de penalidade se tornam d12, o dano aumenta para 4d8, e o usuário recebe +20 em SAB para resistir ou interferir em Mundo. A redução sobre Bloqueio aumenta para 6 pontos, mínimo 1. Consome 12 PM e 5 PM para manter.",
              "activationCost": 12,
              "maintenanceCost": 5,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "F",
      "name": "Hisbéria",
      "label": "Região F - Hisbéria",
      "cultures": [
        {
          "id": "irt-rius",
          "name": "Irtúrius",
          "regionCode": "F",
          "region": "Hisbéria",
          "nativeLanguage": "Nanýmir; Do'Rivièr; Castelhanio",
          "description": "Os Irtúrius são guerreiros valentes de Hisbéria, cuja destreza com espadas curtas e montarias os torna temidos em batalha. Suas tradições honram a coragem e a lealdade.",
          "weapon": "Espada Asturiana (Arma Longa) – 1d8 cortante; Acertos extremos montados causam +2d6 (8) de dano.",
          "skillBonusesText": "Lutar (Armas Curtas) +10, Cavalgar +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas Curtas)",
              "value": 10
            },
            {
              "skill": "Cavalgar",
              "value": 5
            }
          ],
          "ability": "o Guerreiro Irtúrio: Vantagem e +5 em Intimidação, caso consiga intimidar | alvo terá -10 em testes sociais contra você até | próximo descanso longo. | Cavaleiro Ibérico: +4 dano em manobra montada.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        },
        {
          "id": "castella",
          "name": "Castella",
          "regionCode": "F",
          "region": "Hisbéria",
          "nativeLanguage": "Nanýmir; Castelhanio",
          "description": "Os Castella são cronistas e devotos de Hisbéria, preservando lendas e rituais religiosos. Sua fé inabalável guia suas espadas em nome da honra.",
          "weapon": "Tizona (Arma Curta) - 1d8 cortante, quando apara você recebe +10 de bônus. Colada (Arma Curta) - 1d6 perfurante, causa 1d4 de sangramento. Quando ambas as armas são utilizadas juntas, elas dão +2 de dano cada adicional.",
          "skillBonusesText": "História +10, Religião +5",
          "skillBonuses": [
            {
              "skill": "História",
              "value": 10
            },
            {
              "skill": "Religião",
              "value": 5
            }
          ],
          "ability": "o Cronista Castella: Recorda fato histórico com precisão. | Guardião da Fé: Vantagem em Religião e Intuição.",
          "weakness": "Penalidade de -10 em Blefar.",
          "weaknessBonuses": [
            {
              "skill": "Blefar",
              "value": -10
            }
          ]
        },
        {
          "id": "jahaq",
          "name": "Jahaq",
          "regionCode": "F",
          "region": "Hisbéria",
          "nativeLanguage": "Al-Masafir; Nanýmir; Castelhanio",
          "description": "Os Jahaq são mercadores nômades de Hisbéria, navegando desertos com precisão e barganhando riquezas. Sua cultura valoriza o comércio e a exploração.",
          "weapon": "Cimitarra Árabe (Arma Curta) – 1d6 cortante e -10 na esquiva do inimigo, em combate engajado.",
          "skillBonusesText": "Navegação +10, Avaliação +5",
          "skillBonuses": [
            {
              "skill": "Navegação",
              "value": 10
            },
            {
              "skill": "Avaliação",
              "value": 5
            }
          ],
          "ability": "o Viajante Jahaq: Ignora Exaustão em viagens. | Desbravador das areias: Tem +20 em testes para encontrar artefatos.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        },
        {
          "id": "levijaq",
          "name": "Levijaq",
          "regionCode": "F",
          "region": "Hisbéria",
          "nativeLanguage": "Al-Masafir; Nanýmir; Castelhanio",
          "description": "Os Levijaq são sobreviventes do deserto, rastreando oásis e recursos em terras áridas. Sua resiliência os torna indispensáveis em expedições perigosas.",
          "weapon": "Adaga Árabe (Arma Curta) – 1d4 perfurante e +10 de Aparência.",
          "skillBonusesText": "Sobrevivência +10, Rastrear +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Rastrear",
              "value": 5
            }
          ],
          "ability": "o Nômade Levijaq: Não fica desprevenido. | Sobrevivente Árido: Encontra água em desertos sem teste e vantagem em Sobrevivência.",
          "weakness": "Penalidade de -10 em Atletismo.",
          "weaknessBonuses": [
            {
              "skill": "Atletismo",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "f-duelo-da-fronteira",
          "name": "Duelo Da Fronteira",
          "regionCode": "F",
          "region": "Hisbéria",
          "baseType": "Fina",
          "regional": true,
          "description": "REGIÃO F - DUELO DA FRONTEIRA Se estiver usando duas armas leves ou duas armas culturais hisbéricas compatíveis, você pode aplicar a Pressão de Duelo apenas no primeiro ataque que acertar na rodada.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você imbui sua arma com Energia Fina, causando 1d6 de dano cortante mágico. Se o alvo estiver em Combate Engajado com você, ele sofre -5 em Esquivar contra esse ataque. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Fina até 9m. A Pressão de Duelo só se aplica se o alvo estiver em Combate Engajado com você ou com um aliado seu. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d6 de dano. Se você tiver usado Aparar com sucesso contra esse alvo desde o seu último turno, recebe +5 no ataque contra ele ao usar Duelo da Fronteira. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Se você acertar um ataque com Duelo da Fronteira, pode causar 1d4 de sangramento, desde que esteja usando lâmina cortante ou perfurante. Esse efeito não acumula com outro sangramento da mesma fonte.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 2d8 de dano e pode ficar imbuída por 4 turnos. A Pressão de Duelo aumenta para -10 em Esquivar. Consome PM e 1 PM por turno mantido.",
              "activationCost": 2,
              "maintenanceCost": 1,
              "durationTurns": 4,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "-",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 3d8 de dano. Se o alvo estiver sangrando, você recebe +5 em Aparar contra ataques dele até o início do seu próximo turno.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Você cria uma arma natural de Magia Fina na mão. No Estilo Hisbérico, ela assume forma de espada asturiana, tizona, colada, cimitarra, adaga curva ou lâmina estreita de duelo, que causa 3d6 de dano. o dano de sangramento é aumentado para 1d6 de sangramento, desde que esteja usando lâmina cortante ou perfurante, esse valor não estaca com outros efeitos de sangramento.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 4d8 de dano. A Pressão de Duelo aumenta para -15 em Esquivar. Consome 8 PM e 3 PM por turno.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "A arma natural funciona como ataque extra. Mesmo com ataque extra, a Pressão de Duelo só pode ser aplicada uma vez por rodada contra o mesmo alvo. Se o alvo estiver sangrando, você recebe +10 em Aparar contra ataques dele até o início do seu próximo turno.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N9",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "f-juramento-da-serra",
          "name": "Juramento Da Serra",
          "regionCode": "F",
          "region": "Hisbéria",
          "baseType": "Forte",
          "regional": true,
          "description": "REGIÃO F - JURAMENTO DA SERRA Postura de Fronteira: Você pode escolher um foco: Duelar, Cavalgar ou Resistir. Só é possível manter um foco por vez, e o bônus pode ser usado uma vez por rodada, em apenas um teste. • Duelar: +5/+10/+15 em Aparar, Esquivar, Lutar ou resistir à Intimidação de um alvo em Combate Engajado. • Cavalgar: +5/+10/+15 em Cavalgar, resistir a ser desmontado ou manter uma manobra montada. • Resistir: +5/+10/+15 em testes contra exaustão, sangramento, veneno leve, queda, calor ou dor física.",
          "levels": [
            {
              "level": 1,
              "text": "Aumenta sua CA em +5. Ao ativar a magia, escolha uma Postura de Fronteira: Duelar, Cavalgar ou Resistir. Uma vez por rodada, recebe +5 em um teste ligado ao foco escolhido. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Reduz 1d6 de dano mágico. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Aumenta sua CA em +10. O bônus da Postura continua +5. Se o foco for Cavalgar e você acertar um ataque montado, pode somar +2 de dano físico ao ataque. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Reduz 1d6 de dano físico. Se a redução zerar o dano de um ataque feito pelo alvo do seu duelo, você recebe +5 adicional em sua postura contra ele até o início do seu próximo turno.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Aumenta sua CA em +15. O bônus da Postura de Fronteira aumenta para +10. Consome 3 PM e 1 PM para manter.",
              "activationCost": 3,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Reduz 2d6 de dano mágico e 1d6 de dano físico. Uma vez por rodada, se você resistir a sangramento ou exaustão, pode ignorar metade do dano da penalidade causado por essa condição até o início do próximo turno.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Aumenta sua CA em +20. Se o foco for Duelar, quando você Aparar com sucesso um ataque do alvo escolhido, seu próximo ataque contra ele recebe +5 de acerto. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Reduz 2d6 de dano mágico e 2d6 de dano físico.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N7",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Aumenta sua CA em +25. O bônus da Postura de Fronteira aumenta para +15. Se o foco for Cavalgar, o primeiro ataque montado enquanto a magia estiver ativa causa +2d6 de dano físico, apenas uma vez por cena. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Aumenta sua CA em +30 e reduz todo dano em 10. Enquanto estiver em Postura de Fronteira, uma vez por rodada, você pode escolher não ficar desprevenido, ou não tomar ataque de oportunidade contra um ataque vindo do alvo do seu foco. Consome 8 PM e 3 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "G",
      "name": "Slawia Oriental",
      "label": "Região G - Slawia Oriental",
      "cultures": [
        {
          "id": "korghuz",
          "name": "Korghuz",
          "regionCode": "G",
          "region": "Slawia Oriental",
          "nativeLanguage": "Kordush",
          "description": "Os Korghuz são cavaleiros nômades das estepes, cuja precisão com arcos montados é lendária. Suas hordas cruzam vastas planícies com velocidade implacável.",
          "weapon": "Arco Oghuz (Arco Composto) – 1d8 perfurante; +5 em Lutar (Culturais) montado.",
          "skillBonusesText": "Cavalgar +10, Lutar (Armas de Arremesso) +5",
          "skillBonuses": [
            {
              "skill": "Cavalgar",
              "value": 10
            },
            {
              "skill": "Lutar (Armas de Arremesso)",
              "value": 5
            }
          ],
          "ability": "o Cavaleiro Korghuz: Dispara flecha extra sem penalidade. | Arqueiro das Estepes: Vantagem em Armas de Arremesso/Culturais",
          "weakness": "Penalidade de -10 em Diplomacia.",
          "weaknessBonuses": [
            {
              "skill": "Diplomacia",
              "value": -10
            }
          ]
        },
        {
          "id": "yorhjuz",
          "name": "Yorhjuz",
          "regionCode": "G",
          "region": "Slawia Oriental",
          "nativeLanguage": "Kordush",
          "description": "Os Yorhjuz lideram hordas com táticas agressivas, inspirando temor com seus sabres. Sua cultura celebra a conquista e a liderança em batalha.",
          "weapon": "Sabre Oghuz (Arma Curta) – 1d6 cortante; Se acertar um golpe extremo, pode sair do alcance do alvo sem provocar ataques de oportunidade.",
          "skillBonusesText": "Tática +10, Intimidação +5",
          "skillBonuses": [
            {
              "skill": "Tática",
              "value": 10
            },
            {
              "skill": "Intimidação",
              "value": 5
            }
          ],
          "ability": "o Líder Yorhjuz: Vantagem em Tática. | Comandante das Hordas: +10 de Tática e +5 de Cavalgar para todos os aliados em formação.",
          "weakness": "Penalidade de -10 em Medicina.",
          "weaknessBonuses": [
            {
              "skill": "Medicina",
              "value": -10
            }
          ]
        },
        {
          "id": "pechenches",
          "name": "Pechenches",
          "regionCode": "G",
          "region": "Slawia Oriental",
          "nativeLanguage": "Kordush",
          "description": "Os Pechenches são espiões silenciosos das estepes, movendo-se como sombras para vigiar inimigos. Suas lanças curvas são perfeitas para emboscadas.",
          "weapon": "Lança Pecheneque (Arma de Haste) – 1d8 perfurante; +4 de dano em ataques de oportunidade.",
          "skillBonusesText": "Furtividade +10, Escutar +5",
          "skillBonuses": [
            {
              "skill": "Furtividade",
              "value": 10
            },
            {
              "skill": "Escutar",
              "value": 5
            }
          ],
          "ability": "o Espião Pechenche: Detecta conversas em até 9m automaticamente. | Sombra Silenciosa: Vantagem em Furtividade.",
          "weakness": "Penalidade de -10 em Persuasão.",
          "weaknessBonuses": [
            {
              "skill": "Persuasão",
              "value": -10
            }
          ]
        },
        {
          "id": "curiuz",
          "name": "Curiuz",
          "regionCode": "G",
          "region": "Slawia Oriental",
          "nativeLanguage": "Kordush",
          "description": "Os Curiuz são domadores de animais, vivendo em harmonia com as criaturas das estepes. Seus machados leves são ideais para caça e defesa.",
          "weapon": "Machado Oghuz (Arma Curta) – 1d6 cortante e 1d6 contundente.",
          "skillBonusesText": "Lidar com Animais +10, Sobrevivência +5",
          "skillBonuses": [
            {
              "skill": "Lidar com Animais",
              "value": 10
            },
            {
              "skill": "Sobrevivência",
              "value": 5
            }
          ],
          "ability": "o Domador Curiuz: Acalma animal selvagem sem teste. | Vínculo com a Natureza: Vantagens 3 perícias que envolvam natureza.",
          "weakness": "Penalidade de -10 em Direito.",
          "weaknessBonuses": [
            {
              "skill": "Direito",
              "value": -10
            }
          ]
        },
        {
          "id": "monghyus",
          "name": "Monghyus",
          "regionCode": "G",
          "region": "Slawia Oriental",
          "nativeLanguage": "Kordush",
          "description": "Os Monghyus são conquistadores implacáveis, dominando as estepes com arcos poderosos e força física. Suas hordas são sinônimo de destruição e glória.",
          "weapon": "Arco Mongol (Arco Composto) – 1d10 perfurante; ignora 10 CA a distância.",
          "skillBonusesText": "Lutar (Armas Longas) +10, Atletismo +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas Longas)",
              "value": 10
            },
            {
              "skill": "Atletismo",
              "value": 5
            }
          ],
          "ability": "o Conquistador Monghyu: Vantagem em Armas de Arremesso/Cultural montado. | Fúria Nômade: Ignora penalidades de terreno em combates.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "g-pulso-do-galope",
          "name": "Pulso Do Galope",
          "regionCode": "G",
          "region": "Slawia Oriental",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO G - PULSO DO GALOPE Disparo de Passagem: condição de cena realizada quando o personagem está montado, move pelo menos 3m antes do ataque e dispara ainda controlando a montaria. Pode ser feito com arco, arma cultural de arremesso, lança leve arremessada ou disparo semelhante. Depois de acertar um ataque à distância ou arremesso durante um Disparo de Passagem, o usuário pode gastar sua ação bônus e os PM da Magia Impacto para liberar o Pulso do Galope.",
          "levels": [
            {
              "level": 1,
              "text": "Depois de acertar um ataque à distância ou arremesso durante um Disparo de Passagem, você pode gastar sua ação bônus para causar 1d8 de dano contundente mágico ao alvo. Se o alvo falhar em CON, ele sofre -5 no próximo ataque contra você até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "-",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N1",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "O dano aumenta para 2d8. Se usado em Disparo de Passagem, o redutor no próximo ataque do alvo contra você aumenta para -10. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar o Pulso, o alvo faz CON. Em falha, fica atordoado por 1 turno. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "O dano aumenta para 3d8. Você pode adicionar uma Finta de Sela: o alvo sofre -10 em Esquivar contra esse disparo e não recebe benefício de cobertura parcial leve, como escudo mal posicionado, poeira, movimentação de tropa ou obstáculo pequeno. O alcance do impacto tem seu alcance aumentado para 12 metros. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode usar Rajada de Casco: escolha até 2 alvos a até 3m um do outro, desde que ambos estejam no caminho ou na direção do seu Disparo de Passagem. Um alvo recebe o dano completo; o outro faz CON para não sofrer metade do dano. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "O dano aumenta para 4d8. Se o alvo falhar em CON após um Disparo de Passagem, ele também sofre -5 em Cavalgar, Tática ou Lutar até o início do próximo turno dele, à escolha do conjurador. O alcance do impacto tem seu alcance aumentado para 15 metros. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você pode realizar um Pulso pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Se estiver montado, você não é empurrado; em vez disso, a montaria precisa estar em movimento ou você perde esse benefício. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "O dano aumenta para 5d8, ou 5d10 com ação padrão. O alcance do impacto tem seu alcance aumentado para 18 metros. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O teste para resistir é dificultado em 20, e se usar ação padrão os dados se tornam d12. A Rajada de Casco pode afetar até 3 alvos, mas apenas um recebe dano completo; os demais sofrem metade se falharem em CON. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "g-la-o-da-estepe",
          "name": "Laço Da Estepe",
          "regionCode": "G",
          "region": "Slawia Oriental",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO G - LAÇO DA ESTEPE A ideia aqui não é prender o inimigo no chão, nem tirar movimento dele à distância. O Laço da Estepe representa uma pressão invisível, curta e seca, como se o corpo do alvo fosse puxado por um laço que ele não vê: o pé erra, o ombro pesa, a sela desloca, o escudo chega atrasado, a esquiva perde ritmo.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você cria uma pressão Densa invisível em uma área de 3m de diâmetro. Alvos afetados fazem resistência de POD. Se falharem ficam até o início do seu próximo turno, sofrendo 1d10 de penalidade em Esquivar, Aparar, Cavalgar, Atletismo ou testes de FOR/CON feitos para resistir a derrubar, empurrar, desmontar ou manter equilíbrio. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Em vez de reduzir o movimento diretamente, o Laço prejudica a mudança brusca de posição. Se o alvo tentar sair do seu alcance, montar, desmontar, levantar-se, trocar de posição defensiva ou recuar de um combate engajado, sofre a penalidade da Densa nesse teste ou na defesa relacionada. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A penalidade aumenta para 2d10. A área pode ser usada em cone de 4,5m ou área de 3m de diâmetro. Dura 2 turnos, consumindo 1 PM por turno mantido. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao Laço da Estepe. Normalmente são aliados da mesma horda, montarias treinadas ou companheiros acostumados ao seu ritmo de combate.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode usar o Laço da Estepe como reação quando um alvo a até 3m tentar Esquivar, Aparar, Cavalgar para se reposicionar, resistir a uma manobra, montar, desmontar ou sair do seu alcance. Se o alvo falhar em POD, sofre 3d10 de penalidade naquela ação. A partir daqui, mantém a interação normal da Magia Densa com Mundo. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "O alvo não perde movimento, mas perde firmeza. Uma vez por rodada, se ele falhar em Esquivar, Aparar ou Cavalgar por causa da penalidade do Laço, você pode se mover sem provocar ataque de oportunidade desse alvo. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A penalidade aumenta para 4d10. Se o alvo falhar em Esquivar, Aparar, Cavalgar ou resistir a uma manobra enquanto estiver dentro da Densa, sofre 2d6 de dano mágico. Se resistir ao Laço, não sofrerá esse dano. Consome 6 PM e 2 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano aumenta para 2d8. Caso o alvo resista, sofre metade do dano. Consome 6 PM e 3 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano para 3d8. Se o alvo estiver montado e falhar em Cavalgar por causa do Laço, ele não cai automaticamente, mas fica sem controle pleno da montaria até o início do próximo turno. Consome 8 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Os dados de penalidade se tornam d12, o dano aumenta para 4d8, e o usuário recebe +20 em SAB para resistir ou interferir em Mundo. Consome 12 PM e 5 PM para manter.",
              "activationCost": 12,
              "maintenanceCost": 5,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "H",
      "name": "Saxi (Norte) Calcis (Sul)",
      "label": "Região H - Saxi (Norte) Calcis (Sul)",
      "cultures": [
        {
          "id": "bizyiuns",
          "name": "Bizyiuns",
          "regionCode": "H",
          "region": "Saxi (Norte) Calcis (Sul)",
          "nativeLanguage": "Grekás; Nanýmir-Grekás",
          "description": "Os Bizyiuns são eruditos do Império Arkade, preservando textos sagrados e históricos. Sua cultura combina devoção religiosa com conhecimento imperial.",
          "weapon": "Espada Bizantina (Arma Longa) – 1d8 cortante; +10 em Tática.",
          "skillBonusesText": "História +10, Religião +5",
          "skillBonuses": [
            {
              "skill": "História",
              "value": 10
            },
            {
              "skill": "Religião",
              "value": 5
            }
          ],
          "ability": "o Erudito Bizyiun: Vantagem em Direito, Religião e História | Cronista Imperial: Vantagem em testes Sociais.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        },
        {
          "id": "helenes",
          "name": "Helenes",
          "regionCode": "H",
          "region": "Saxi (Norte) Calcis (Sul)",
          "nativeLanguage": "Grekás; Nanýmir-Grekás",
          "description": "Os Helenes são oradores e filósofos, cuja retórica encanta multidões no Império Arkade. Sua sabedoria resolve disputas com palavras, não espadas.",
          "weapon": "Xiphos Ateniense (Arma Curta) – 1d6 perfurante e +3 de dano quando flanqueando por um aliado.",
          "skillBonusesText": "Persuasão +10, Atuação +5",
          "skillBonuses": [
            {
              "skill": "Persuasão",
              "value": 10
            },
            {
              "skill": "Atuação",
              "value": 5
            }
          ],
          "ability": "o Orador Helene: Encanta multidão pequena. | Filósofo Nato: Vantagem em Persuasão, Lábia e Blefar.",
          "weakness": "Penalidade de -10 em Cavalgar.",
          "weaknessBonuses": [
            {
              "skill": "Cavalgar",
              "value": -10
            }
          ]
        },
        {
          "id": "lakonicos",
          "name": "Lakonicos",
          "regionCode": "H",
          "region": "Saxi (Norte) Calcis (Sul)",
          "nativeLanguage": "Grekás; Nanýmir-Grekás",
          "description": "Os Lakonicos são guerreiros disciplinados do Império Arkade, cuja força em formações é inigualável. Sua cultura valoriza a coragem e o sacrifício.",
          "weapon": "Lança Dory (Arma de Haste) – 1d6 perfurante e pode desferir um ataque a um oponente caído como ação bônus.",
          "skillBonusesText": "Lutar (Armas de Haste) +10, Esquivar +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas de Haste)",
              "value": 10
            },
            {
              "skill": "Esquivar",
              "value": 5
            }
          ],
          "ability": "o Guerreiro Lakonico: Triplica dados críticos. | Escudo Espartano: +2 em CA em formação.",
          "weakness": "-10 em Perícias Sociais.",
          "weaknessBonuses": [
            {
              "skill": "Perícias Sociais",
              "value": -10
            }
          ]
        },
        {
          "id": "p-t-nes",
          "name": "Pætûnes",
          "regionCode": "H",
          "region": "Saxi (Norte) Calcis (Sul)",
          "nativeLanguage": "Grekás; Nanýmir-Grekás",
          "description": "Os Pætûnes são navegadores costeiros do Império Arkade, mestres em explorar ilhas e criar obras de arte. Suas embarcações cruzam mares com precisão.",
          "weapon": "Sabre Tunisiano (Arma Curta) – 1d6 cortante; +5 em Lutar (Culturais).",
          "skillBonusesText": "Navegação +10, Arte/Ofício +5",
          "skillBonuses": [
            {
              "skill": "Navegação",
              "value": 10
            },
            {
              "skill": "Arte/Ofício",
              "value": 5
            }
          ],
          "ability": "o Marinheiro Pætûne: Concertos e Navegações de barco possuem vantagem quando realizados, não pode ficar doente durante viagens. | Navegador das Ilhas: Ao subir no caralho, detém conhecimento de quaisquer ameaças/problemas que podem ocorrer até | próximo descanso longo.",
          "weakness": "Penalidade de -10 em Rastrear.",
          "weaknessBonuses": [
            {
              "skill": "Rastrear",
              "value": -10
            }
          ]
        },
        {
          "id": "apollinaris",
          "name": "Apollinaris",
          "regionCode": "H",
          "region": "Saxi (Norte) Calcis (Sul)",
          "nativeLanguage": "Grekás; Nanýmir-Grekás",
          "description": "Os Apollinaris são curandeiros e devotos do Império Arkade, honrando Apolo com rituais de cura. Sua conexão com a natureza os torna sábios em ervas.",
          "weapon": "Sarissa Macedônica (Arma de Haste) – 1d10 perfurante, precisa usar as duas mãos e seu alcance é estendido em formações (4,5m).",
          "skillBonusesText": "Medicina +10, Natureza +5",
          "skillBonuses": [
            {
              "skill": "Medicina",
              "value": 10
            },
            {
              "skill": "Natureza",
              "value": 5
            }
          ],
          "ability": "o Curandeiro Apollinari: Cura venenos em aliados. | Seguidor de Apolo: Joga 2d6 e usa | maior dado ao curar.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "h-muralha-de-calcis",
          "name": "Muralha De Calcis",
          "regionCode": "H",
          "region": "Saxi (Norte) Calcis (Sul)",
          "baseType": "Forte",
          "regional": true,
          "description": "REGIÃO H - MURALHA DE CALCIS Cargas: As Cargas são recuperadas no início de cada turno do usuário, elas só podem proteger aliados adjacentes, normalmente a até 1,5m. Cada uso de Carga exige o gasto de PM indicado pelo nível e usar-las não consome reação. A Carga pode ser usada mesmo fora do turno do usuário, quando o aliado adjacente for atacado ou sofrer dano, mas ela não acumula com outra Muralha de Calcis no mesmo aliado contra o mesmo ataque e se o usuário estiver caído, atordoado ou impedido de se mover, não pode gastar Cargas. Duas formas de gastar Carga na Muralha de Calcis: 1. Erguer a Muralha: Antes do ataque inimigo ser resolvido, o usuário gasta Carga para conceder CA a um aliado adjacente contra aquele ataque. 2. Sustentar a Muralha: Depois que o aliado for atingido, mas antes do dano final ser aplicado, o usuário gasta Carga para reduzir o dano recebido por esse aliado.",
          "levels": [
            {
              "level": 1,
              "text": "Aumenta sua CA em +5. Você recebe Vigor Efetivo +5. Possui Carga por turno. Pode gastar 1 Carga para usar Erguer a Muralha, concedendo +3 de CA a um aliado adjacente contra um ataque. Consome 1 PM e 1 PM para ativar cada Carga.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Reduz 1d6 de dano mágico em você. Você pode gastar 1 Carga para usar Sustentar a Muralha, reduzindo 1d6 de dano mágico sofrido por um aliado adjacente. Consome 1 PM e 1 PM para ativar cada Carga.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Aumenta sua CA em +10. O Vigor Efetivo permanece +5. Erguer a Muralha passa a conceder +5 de CA a um aliado adjacente contra um ataque. Consome 2 PM e 1 PM para ativar cada Carga.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Reduz 1d6 de dano físico em você. Sustentar a Muralha também pode reduzir 1d6 de dano físico sofrido por um aliado adjacente. Consome 2 PM e 1 PM para ativar cada Carga.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Aumenta sua CA em +15. Seu Vigor Efetivo aumenta para +10. Agora você possui 2 Cargas por turno. Erguer a Muralha concede +10 de CA a um aliado adjacente contra um ataque. Consome 3 PM, 1 PM para manter e 2 PM para ativar cada Carga.",
              "activationCost": 3,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Reduz 2d6 (8) de dano mágico e 1d6 de dano físico em você. Sustentar a Muralha passa a reduzir 1d6+4 de dano mágico ou 1d6 de dano físico sofrido por um aliado adjacente. Consome 3 PM, 1 PM para manter e 2 PM para ativar cada Carga.",
              "activationCost": 3,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Aumenta sua CA em +20. Erguer a Muralha concede +15 de CA a um aliado adjacente contra um ataque. Se o ataque errar por causa desse bônus, você recebe +5 no próximo teste de ataque contra esse alvo até o fim do seu próximo turno. Consome 4 PM, 1 PM para manter e 2 PM para ativar cada Carga.",
              "activationCost": 4,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Reduz 2d6 de dano mágico e 2d6 de dano físico em você. Sustentar a Muralha passa a reduzir 1d6+4 de dano físico e 1d6+4 de dano mágico sofrido por um aliado adjacente. Consome 5 PM, 1 PM para manter e 3 PM para ativar cada Carga.",
              "activationCost": 5,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Aumenta sua CA em +25. Seu Vigor Efetivo aumenta para +15. Erguer a Muralha concede +20 de CA a um aliado adjacente contra um ataque. Consome 6 PM, 1 PM para manter e 3 PM para ativar cada Carga.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Aumenta sua CA em +30 e reduz todo dano sofrido por você em 10. Agora você possui 3 Cargas por turno. Erguer a Muralha concede +20 de CA a um aliado adjacente contra um ataque. Sustentar a Muralha reduz 10 de qualquer dano sofrido por um aliado adjacente. Uma vez por rodada, se um aliado em até 3m tiver o PV reduzido a 0 por dano, você pode gastar o valor de ativação da magia, 8 PM, para reduzir o dano recebido por ele em 2d8+2. Se isso impedir que ele chegue a 0 PV, ele permanece de pé. Consome 8 PM, 3 PM para manter e 4 PM para ativar cada Carga.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "h-rito-da-segunda-luz",
          "name": "Rito Da Segunda Luz",
          "regionCode": "H",
          "region": "Saxi (Norte) Calcis (Sul)",
          "baseType": "Etérea",
          "regional": true,
          "description": "REGIÃO H - RITO DA SEGUNDA LUZ Como funciona o Vigor Efetivo aqui: 1. Ele pode ser usado em: • testes de CON para resistir a sangramento, veneno, doença, exaustão, dor física ou perda de consciência; • testes de FOR para manter-se de pé, resistir a empurrão ou sustentar o corpo ferido; • testes de Atletismo, se a mesa usar Atletismo para esforço físico; • testes para estabilizar, resistir a piora de condição ou suportar marcha/cerco/viagem. 2. Ele não pode ser usado em: ataque; dano; Esquivar; Aparar; Bloquear; Contra- atacar; perícias sociais; Corpo; PV máximo; CA. Também não acumula com outro Vigor Efetivo. Se o personagem receber Vigor Efetivo de duas fontes, usa apenas o maior.",
          "levels": [
            {
              "level": 1,
              "text": "Cura 1d8 em si, . Além disso, recebe Vigor Efetivo +5 para um teste de CON, FOR ou Atletismo feito até o início do seu próximo turno, desde que o teste envolva sangramento, veneno, doença, exaustão, dor, queda ou manter-se de pé. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Pode curar um alvo em 1d6, . O alvo curado recebe Vigor Efetivo +5 para um teste físico ou de recuperação feito até o início do seu próximo turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Cura 2d8 em si, ou concede 5 de vida temporária em si ou em um alvo, . Quem receber a cura ou a vida temporária também recebe Vigor Efetivo +5 para um teste físico ou de estabilização. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Cura 2d6 em um alvo, além de doenças leves, sangramento e envenenamento. Se remover uma dessas condições, o alvo recebe Vigor Efetivo +10 no próximo teste para resistir à mesma fonte ou impedir que a condição retorne até o próximo descanso curto. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Cura 3d8 em si, cura 2d6 em alvos até 3m, ou concede 10 de vida temporária, . Escolha um alvo afetado: ele recebe Vigor Efetivo +10 para um teste físico ou de recuperação feito até o início do seu próximo turno. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Pode curar um alvo em 3d6, . Se o alvo estiver sofrendo sangramento, veneno, exaustão, dor severa ou risco de cair/desmaiar, ele pode realizar imediatamente um teste apropriado com Vigor Efetivo +10. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Cura 4d8 em si, ou concede 15 de vida temporária, . Também pode remover Lesão Grave. Ao remover Lesão Grave, o alvo recebe Vigor Efetivo +15 para o próximo teste físico ligado ao ferimento removido até o próximo descanso curto. Consome 7 PM.",
              "activationCost": 7,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Pode curar um alvo em 4d6, . O alvo curado recebe Vigor Efetivo +15. Se estiver caído, Morrendo, exausto ou sob dor física intensa, pode usar esse Vigor no próximo teste para estabilizar o corpo, manter-se consciente ou voltar a agir com ajuda do mestre. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Cura 5d8 em si, além de poder curar doenças raras em 1d4 horas, . Durante esse processo de cura prolongada, o alvo tratado recebe Vigor Efetivo +20 em testes contra agravamento da doença, febre, exaustão, veneno ou fraqueza física. Consome PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N8",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Pode curar um alvo em 6d6 ou conceder 25 de vida temporária, . O alvo recebe Vigor Efetivo +25. Uma vez até o início do seu próximo turno, ele pode usar esse Vigor para resistir a cair, desmaiar, piorar sangramento, sucumbir a veneno/doença ou perder ação por dor física. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "I",
      "name": "Skändär",
      "label": "Região I - Skändär",
      "cultures": [
        {
          "id": "ni-r-i-nus",
          "name": "Niörðiänus",
          "regionCode": "I",
          "region": "Skändär",
          "nativeLanguage": "Nørdic",
          "description": "Os Niörðiänus são vikings de Skändär, navegando mares gelados e sobrevivendo em tundras hostis. Suas sagas celebram feitos de bravura e exploração.",
          "weapon": "Machado Niörðiäno (Arma Longa) – 1d8 cortante e se acertar 3 vezes pode quebrar o escudo do adversário.",
          "skillBonusesText": "Sobrevivência +10, Navegação +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Navegação",
              "value": 5
            }
          ],
          "ability": "o Explorador Niörðiänu: Não possui penalidades causadas pelo frio, alem de ter vantagem em navegações no frio. | Pugilista das Neves: Enfrentar um adversário estando ambos desarmado aumenta em 10 seus acertos de Lutar (Brigar) e +3 | seu dano.",
          "weakness": "Penalidade de -10 em Diplomacia.",
          "weaknessBonuses": [
            {
              "skill": "Diplomacia",
              "value": -10
            }
          ]
        },
        {
          "id": "s-cur-r",
          "name": "Sūcurðr",
          "regionCode": "I",
          "region": "Skändär",
          "nativeLanguage": "Nørdic",
          "description": "Os Sūcurðr são guerreiros berserkers de Skändär, cuja fúria em batalha é lendária. Suas espadas longas cortam inimigos e escudos com precisão.",
          "weapon": "Espada Sueca (Arma Longa) – 1d8 cortante e +5 em Intimidação; Martelo Sūcurðr (Arma Longa) - 1d10 contundente e +4 de dano em alvos com armadura.",
          "skillBonusesText": "Lutar (Armas Longas) +10, Cavalgar +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas Longas)",
              "value": 10
            },
            {
              "skill": "Cavalgar",
              "value": 5
            }
          ],
          "ability": "o Berserker Sūcurðr: Vantagem em Lutar, ao finalizar entra em exaustão. | Golpe Viking: +5 dano com arma grande.",
          "weakness": "Penalidade de -10 em Contabilidade.",
          "weaknessBonuses": [
            {
              "skill": "Contabilidade",
              "value": -10
            }
          ]
        },
        {
          "id": "same",
          "name": "Sameš",
          "regionCode": "I",
          "region": "Skändär",
          "nativeLanguage": "Saami; Laami; Nørdic",
          "description": "Os Sameš são xamãs do norte, vivendo em harmonia com renas e espíritos árticos. Sua conexão com a natureza os torna guias espirituais de Skändär.",
          "weapon": "Faca Sami (Arma Curta) – 1d6 cortante e +5 em Lutar (Culturais) e Intimidação.",
          "skillBonusesText": "Lidar com Animais +10, Natureza +5",
          "skillBonuses": [
            {
              "skill": "Lidar com Animais",
              "value": 10
            },
            {
              "skill": "Natureza",
              "value": 5
            }
          ],
          "ability": "o Xamã Sameš: Realizar uma prece em 1d4 aliados antes de um descanso os faz ter um sono mais confortável, teste de religião, caso tenha sucesso | descanso será considerado um acima do atual. | Vínculo Ártico: Comanda animal temporariamente.",
          "weakness": "Penalidade de -10 em Persuasão.",
          "weaknessBonuses": [
            {
              "skill": "Persuasão",
              "value": -10
            }
          ]
        },
        {
          "id": "lapime",
          "name": "Lapimeš",
          "regionCode": "I",
          "region": "Skändär",
          "nativeLanguage": "Laami; Saami; Nørdic",
          "description": "Os Lapimeš são nômades do gelo, escalando montanhas geladas e sobrevivendo em tundras. Sua resiliência os torna mestres da vida no extremo norte.",
          "weapon": "Machado Lapão (Arma Curta) – 1d6 cortante; ignora terrenos difíceis.",
          "skillBonusesText": "Sobrevivência +10, Atletismo +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Atletismo",
              "value": 5
            }
          ],
          "ability": "o Montaria Lapimes: Enquanto montados em Renas recebem +10 em cavalgar e +5 em Lutar (Cultural). | Filho do Gelo: Vantagem em testes de Sobrevivência, Natureza, e não sofre penalidade causadas pelo frio.",
          "weakness": "Penalidade de -10 em Navegação.",
          "weaknessBonuses": [
            {
              "skill": "Navegação",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "i-punho-da-neve",
          "name": "Punho Da Neve",
          "regionCode": "I",
          "region": "Skändär",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO I - PUNHO DA NEVE O Punho da Neve funciona melhor com ataques desarmados feitos com as mãos. O personagem faz um ataque físico desarmado. Se acertar, pode gastar sua ação bônus e os PM da Magia Impacto para aplicar o efeito. Se o personagem estiver usando armas, o estilo ainda pode ser usado como Magia Impacto comum, mas não recebe os benefícios regionais do Punho da Neve.",
          "levels": [
            {
              "level": 1,
              "text": "Depois de acertar um ataque desarmado com as mãos, você pode gastar sua ação bônus para causar 1d8 de dano contundente mágico. Se ambos estiverem desarmados, ou se a cena ocorrer em frio intenso/neve/gelo, o alvo faz CON; se falhar, sofre -5 em Lutar/Brigar contra você até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Impacto até 9m. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d8 de dano. Se o alvo tentar Bloquear um Punho da Neve usado em ataque desarmado, a redução do Bloqueio diminui em 2 ponto, mínimo 1. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar o ataque, o alvo faz CON. Se falhar, fica atordoado por 1 turno. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 3d8 de dano. Você pode adicionar uma finta corporal: o alvo sofre -10 em Esquivar contra esse golpe e não recebe benefício de cobertura parcial leve. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Em vez de atacar uma área ampla, você pode descarregar o impacto em uma pancada curta ao redor do corpo. Criaturas adjacentes escolhidas por você fazem CON; em falha, são empurradas 1,5m e metade do dano. Apenas o alvo principal sofre o dano completo da magia. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 4d8 de dano. A redução do Bloqueio contra seu Punho da Neve aumenta para 3 pontos, mínimo 1. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você realiza um golpe pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Você é empurrado 1,5m, mas não provoca ataque de oportunidade do alvo atingido. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 5d8, ou 5d10 com ação padrão. Se ambos estiverem desarmados, ou se a cena ocorrer em frio intenso/neve/gelo, o redutor em Lutar/Brigar contra você aumenta para -10 em falha de CON. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON é de 4,5m, o teste para não ser afetado é dificultado em 20, e se usar ação padrão os dados se tornam d12. A redução do Bloqueio contra o Punho da Neve aumenta para 5 pontos, mínimo 1. Finta corporal é aumentando para -15 em Esquivar contra esse golpe e não recebe benefício de cobertura parcial leve. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "i-prece-do-sono-branco",
          "name": "Prece Do Sono Branco",
          "regionCode": "I",
          "region": "Skändär",
          "baseType": "Etérea",
          "regional": true,
          "description": "REGIÃO I - PRECE DO SONO BRANCO A Cura de Emergência é uma recuperação rápida, imperfeita e temporária, usada para impedir que um alvo entre em Morrendo ou fique inconsciente. Ele não remove Lesão Grave de forma definitiva; Ele não cura doença rara; Ele não substitui tratamento prolongado.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você recita uma prece curta e recupera 1d6 de Cura de Emergência em si mesmo. Esse valor pode impedir que você caia Inconsciente por frio, dor, exaustão leve ou sangramento até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Com uma ação bônus, você pode conceder 1d4 de Cura de Emergência a um alvo adjacente. Esse valor pode ser usado imediatamente para impedir que o alvo entre em Morrendo ou fique Inconsciente, caso o valor seja suficiente. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Você recupera 2d6 de Cura de Emergência em si, ou concede 3 de vida temporária emergencial a um alvo adjacente. Essa vida temporária dura até o início do seu próximo turno e só serve contra dano, frio, dor, sangramento ou exaustão. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você concede 2d4 de Cura de Emergência a um alvo em até 3m. Se o alvo estiver sofrendo sangramento, envenenamento ou doença leve, a Prece não remove a condição, mas pode segurar seus efeitos até o início do seu próximo turno. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você recupera 3d6 de Cura de Emergência em si, concede 2d4 de Vigor de Emergência a alvos em uma área de 3m, ou concede 6 de vida temporária emergencial. O ponto de origem da área pode estar a até 9m de você. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode conceder 3d4 de Cura de Emergência a um alvo em até 6m. A partir deste nível, pode usar esta magia como reação quando esse alvo for cair a 0 PV, entrar em Morrendo ou ficar Inconsciente. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            },
            {
              "level": 7,
              "text": "Você recupera 4d6 de Cura de Emergência em si, ou concede de vida temporária emergencial. Se você sofrer uma Lesão Grave recente, pode ignorar seus efeitos incapacitantes até o fim do combate; depois do combate, a Lesão Grave permanece e precisa ser tratada normalmente. Consome 7 PM.",
              "activationCost": 7,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Você concede 4d4 de Cura de Emergência a um alvo em até 9m. Se o alvo entrou em Morrendo ou ficou Inconsciente desde o fim do seu último turno, você pode usar uma ação bônus para aplicar essa Cura; se ele voltar acima de 0 PV, desperta caído e fraco, mas consciente. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "bonus"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "text"
              }
            },
            {
              "level": 9,
              "text": "Você recupera 5d6 de Cura de Emergência em si. Fora de combate, durante um descanso em frio intenso, neve, tundra, mar gelado ou viagem extrema, pode conduzir uma prece Sameš: faça Religião; em sucesso, até 1d4 aliados recebem +5 contra frio, exaustão ou agravamento de doença até o fim do descanso. Esse efeito não acumula com a habilidade cultural Xamã Sameš. Consome 9 PM.",
              "activationCost": 9,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Você concede 6d4 de Cura de Emergência ou 15 de vida temporária emergencial a um alvo em até 9m. Pode usar esta magia como reação dando 20 pontos de vida temporária quando o alvo for cair a 0 PV, entrar em Morrendo ou ficar Inconsciente. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "J",
      "name": "Al-Gharbura e Khamisat",
      "label": "Região J - Al-Gharbura e Khamisat",
      "cultures": [
        {
          "id": "amzari",
          "name": "Amzari",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Amzarit; Al-Masafir",
          "description": "Os Amzari são caravanistas do Al-Gharbura, cruzando desertos com rotas comerciais precisas. Sua habilidade em barganhas os torna ricos e influentes.",
          "weapon": "Cimitarra Amzari (Arma Curta) – 1d6 cortante e +1 de dano a cada 3m deslocados nesse round.",
          "skillBonusesText": "Navegação +10, Avaliação +5",
          "skillBonuses": [
            {
              "skill": "Navegação",
              "value": 10
            },
            {
              "skill": "Avaliação",
              "value": 5
            }
          ],
          "ability": "o Comerciante Amzari: Vantagem em Persuasão e Navegação. | Mestre Caravanista: Pode comprar algo por metade do preço com Vantagem em Persuasão pelo comprador.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        },
        {
          "id": "zafir",
          "name": "Zafir",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Zafiriyya; Al-Masafir",
          "description": "Os Zafir são rastreadores do Khamisat, sobrevivendo em desertos com astúcia e resistência. Suas lanças os protegem em viagens perigosas.",
          "weapon": "Lança Zafir (Arma de Haste) – 1d8 perfurante e 1d4 de sangramento.",
          "skillBonusesText": "Sobrevivência +10, Rastrear +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Rastrear",
              "value": 5
            }
          ],
          "ability": "o Cantor Zafir: Uma vez por descanso longo, pode Compor e Cantar uma música para aqueles que estão ao seu redor, Aumentando em +10 duas periciais sociais, que envolvem | que foi cantado. | Rastreador do Khamisat: Vantagem em Rastrear, Encontrar e Sobrevivência.",
          "weakness": "Penalidade de -10 em Atletismo.",
          "weaknessBonuses": [
            {
              "skill": "Atletismo",
              "value": -10
            }
          ]
        },
        {
          "id": "dambari",
          "name": "Dambari",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Dambarim",
          "description": "Os Dambari são guerreiros do Khamisat, cuja agilidade com espadas curvas domina combates no calor. Sua cultura celebra a força e a dança guerreira.",
          "weapon": "Espada Dambari (Arma Longa) – 1d8 cortante; +2 de CA em combate corpo a corpo.",
          "skillBonusesText": "Lutar (Armas Curtas) +10, Atletismo +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas Curtas)",
              "value": 10
            },
            {
              "skill": "Atletismo",
              "value": 5
            }
          ],
          "ability": "o Guerreiro Dambari: +10 em Lutar (Arma Curta)/(Culturais). | Lâmina do Khamisat: +3 dano com arma curta.",
          "weakness": "Penalidade de -10 em Navegação.",
          "weaknessBonuses": [
            {
              "skill": "Navegação",
              "value": -10
            }
          ]
        },
        {
          "id": "kaniri",
          "name": "Kaniri",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Kaniré",
          "description": "Os Kaniri são juízes e diplomatas do Khamisat, resolvendo disputas tribais com sabedoria. Suas leis mantêm a harmonia em terras turbulentas.",
          "weapon": "Machado Kaniri (Arma Curta) – 1d6 cortante e pode ser arremessado (alcance 18m), causa -5 de CA contra armaduras leves e médias, e causa 1d6 de dano a mais caso o alvo tenha eliminado algum outro ser.",
          "skillBonusesText": "Direito +10, Diplomacia +5",
          "skillBonuses": [
            {
              "skill": "Direito",
              "value": 10
            },
            {
              "skill": "Diplomacia",
              "value": 5
            }
          ],
          "ability": "o Diplomata Kaniri: Vantagem em Intuição, Persuasão e Direito. | Juiz Tribal: Ao ver uma injustiça (Mesmo em combates), pode ativar essa habilidade, então terá vantagem em todos os testes contra | INJUSTO.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        },
        {
          "id": "hadira",
          "name": "Hadira",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Hadirim",
          "description": "Os Hadira são curandeiros do Khamisat, usando ervas para tratar males e salvar vidas. Sua conexão com a natureza os torna respeitados em suas comunidades.",
          "weapon": "Adaga Hadira (Arma Curta) – 1d4 perfurante e cura 1d4 com ervas (com Medicina) por descanso longo.",
          "skillBonusesText": "Medicina +10, Natureza +5",
          "skillBonuses": [
            {
              "skill": "Medicina",
              "value": 10
            },
            {
              "skill": "Natureza",
              "value": 5
            }
          ],
          "ability": "o Curandeiro Hadira: Cura doenças menores e 1d4 em aliados. | Herbalista do Khamisat: Encontra ervas medicinais com vantagem em Natureza.",
          "weakness": "Fraqueza de -10 em Intimidação.",
          "weaknessBonuses": [
            {
              "skill": "Intimidação",
              "value": -10
            }
          ]
        },
        {
          "id": "ahouma",
          "name": "Ahouma",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Ahoumé",
          "description": "Os Ahouma são caçadores e domadores do Khamisat, vivendo em sintonia com a fauna das savanas. Suas lanças são ferramentas de sobrevivência e defesa.",
          "weapon": "Lança Ahouma (Arma de Haste) – 1d8 perfurante, precisa usar as duas mãos, 5 em Rastrear presas e -10 de CA do alvo ferido desde o último descanso longo.",
          "skillBonusesText": "Lidar com Animais +10, Sobrevivência +5",
          "skillBonuses": [
            {
              "skill": "Lidar com Animais",
              "value": 10
            },
            {
              "skill": "Sobrevivência",
              "value": 5
            }
          ],
          "ability": "o Domador Ahouma: Comanda animal selvagem temporariamente. | Caçador da Savana: Vantagem em Rastrear e Sobrevivência e Navegar em rios.",
          "weakness": "Penalidade de -10 em Contabilidade.",
          "weaknessBonuses": [
            {
              "skill": "Contabilidade",
              "value": -10
            }
          ]
        },
        {
          "id": "rashidun",
          "name": "Rashidun",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Rashidi",
          "description": "Os Rashidun são fiéis devotos do Khamisat, guiados por sua fé e conhecimento histórico. Suas palavras inspiram coragem e reverência em rituais sagrados.",
          "weapon": "Sabre Rashidun (Arma Curta) – 1d6 cortante e Para derrubar adversários ou realizar quaisquer outras manobras em combate, o teste oposto deve superar o seu em um passo, em vez de apenas igualá-lo.",
          "skillBonusesText": "Religião +10, História +5",
          "skillBonuses": [
            {
              "skill": "Religião",
              "value": 10
            },
            {
              "skill": "História",
              "value": 5
            }
          ],
          "ability": "o Fiel Rashidun: +10 de Tática, e Ignora terreno difícil em formação. | Erudito da Fé: Vantagem em História,Religião e Intimidação.",
          "weakness": "Penalidade de -10 em Blefar.",
          "weaknessBonuses": [
            {
              "skill": "Blefar",
              "value": -10
            }
          ]
        },
        {
          "id": "zaghari",
          "name": "Zaghari",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "nativeLanguage": "Zagharim",
          "description": "Os Zaghari são cavaleiros do Khamisat, liderando cargas com arcos e táticas precisas. Sua mobilidade os torna temidos em batalhas abertas.",
          "weapon": "Arco Zaghari (Arco Composto) – 1d10 perfurante; +10 em Diplomacia.",
          "skillBonusesText": "Cavalgar +10, Tática +5",
          "skillBonuses": [
            {
              "skill": "Cavalgar",
              "value": 10
            },
            {
              "skill": "Tática",
              "value": 5
            }
          ],
          "ability": "o Cavaleiro Zaghari: Ganha velocidade extra em montaria (+3m). | Líder de Carga: +10 em Tática para carga montada.",
          "weakness": "Penalidade de -10 em Disfarce.",
          "weaknessBonuses": [
            {
              "skill": "Disfarce",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "j-ritmo-do-tambor",
          "name": "Ritmo Do Tambor",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO J - RITMO DO TAMBOR O personagem acerta um ataque físico com a mão, punho, palma, cotovelo, escudo leve ou golpe corporal próximo. Depois do acerto, ele pode gastar sua ação bônus e os PM da Magia Impacto para ativar o Ritmo do Tambor. O alvo sofre o dano normal da Impacto. Além disso, o próximo teste de manobra física feito contra esse mesmo alvo até o início do próximo turno do conjurador recebe bônus. Manobras físicas incluem: • Derrubar; • Empurrar; • Agarrar; • Desarmar; • Imobilizar; • impedir passagem;",
          "levels": [
            {
              "level": 1,
              "text": "Depois de acertar um ataque físico próximo com mão, punho, palma ou golpe corporal, você pode gastar sua ação bônus para causar 1d8 de dano contundente mágico. O próximo teste de manobra física feito por você contra esse alvo antes do início do seu próximo turno recebe +5. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Impacto até 9m. Se for lançada à distância, causa apenas o dano da magia; o bônus de manobra só se aplica se o alvo estiver a até 3m de você. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d8 de dano. O bônus na próxima manobra física contra o alvo aumenta para +10. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar, o alvo faz CON. Se falhar, fica atordoado por 1 turno. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 3d8 de dano. Você pode adicionar uma Finta, dificultando a Esquiva em 10 e negando cobertura parcial, ou pode manter o bônus de manobra. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode descarregar o ritmo ao redor do corpo. Criaturas escolhidas em até 3m de diâmetro fazem CON; em falha, são empurradas 1,5m e sofrem -5 no próximo teste oposto de manobra física feito contra elas até o início do seu próximo turno. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 4d8 de dano. O bônus na próxima manobra física contra o alvo aumenta para +15. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você realiza um golpe pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Se o alvo falhar em CON, o próximo aliado que tentar uma manobra física contra ele recebe +5. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 5d8, ou 5d10 com ação padrão. Se o alvo já estiver sangrando, ferido desde o último descanso longo ou tiver sido rastreado por você nessa cena, o bônus de manobra pode ser usado por um aliado em vez de você. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON é de 4,5m, o teste para resistir é dificultado em 20, e se usar ação padrão os dados se tornam d12. O bônus de manobra permanece +15, mas pode ser aplicado a qualquer aliado que aja contra o alvo antes do início do seu próximo turno. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "j-peso-do-veredito",
          "name": "Peso Do Veredito",
          "regionCode": "J",
          "region": "Al-Gharbura e Khamisat",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO J - PESO DO VEREDITO O conjurador pronuncia uma acusação, sentença, provérbio, verso sagrado, regra tribal ou palavra de julgamento. Se o alvo falhar em POD, ele sofre a penalidade da Densa em um teste oposto antes do início do próximo turno do conjurador. Esse teste oposto pode ser: • Blefar contra Intuição; • Persuasão contra Direito; • Intimidação contra Religião ou Coragem; • Derrubar contra Atletismo; • Desarmar contra Lutar; • Agarrar contra FOR; • resistir a uma manobra física; • defender-se de uma acusação ou julgamento.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você declara um Veredito contra um alvo em uma área de 3m de diâmetro. O alvo resiste com POD. Se falhar, sofre 1d10 de penalidade no próximo teste oposto feito contra você ou contra um aliado seu até o início do seu próximo turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Em vez de reduzir movimento, o Veredito pode pesar sobre uma defesa ativa. Se o alvo afetado tentar Esquivar ou Aparar uma ação de alguém que ele atacou, feriu, enganou ou ameaçou nesta cena, sofre a penalidade da Densa nesse teste. Consome",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N1",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "PM. A penalidade aumenta para 2d10. O Veredito pode ser lançado em cone de 4,5m ou área de 3m de diâmetro. Dura 2 turnos, consumindo 1 PM por turno mantido. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao Veredito. Normalmente são aliados, membros da mesma caravana, testemunhas protegidas ou companheiros de julgamento.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode usar o Peso do Veredito como reação quando um alvo tentar Blefar, Intimidar, fugir de uma acusação, resistir a uma manobra ou Aparar/Esquivar contra alguém que ele feriu nesta cena. Se falhar em POD, sofre 3d10 de penalidade naquela ação. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "O Veredito passa a afetar manobras com mais força. Se o alvo afetado tentar resistir a Derrubar, Desarmar, Agarrar ou Empurrar, sofre a penalidade da Densa no teste oposto. Se o alvo estiver marcado narrativamente como “injusto” pela cena, o mestre pode permitir que a penalidade seja aplicada mesmo fora do alcance inicial, desde que o conflito ainda esteja acontecendo.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A penalidade aumenta para 4d10. Se o alvo falhar em um teste oposto por causa do Veredito, sofre 2d6 de dano mágico Denso. Se resistir ao Veredito, não sofre esse dano. Consome 6 PM e PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano aumenta para 2d8. Se o alvo falhar em Blefar, Intimidação injusta, Esquivar, Aparar ou resistir a uma manobra por causa do Veredito, ele também sofre -10 no próximo teste social contra testemunhas da cena até o fim do encontro. Consome 6 PM e 3 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano para 3d8. Se o alvo tiver eliminado outro ser nesta cena, testes contra ele enquanto estiver afetado pelo Veredito recebe +5. Consome 8 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Os dados de penalidade se tornam d12, o dano aumenta para 4d8, e o usuário recebe +20 em SAB para resistir ou interferir em Mundo , quando a disputa envolver julgamento, acusação, honra, reparação, mentira, fé ou veredito dentro da cena. Consome 12 PM e 5 PM para manter.",
              "activationCost": 12,
              "maintenanceCost": 5,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "K",
      "name": "Paleneus",
      "label": "Região K - Paleneus",
      "cultures": [
        {
          "id": "yamshu",
          "name": "Yamshu",
          "regionCode": "K",
          "region": "Paleneus",
          "nativeLanguage": "Yamshu’a; Hadurit",
          "description": "Os Yamshu são guardiões espirituais da Paleneus, conectados a rituais e profecias antigas. Sua fé os guia em terras marcadas por conflitos sagrados.",
          "weapon": "Adaga Yamshu (Arma Curta) – 1d4 perfurante; +5 em Lutar (Culturais) e Religião.",
          "skillBonusesText": "Religião +10, História +5",
          "skillBonuses": [
            {
              "skill": "Religião",
              "value": 10
            },
            {
              "skill": "História",
              "value": 5
            }
          ],
          "ability": "o Profeta Yamshu: +15 de Persuasão para uma multidão pequena. | Guardião Sagrado: +15 em Percepção.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        },
        {
          "id": "haduri",
          "name": "Haduri",
          "regionCode": "K",
          "region": "Paleneus",
          "nativeLanguage": "Hadurit; Yamshu’a",
          "description": "Os Haduri são nômades resilientes da Palestina, encontrando água e recursos em terras áridas. Sua habilidade de rastrear os torna guias indispensáveis.",
          "weapon": "Lança Haduri (Arma de Haste) – 1d6 perfurante; Vantagem em Sobrevivência.",
          "skillBonusesText": "Sobrevivência +10, Rastrear +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Rastrear",
              "value": 5
            }
          ],
          "ability": "o Nômade Haduri: Encontra água em áreas secas automaticamente. | Rastreador do Deserto: Vantagem em Encontrar, Escutar e Rastrear.",
          "weakness": "Penalidade de -10 em Cavalgar.",
          "weaknessBonuses": [
            {
              "skill": "Cavalgar",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "k-gua-da-alian-a",
          "name": "Água Da Aliança",
          "regionCode": "K",
          "region": "Paleneus",
          "baseType": "Etérea",
          "regional": true,
          "description": "REGIÃO K - ÁGUA DA ALIANÇA Quando uma cura rolar dados de cura, o conjurador pode dividir o total curado entre alvos próximos dentro do alcance permitido. Nenhum alvo pode receber menos de",
          "levels": [
            {
              "level": 1,
              "text": "PV, e a divisão não aumenta o total curado, apenas distribui melhor. Vida temporária também pode ser dividida, quando o nível permitir. Esse efeito não cura mortos, não cria água real do nada e não remove sede automaticamente, salvo decisão narrativa do Mestre. Cura 1d8 em si. No Estilo Paleneu, se houver um aliado adjacente ferido, você pode dividir o resultado da cura entre você e esse aliado. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Pode curar um alvo em 1d6. Você pode dividir essa cura entre até 2 alvos adjacentes entre si. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Cura 2d8 em si, ou concede 5 de vida temporária em si ou em alvos. Você pode fazer a cura ou vida temporária ser dividida entre até 2 alvos em até 3m. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Cura 2d6 em um alvo, além de doenças leves, sangramento e envenenamento. Se remover sangramento, envenenamento ou doença leve de um alvo, outro alvo adjacente recebe +5 no próximo teste contra a mesma fonte até o fim da cena. Consome PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Cura 3d8 em si, cura 2d6 em alvos em até 3m, ou concede 10 de vida temporária. Você pode dividir a vida temporária entre até 3 alvos em até 3m. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Pode curar um alvo em 3d6. Você pode dividir essa cura entre até 3 alvos em até 3m. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Cura 4d8 em si, ou concede 15 de vida temporária. Também pode remover Lesão Grave. Ao remover Lesão Grave, você pode conceder 5 de vida temporária a outro aliado em até 3m. Consome 7 PM.",
              "activationCost": 7,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Pode curar um alvo em 4d6. Você pode dividir essa cura entre até 4 alvos em até 3m, mas apenas um deles pode receber mais da metade do total curado. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Cura 5d8 em si, além de poder curar doenças raras em 1d4 horas. Durante esse tratamento prolongado, até 1d4 aliados que ajudarem no cuidado recebem +5 em Medicina, Religião ou Sobrevivência relacionados ao tratamento, à viagem ou à manutenção do paciente. Consome 9 PM.",
              "activationCost": 9,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Pode curar um alvo em 6d6 ou conceder 25 de vida temporária. A cura ou vida temporária pode ser dividida entre até 5 alvos em até 6m. Se todos os alvos receberem ao menos 1 ponto de cura ou vida temporária, eles podem remover sangramento ou envenenamento. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "k-voz-do-press-gio",
          "name": "Voz Do Presságio",
          "regionCode": "K",
          "region": "Paleneus",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO K - VOZ DO PRESSÁGIO Ao usar a Voz do Presságio, o personagem anuncia um perigo imediato e concreto. Exemplos válidos: “Ele vai mirar no ferido.”; “Não deixem que atravesse a porta.”; “A lança virá pela esquerda.”; “Ele tentará fugir pelo beco.”; “Protejam o carregador de água.”; “A primeira lâmina será uma finta.” Exemplos ruins: “Tudo dará errado.”; “Ninguém vai vencer.”; “Não façam nada.”; “Todos os inimigos vão falhar.”; “Eu prevejo toda a batalha.”",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você anuncia um perigo concreto envolvendo um alvo em uma área de 3m de diâmetro. O alvo resiste com POD. Se falhar e realizar a ação prevista até o início do seu próximo turno, sofre 1d10 de penalidade no teste relacionado. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Em vez de reduzir movimento genericamente, o Presságio afeta travessia perigosa. Se o alvo afetado tentar atravessar uma porta, corredor, vau, ponte, passagem estreita ou aproximar-se de um aliado que você avisou, sofre a penalidade da Densa no teste relacionado à ação, se houver. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A penalidade aumenta para 2d10. O Presságio pode ser lançado em cone de 4,5m ou área de 3m de diâmetro. Dura 2 turnos, consumindo 1 PM por turno mantido. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao Presságio. Normalmente são aliados, familiares, peregrinos, membros da tenda ou guardas avisados.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode usar a Voz do Presságio como reação quando um inimigo declarar ataque, fuga, manobra, travessia, Esquiva, Aparar ou uma ação que você consiga anunciar em uma frase curta. Se o alvo falhar em POD, sofre 3d10 de penalidade naquela ação. A partir deste nível, mantém a interação normal da Densa com Mundo. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Se o Presságio afetar uma ação contra um aliado que ouviu claramente seu aviso, esse aliado recebe +5 em Esquivar, Aparar ou resistir à manobra contra aquela ação. Esse bônus só vale contra o perigo anunciado. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A penalidade aumenta para 4d10. Se o alvo falhar na ação prevista por causa do Presságio, sofre 2d6 de dano mágico Denso. Se resistir ao Presságio, não sofre esse dano. Consome PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N6",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano aumenta para 2d8. Se o alvo previsto tentar enganar, fintar ou blefar contra alguém que ouviu o Presságio, sofre metade da penalidade da Densa também em Blefar ou Lábia naquela ação. Consome 6 PM e 3 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano para 3d8. Se a ação prevista envolver atacar um alvo ferido, atravessar uma passagem protegida ou fugir carregando algo importante, a penalidade também se aplica ao primeiro teste de Esquivar ou Aparar do alvo até o início do próximo turno dele. Consome 8 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Os dados de penalidade se tornam d12, o dano aumenta para 4d8, e o usuário recebe +20 em SAB para resistir ou interferir em Mundo quando a disputa envolver presságio, proteção de aliados avisados, travessia, promessa, fuga ou perigo anunciado dentro da cena. Aliados que ouviu o aviso aumentam em +10 em Esquivar, Aparar ou resistir à manobra contra aquela ação. Consome 12 PM e 5 PM para manter.",
              "activationCost": 12,
              "maintenanceCost": 5,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "L",
      "name": "Akhet e Habash",
      "label": "Região L - Akhet e Habash",
      "cultures": [
        {
          "id": "kemetiu",
          "name": "Kemetiu",
          "regionCode": "L",
          "region": "Akhet e Habash",
          "nativeLanguage": "Kemetit; Axumet; Al-Masafir",
          "description": "Os Kemetiu são arquitetos e cronistas do Akhet, construindo monumentos grandiosos e preservando lendas antigas. Sua cultura é um farol de conhecimento.",
          "weapon": "Khopesh Kemetiu (Arma Curta) – 1d6+1 cortante; desarma oponente em extremos.",
          "skillBonusesText": "História +10, Arte/Ofício +5",
          "skillBonuses": [
            {
              "skill": "História",
              "value": 10
            },
            {
              "skill": "Arte/Ofício",
              "value": 5
            }
          ],
          "ability": "o Construtor Kemetiu: Vantagem em Avaliação, Arte/Ofício e História. | Arquiteto Faraônico: Cria projetos e os constrói com Vantagem em Arte/Ofício.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        },
        {
          "id": "axumai",
          "name": "Axumai",
          "regionCode": "L",
          "region": "Akhet e Habash",
          "nativeLanguage": "Axumet; Kemetit; Al-Masafir",
          "description": "Os Axumai são mercadores e navegadores da Habash, dominando rotas fluviais e mercados exóticos. Sua riqueza vem do comércio de especiarias e pedras.",
          "weapon": "Lança Axumai (Arma de Haste) – 1d6 perfurante e +1d8 de dano perfurante em Armaduras Leves.",
          "skillBonusesText": "Avaliação +10, Navegação +5",
          "skillBonuses": [
            {
              "skill": "Avaliação",
              "value": 10
            },
            {
              "skill": "Navegação",
              "value": 5
            }
          ],
          "ability": "o Mercador Axumai: Vantagem em Avaliação, Lábia e Contabilidade. | Viajante do Nilo: Enquanto estiver navegando, recebe Vantagem em Navegação, Persuasão e Lábia.",
          "weakness": "Penalidade de -10 em Atletismo para escalar montanhas.",
          "weaknessBonuses": [
            {
              "skill": "Atletismo",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "l-c-bito-da-balan-a",
          "name": "Cúbito Da Balança",
          "regionCode": "L",
          "region": "Akhet e Habash",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO L - CÚBITO DA BALANÇA O usuário ativa a Densa como ação bônus O alvo resiste com POD. Se falhar, sofre a penalidade da Densa em ações ligadas a manter postura, segurar arma, resistir a desarme, aparar ou realizar manobras contra o usuário.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você projeta Energia Densa a partir do corpo em uma área de 3m de diâmetro. Alvos afetados resistem com POD. Se falharem, sofrem 1d10 de penalidade em testes para resistir a Desarmar, Derrubar, Empurrar ou Agarrar feitos por você até o início do seu próximo turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "O Cúbito da Balança prejudica a postura. Um alvo afetado que tente Aparar ou resistir a Desarmar sofre a penalidade da Densa nesse teste. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A penalidade aumenta para 2d10. Pode ser usada em cone de 4,5m ou área de 3m de diâmetro. Dura 2 turnos, consumindo 1 PM por turno mantido. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao Cúbito da Balança.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode usar o Cúbito da Balança como reação quando um alvo a até 3m tentar Aparar, Bloquear com arma, resistir a Desarmar ou realizar uma manobra contra você. Se falhar em POD, sofre 3d10 de penalidade nessa ação. A partir deste nível, mantém a interação normal da Densa com Mundo. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Se você estiver usando khopesh, foice-espada, lâmina curva ou arma cultural kemetiu, um alvo afetado pelo Cúbito da Balança sofre -5 para resistir a Desarmar além da penalidade normal da Densa. Esse -5 só vale contra uma tentativa por rodada.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A penalidade aumenta para 4d10. Se o alvo falhar em resistir a Desarmar, Derrubar ou Empurrar por causa da penalidade, sofre 2d6 de dano mágico Denso, representando a pressão da própria postura quebrada. Se resistir à Densa, não sofre esse dano. Consome 6 PM e 2 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano aumenta para 2d8. Se o alvo for desarmado enquanto afetado pelo Cúbito da Balança, ele sofre -5 no próximo teste de Lutar até o início do próximo turno dele, pois precisa recuperar o eixo corporal. Consome 6 PM e 3 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano para 3d8. Se o alvo estiver usando escudo, arma pesada ou arma de haste, você pode aplicar a penalidade da Densa também no primeiro teste dele para manter a guarda contra você. Consome 8 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Os dados de penalidade se tornam d12, o dano aumenta para 4d8, e você recebe +20 em SAB para resistir ou interferir em Mundo. Consome 12 PM e 5 PM para manter.",
              "activationCost": 12,
              "maintenanceCost": 5,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "l-pulso-de-adulis",
          "name": "Pulso De Adulis",
          "regionCode": "L",
          "region": "Akhet e Habash",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO L - PULSO DE ADULIS O personagem precisa tocar com a mão uma superfície ou objeto firme. Ele pode usar no chão, convés, remo, mastro, escudo, caixa de carga, parede, porta, lança segurada, borda de barco, pedra de cais e etc... Ele gasta ação bônus e PM da Impacto. O Pulso viaja pelo contato físico e afeta um alvo próximo à superfície ou ao objeto tocado.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, depois de tocar com a mão uma superfície firme ou objeto segurado, você libera um Pulso de Impacto contra um alvo a até 1m dessa superfície ou objeto. O alvo sofre 1d8 de dano contundente mágico. Se estiver em barco, doca, ponte, carroça ou superfície instável, o alvo faz CON; se falhar, sofre -5 no próximo teste de Atletismo, Cavalgar ou Navegação até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Impacto até 9m. Se o Pulso for conduzido por superfície contínua tocada por você, ele pode alcançar um alvo a até 9m que esteja sobre a mesma superfície. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d8 de dano. Se o alvo estiver carregando carga, escudo, remo, ferramenta ou arma de haste, ele sofre -5 no próximo teste para manter posse, equilíbrio ou controle desse objeto em falha de CON. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar o Pulso, o alvo faz CON. Se falhar, fica atordoado por 1 turno. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 3d8 de dano. Você pode adicionar uma Finta, dificultando Esquiva em 10 e negando cobertura parcial, ou pode usar o Pulso para proteger carga: um objeto, caixa, vela, remo, leme ou porta tocada por você recebe 5 de proteção contra dano físico até o início do seu próximo turno. Escolha um dos efeitos. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode descarregar o Pulso por uma superfície em até 3m de diâmetro. Criaturas escolhidas por você sobre essa superfície fazem CON; em falha, são empurradas 1m e sofrem metade do dano. Apenas um alvo principal sofre dano completo. Consome PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 4d8 de dano. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você realiza um Pulso pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Se o Pulso for conduzido por convés, mastro, porta, pedra ou estrutura, você não é empurrado; a superfície absorve o recuo. Consome PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N7",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 5d8, ou 5d10 com ação padrão. Ao usar o Pulso em uma superfície de barco, ponte, porta ou carroça, você pode escolher até 2 alvos secundários; eles fazem CON e sofrem metade do dano em falha. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON se torna 4,5m, o teste para resistir é dificultado em 20, e se usar ação padrão os dados se tornam d12. Além disso, quando usado para proteger carga, porta, leme, mastro ou estrutura tocada, a proteção aumenta para 10 contra dano físico até o início do seu próximo turno. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "M",
      "name": "Al-Ardura",
      "label": "Região M - Al-Ardura",
      "cultures": [
        {
          "id": "masafir",
          "name": "Masafir",
          "regionCode": "M",
          "region": "Al-Ardura",
          "nativeLanguage": "Al-Masafir",
          "description": "Os Masafir são nômades do deserto, traçando rotas comerciais através de areias escaldantes. Sua resistência ao calor os torna viajantes inigualáveis.",
          "weapon": "Cimitarra Masafir (Arma Curta) – 1d6 cortante e causa 1d4 de sangramento.",
          "skillBonusesText": "Navegação +10, Sobrevivência +5",
          "skillBonuses": [
            {
              "skill": "Navegação",
              "value": 10
            },
            {
              "skill": "Sobrevivência",
              "value": 5
            }
          ],
          "ability": "o Viajante Masafir: Não se perde. | Nômade do Deserto: Ignora efeitos de calor extremo.",
          "weakness": "Penalidade de -10 em Lutar (Brigar). REGIÃO M: FACETA FLUIDA Base: Magia Fina A Faceta Fluida usa Cargas de Faceta. Essas Cargas representam a Energia Fina mantida na arma. O Masafir não descarrega toda a energia no primeiro golpe; ele deixa a energia “correr” pela lâmina, ponta ou fio da arma. Regras das Cargas de Faceta: Funcionam com qualquer arma compatível com Magia Fina; A arma precisa ter fio, ponta, lâmina ou extremidade capaz de cortar/perfurar; Não funciona com armas puramente contundentes, salvo se a arma tiver lâmina ou ponta adequada; As Cargas são criadas ao ativar a magia; Cada uso de Carga exige o custo em PM indicado; Se a arma for solta, arrancada ou destruída, as Cargas se perdem; Só uma Carga pode ser usada por rodada até o nível 9, salvo se a tabela disser o contrário; As Cargas não são “Eco”. O Eco descarrega um corte extra; a Faceta mantém a energia circulando na arma. Ao gastar uma Carga, o usuário escolhe um dos efeitos abaixo. • Corte de Correção: Depois de errar um ataque com a arma imbuída, você pode gastar 1 Carga para refazer o movimento da lâmina, realizando um segundo ataque contra o mesmo alvo com penalidade. • Corte de Retorno: Depois de acertar um ataque com a arma imbuída, você pode gastar 1 Carga para fazer um golpe rápido de retorno contra o mesmo alvo ou contra outro alvo adjacente. • Corte de Junta: Contra alvo usando armadura média, armadura pesada ou escudo, você pode gastar 1 Carga para mirar juntas, axilas, frestas ou pontos fracos. O ataque ignora parte da CA do alvo. 1 Com uma ação bônus, você imbui uma arma compatível com Magia Fina, causando 1d6 de dano cortante mágico. Você recebe 1 Carga de Faceta. Pode gastar essa Carga para usar Corte de Correção ou Corte de Retorno, com -15 no teste de ataque. Se acertar, causa o dano da arma e mágico. Consome 1 PM e 1 PM para ativar a Carga. 2 Você pode lançar a Magia Fina até 9m. As Cargas de Faceta só podem ser usadas em ataques feitos com a arma imbuída. Consome 1 PM. 3 A magia causa 2d6 de dano. O Corte de Correção e o Corte de Retorno passam a sofrer apenas -10 no teste de ataque. O Corte de Junta ignora 5 de CA contra armaduras médias, pesadas ou escudos. Consome 2 PM. 4 Se estiver em espaço aberto o bastante para girar ou reposicionar a arma, o Corte de Retorno pode atingir outro alvo adjacente. Em local apertado, corredor estreito ou multidão travada, só pode atingir o mesmo alvo. 5 A magia causa 2d8 de dano e a arma pode permanecer imbuída por 4 turnos. Você recebe 4 Cargas de Faceta. Enquanto a arma estiver imbuída, pode gastar 1 Carga por rodada. O Corte de Correção ou Retorno contra o mesmo alvo não sofre penalidade; contra outro alvo adjacente sofre -10. Consome 4 PM, 1 PM por turno mantido e 2 PM para ativar cada Carga. 6 Quando usar Corte de Junta contra armadura média, pesada ou escudo, o ataque ignora 10 de CA se for contra o mesmo alvo que você atacou no início do turno. Esse efeito só pode ocorrer uma vez por rodada. 7 A magia causa 3d8 de dano. Quando o Corte de Retorno acertar o mesmo alvo do ataque principal, causa também +1d4 de dano cortante mágico. Consome 5 PM e 2 PM para ativar cada Carga. 8 Você aprende a Hélice de Fina. Em vez de criar uma arma natural de Magia Fina, você pode girar ou conduzir a arma imbuída em um arco rápido de Energia Fina. Escolha até 2 alvos adjacentes ao seu alcance. Faça um ataque contra cada um. O primeiro alvo sofre o dano normal da arma + 3d6 de dano cortante mágico; o segundo sofre o dano da arma e metade do dano mágico, esse ataque custa 2 Cargas. Consome 4 PM e dura apenas o giro. 9 A magia causa 4d8 de dano. Você recebe 5 Cargas de Faceta. Uma vez por rodada, ao usar Corte de Junta, pode ignorar 10 de CA contra armadura média, pesada ou escudo, mesmo se for o primeiro ataque contra aquele alvo. Consome 8 PM, 3 PM por turno mantido e 3 PM para ativar cada Carga. 10 A arma natural da Magia Fina pode ser usada normalmente, se o jogador preferir. Você também pode aperfeiçoar a Hélice de Fina: ela pode atingir até 3 alvos adjacentes, mas apenas um recebe o dano mágico completo. Você recebe 6 Cargas de Faceta e pode gastar até 2 Cargas por rodada. 8 PM e 3 PM para ativar cada Carga.",
          "weaknessBonuses": [
            {
              "skill": "Lutar (Brigar). REGIÃO M: FACETA FLUIDA Base: Magia Fina A Faceta Fluida usa Cargas de Faceta. Essas Cargas representam a Energia Fina mantida na arma. O Masafir não descarrega toda a energia no primeiro golpe; ele deixa a energia “correr” pela lâmina, ponta ou fio da arma. Regras das Cargas de Faceta: Funcionam com qualquer arma compatível com Magia Fina; A arma precisa ter fio, ponta, lâmina ou extremidade capaz de cortar/perfurar; Não funciona com armas puramente contundentes, salvo se a arma tiver lâmina ou ponta adequada; As Cargas são criadas ao ativar a magia; Cada uso de Carga exige o custo em PM indicado; Se a arma for solta, arrancada ou destruída, as Cargas se perdem; Só uma Carga pode ser usada por rodada até o nível 9, salvo se a tabela disser o contrário; As Cargas não são “Eco”. O Eco descarrega um corte extra; a Faceta mantém a energia circulando na arma. Ao gastar uma Carga, o usuário escolhe um dos efeitos abaixo. • Corte de Correção: Depois de errar um ataque com a arma imbuída, você pode gastar 1 Carga para refazer o movimento da lâmina, realizando um segundo ataque contra o mesmo alvo com penalidade. • Corte de Retorno: Depois de acertar um ataque com a arma imbuída, você pode gastar 1 Carga para fazer um golpe rápido de retorno contra o mesmo alvo ou contra outro alvo adjacente. • Corte de Junta: Contra alvo usando armadura média, armadura pesada ou escudo, você pode gastar 1 Carga para mirar juntas, axilas, frestas ou pontos fracos. O ataque ignora parte da CA do alvo. 1 Com uma ação bônus, você imbui uma arma compatível com Magia Fina, causando 1d6 de dano cortante mágico. Você recebe 1 Carga de Faceta. Pode gastar essa Carga para usar Corte de Correção ou Corte de Retorno, com -15 no teste de ataque. Se acertar, causa o dano da arma e mágico. Consome 1 PM e 1 PM para ativar a Carga. 2 Você pode lançar a Magia Fina até 9m. As Cargas de Faceta só podem ser usadas em ataques feitos com a arma imbuída. Consome 1 PM. 3 A magia causa 2d6 de dano. O Corte de Correção e o Corte de Retorno passam a sofrer apenas -10 no teste de ataque. O Corte de Junta ignora 5 de CA contra armaduras médias, pesadas ou escudos. Consome 2 PM. 4 Se estiver em espaço aberto o bastante para girar ou reposicionar a arma, o Corte de Retorno pode atingir outro alvo adjacente. Em local apertado, corredor estreito ou multidão travada, só pode atingir o mesmo alvo. 5 A magia causa 2d8 de dano e a arma pode permanecer imbuída por 4 turnos. Você recebe 4 Cargas de Faceta. Enquanto a arma estiver imbuída, pode gastar 1 Carga por rodada. O Corte de Correção ou Retorno contra o mesmo alvo não sofre penalidade; contra outro alvo adjacente sofre -10. Consome 4 PM, 1 PM por turno mantido e 2 PM para ativar cada Carga. 6 Quando usar Corte de Junta contra armadura média, pesada ou escudo, o ataque ignora 10 de CA se for contra o mesmo alvo que você atacou no início do turno. Esse efeito só pode ocorrer uma vez por rodada. 7 A magia causa 3d8 de dano. Quando o Corte de Retorno acertar o mesmo alvo do ataque principal, causa também +1d4 de dano cortante mágico. Consome 5 PM e 2 PM para ativar cada Carga. 8 Você aprende a Hélice de Fina. Em vez de criar uma arma natural de Magia Fina, você pode girar ou conduzir a arma imbuída em um arco rápido de Energia Fina. Escolha até 2 alvos adjacentes ao seu alcance. Faça um ataque contra cada um. O primeiro alvo sofre o dano normal da arma + 3d6 de dano cortante mágico; o segundo sofre o dano da arma e metade do dano mágico, esse ataque custa 2 Cargas. Consome 4 PM e dura apenas o giro. 9 A magia causa 4d8 de dano. Você recebe 5 Cargas de Faceta. Uma vez por rodada, ao usar Corte de Junta, pode ignorar 10 de CA contra armadura média, pesada ou escudo, mesmo se for o primeiro ataque contra aquele alvo. Consome 8 PM, 3 PM por turno mantido e 3 PM para ativar cada Carga. 10 A arma natural da Magia Fina pode ser usada normalmente, se o jogador preferir. Você também pode aperfeiçoar a Hélice de Fina: ela pode atingir até 3 alvos adjacentes, mas apenas um recebe o dano mágico completo. Você recebe 6 Cargas de Faceta e pode gastar até 2 Cargas por rodada. 8 PM e 3 PM para ativar cada Carga",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "m-sopro-do-simum",
          "name": "Sopro Do Simum",
          "regionCode": "M",
          "region": "Al-Ardura",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO M - SOPRO DO SIMUM O Sopro do Simum serve para afastar inimigos próximos e impedir que lhe cerquem.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você libera Impacto pela palma da mão, punho ou toque no cabo da lança. Um alvo a até 1m sofre 1d8 de dano contundente mágico. Se falhar em CON, é empurrado 1m. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar o Impacto até 9m. No Estilo Masafir, o lançamento parece uma pancada seca de ar quente. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d8 de dano. Se o alvo for empurrado pelo Sopro do Simum, você pode se mover 3m sem provocar ataque de oportunidade desse alvo, apenas para recuperar espaço. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar, o alvo faz CON. Se falhar, fica atordoado por 1 turno. No Estilo Masafir, isso representa perda de fôlego pelo choque seco. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 3d8 de dano. Você pode escolher entre uma Finta, dificultando Esquiva em 10, ou o Sopro Aberto: se o alvo falhar em CON, além de ser empurrado, sofre -5 no próximo ataque contra você até o início do seu próximo turno. Consome PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N4",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode liberar o Sopro em uma meia-lua ao seu redor. Criaturas escolhidas em até 3m de diâmetro fazem CON; em falha, são empurradas 3m e sofrem metade do dano. Um alvo principal sofre dano completo. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 4d8 de dano. O empurrão aumenta para 6m em falha de CON. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você realiza um Sopro pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Você é empurrado 3m, mas não provoca ataque de oportunidade do alvo atingido. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 5d8, ou 5d10 com ação padrão. Se usar o Sopro para abrir espaço e em seguida atacar com uma lança curta de duas pontas até o fim do seu próximo turno, recebe +5 no primeiro teste de Lutar com a lança contra um alvo que tenha sido empurrado. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON se torna 4,5m, o teste para resistir é dificultado em 20, e se usar ação padrão os dados se tornam d12. Se três ou mais inimigos forem afetados pelo Sopro em área, você recupera espaço suficiente para usar Cargas de Faceta até o início do seu próximo turno, mesmo que estivesse parcialmente cercado. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "N",
      "name": "Mingora",
      "label": "Região N - Mingora",
      "cultures": [
        {
          "id": "sunan",
          "name": "Sunan",
          "regionCode": "N",
          "region": "Mingora",
          "nativeLanguage": "Sunanyu",
          "description": "Os Sunan são artistas e curandeiros da Mingora, criando obras-primas e praticando medicina tradicional. Sua cultura valoriza a harmonia e a precisão.",
          "weapon": "Jian Sunan (Espada Curta) – 1d6 cortante e caso apare, pode utilizar sua reação para desferir um golpe no adversário com +2 de dano no ataque.",
          "skillBonusesText": "Arte/Ofício +10, Medicina +5",
          "skillBonuses": [
            {
              "skill": "Arte/Ofício",
              "value": 10
            },
            {
              "skill": "Medicina",
              "value": 5
            }
          ],
          "ability": "o Artista Sunan: Cria item improvisado com vantagem em Ofício. | Curandeiro Tradicional: Cura ferimentos leves com acupuntura sem custo.",
          "weakness": "Penalidade de -10 em Intimidação.",
          "weaknessBonuses": [
            {
              "skill": "Intimidação",
              "value": -10
            }
          ]
        },
        {
          "id": "xingren",
          "name": "Xingren",
          "regionCode": "N",
          "region": "Mingora",
          "nativeLanguage": "Xinghua",
          "description": "Os Xingren são estrategistas e guerreiros da Mingora, liderando exércitos com guandaos letais. Sua disciplina militar é temida em campos de batalha.",
          "weapon": "Guandao Xingren (Arma de Haste) – 1d10 cortante, precisa usar as duas mãos e gastando sua ação completa, pode desferir ataque em até 3 inimigos desde que eles estejam todos adjacentes.",
          "skillBonusesText": "Tática +10, Lutar (Armas de Haste) +5",
          "skillBonuses": [
            {
              "skill": "Tática",
              "value": 10
            },
            {
              "skill": "Lutar (Armas de Haste)",
              "value": 5
            }
          ],
          "ability": "o Estrategista Xingren: Vantagem em Intuição e Tática. | General Imperial: +10 em Tática para aliados.",
          "weakness": "Penalidade de -10 em Furtividade.",
          "weaknessBonuses": [
            {
              "skill": "Furtividade",
              "value": -10
            }
          ]
        },
        {
          "id": "liren",
          "name": "Liren",
          "regionCode": "N",
          "region": "Mingora",
          "nativeLanguage": "Liwenhua",
          "description": "Os Liren são filósofos e diplomatas da Mingora, resolvendo conflitos com sabedoria e retórica. Sua cultura valoriza o equilíbrio e a persuasão.",
          "weapon": "Dao Liren (Arma Curta) – 1d6 cortante; +3 de dano ao atingir armadura leve",
          "skillBonusesText": "Diplomacia +10, Persuasão +5",
          "skillBonuses": [
            {
              "skill": "Diplomacia",
              "value": 10
            },
            {
              "skill": "Persuasão",
              "value": 5
            }
          ],
          "ability": "o Diplomata Liren: Vantagem em até 3 perícias sociais. | Filósofo Liren: Confere Vantagem em Testes de Sabedoria e testes de Percepção para 1d4 aliados até | fim do próximo descanso curto.",
          "weakness": "Penalidade de -10 em Sobrevivência.",
          "weaknessBonuses": [
            {
              "skill": "Sobrevivência",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "n-tra-o-de-jade",
          "name": "Traço De Jade",
          "regionCode": "N",
          "region": "Mingora",
          "baseType": "Fina",
          "regional": true,
          "description": "REGIÃO N - TRAÇO DE JADE Enquanto a arma estiver imbuída com Traço de Jade, o usuário pode se beneficiar de duas formas principais: • Resposta de Jade: se o usuário Aparar com sucesso um ataque enquanto a arma estiver imbuída, pode usar sua reação para realizar um contra-golpe contra o atacante. Esse contra-golpe segue a progressão da tabela. • Varredura do Guandao: em níveis médios e altos, o usuário pode usar ação completa para transformar o corte em uma varredura, atingindo mais de um inimigo adjacente. Isso conversa diretamente com o Xingren do Patch Note, mas fica preso à Magia Fina e ao gasto de PM.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você imbui sua arma com Energia Fina, causando 1d6 de dano cortante mágico. Enquanto a arma estiver imbuída, se você Aparar com sucesso, pode usar sua reação para realizar a Resposta de Jade contra o atacante. Se acertar, causa apenas o dano normal da arma e +2 de dano físico. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Fina até 9m. A Resposta de Jade só funciona em combate corpo a corpo. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d6 de dano. A Resposta de Jade recebe +5 no teste de ataque contra o alvo aparado. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Se a Resposta de Jade acertar, o alvo sofre -5 no próximo teste de Aparar contra você até o início do seu próximo turno.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 2d8 de dano e pode ficar imbuída por 4 turnos. Você aprende a Varredura do Guandao: com uma ação completa, pode atacar até 2 inimigos adjacentes ao seu alcance. O primeiro alvo sofre o dano normal da arma + dano da Magia Fina; o segundo sofre apenas o dano da arma. A Resposta de Jade passa a aplicar o dano mágico da Magia Fina, mas apenas uma vez por rodada. Consome 4 PM e 1 PM por turno mantido.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 4,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [
                "full"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "text"
              }
            },
            {
              "level": 6,
              "text": "Se você acertar um alvo que tenha sido atingido por sua Resposta de Jade desde o início do seu último turno, recebe +5 em lutar contra esse alvo até o início do seu próximo turno.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 3d8 de dano. A Varredura do Guandao permanece em 2 inimigos adjacentes, mas agora ambos recebem o dano completo.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Em vez de criar uma arma natural. A Resposta de Jade passa a aplicar o dano mágico da Magia Fina, mas duas vezes por rodada. Consome 4 PM e dura apenas o giro.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 4d8 de dano. Agora a Varredura do Guandao: é usada com a ação bonus, atacando ainda até 2 inimigos adjacentes ao seu alcance. Consome 8 PM e 3 PM por turno.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "A arma natural da Magia Fina pode ser usada normalmente se o jogador preferir. No Estilo Mingorano, a Varredura do Guandao pode atingir até 3 alvos adjacentes. Consome 5 PM para arma natural, ou 8 PM para a Fina de nível 10.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "n-meridianos-serenos",
          "name": "Meridianos Serenos",
          "regionCode": "N",
          "region": "Mingora",
          "baseType": "Etérea",
          "regional": true,
          "description": "REGIÃO N - MERIDIANOS SERENOS Quando uma cura de Meridianos Serenos afetar um alvo, o conjurador pode escolher um efeito secundário: • Aliviar Dor: reduz em 5 uma penalidade temporária causada por dor, sangramento, veneno, doença leve, exaustão ou condição corporal. (Não pode aliviar dor se está com vida real cheia) • Firmar Pulso: concede +5 no próximo teste de CON, SAB, Medicina, Intuição ou percepção corporal feito antes do início do próximo turno do conjurador. • Esses efeitos não acumulam entre si. Se o alvo receber Meridianos Serenos várias vezes, fica apenas com o maior benefício.",
          "levels": [
            {
              "level": 1,
              "text": "Cura 1d8 em si. Além disso, você pode aplicar Aliviar Dor em si mesmo, recebe 5 de vida temporária. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Pode curar um alvo em 1d6. O alvo curado pode receber Aliviar Dor, sendo 5 seu valor ou Firmar Pulso, dando 5 de vigor efetivo Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Cura 2d8 em si. O Aliviar Dor ganha aumenta o ganho de vida temporário próprio para +10. Consome 3 PM. Ao entrar em Morrendo pode gastar uma reação para remover a condição, mas permanece inconsciente.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            },
            {
              "level": 4,
              "text": "Cura 2d6 em um alvo, além de doenças leves, sangramento e envenenamento. O valor de vida temporária do aliviar dor mantém em 10, mas para outros também, e o valor de vigor efetivo de firmar pulso aumenta para 10. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Cura 3d8 em si, cura 2d6 em alvos até 3m e concede 6 de vida temporária. Usando ação completa pode manter essa área de cura. Consome 5 PM para ativar e 2PM manter",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [
                "full"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "text"
              }
            },
            {
              "level": 6,
              "text": "Pode curar um alvo em 3d6. O valor de vida temporaria do aliviar dor aumenta para 15, e o valor de vigor efetivo de firmar pulso aumenta para 15. Se o alvo estiver sob penalidade temporária de dor, veneno, sangramento, doença leve, Receoso ou choque, pode reduzir essa penalidade em 10 até o início do seu próximo turno. Consome 6 PM para ativar e continua sendo PM manter.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Cura 4d8 em si,cura 3d6 em alvos até 4m e concede 9 de vida temporária. Também pode remover Lesão Grave. Ao remover Lesão Grave, o alvo recebe +10 no próximo teste físico ou mental diretamente ligado à recuperação desse ferimento. Consome 7 PM para ativar e continua sendo 4PM manter.",
              "activationCost": 7,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Pode curar um alvo em 5d6. O valor de vida temporária do aliviar dor aumenta para 20, e o valor de vigor efetivo de firmar pulso aumenta para 20. O alvo curado pode escolher dois efeitos entre Aliviar Dor e Firmar Pulso, mas os bônus não podem ser usados no mesmo teste. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Cura 5d8 em si,cura 3d8 em alvos até 5m e concede 12 de vida temporária, além de poder curar doenças raras em 1d4 horas, . Durante o tratamento prolongado, o conjurador recebe +10 em Medicina ou Arte/Ofício caso esteja usando agulhas, talas, ervas, compressas ou instrumentos de cura adequados. Consome 9 PM para ativar e continua sendo 6 PM manter.",
              "activationCost": 9,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Pode curar um alvo em 6d6 ou conceder 25 de vida temporária. O valor de vida temporaria do aliviar dor aumenta para 25, e o valor de vigor efetivo de firmar pulso aumenta para 25. O alvo curado pode remover completamente uma penalidade temporária corporal de até -15, ou receber +15 em um teste de CON ou SAB, feito até o início do próximo turno. Consome 12 PM para ativar e 6 para manter.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "O",
      "name": "Kyoden",
      "label": "Região O - Kyoden",
      "cultures": [
        {
          "id": "rajira",
          "name": "Rajira",
          "regionCode": "O",
          "region": "Kyoden",
          "nativeLanguage": "Rajiri",
          "description": "Os Rajira são yogis e sacerdotes da Kyoden, conectados a rituais védicos e à natureza. Sua espiritualidade guia suas ações em tempos de paz e guerra.",
          "weapon": "Talwar Rajira (Arma Curta) – 1d6 cortante e causa 1d4 de sangramento.",
          "skillBonusesText": "Religião +10, Natureza +5",
          "skillBonuses": [
            {
              "skill": "Religião",
              "value": 10
            },
            {
              "skill": "Natureza",
              "value": 5
            }
          ],
          "ability": "o Yogi Rajira: Sua cultura encanta os próximos, ao fazer alimentos culturais, músicas, e apresentações ganha +15 de Persuasão com desconhecido. | Sacerdote Védico: Vantagem em Religião, Natureza e Intuição.",
          "weakness": "Penalidade de -10 em Esquivar.",
          "weaknessBonuses": [
            {
              "skill": "Esquivar",
              "value": -10
            }
          ]
        },
        {
          "id": "bharata",
          "name": "Bharata",
          "regionCode": "O",
          "region": "Kyoden",
          "nativeLanguage": "Bharatiya",
          "description": "Os Bharata são contadores de épicos da Kyoden, encantando multidões com danças e histórias. Sua cultura celebra a arte como expressão da alma.",
          "weapon": "Khanda Bharata (Arma Grande) – 1d8 cortante e causa desvantagem em alvos acertados com extremo.",
          "skillBonusesText": "História +10, Atuação +5",
          "skillBonuses": [
            {
              "skill": "História",
              "value": 10
            },
            {
              "skill": "Atuação",
              "value": 5
            }
          ],
          "ability": "o Contador Bharata: Vantagem em Charme. | Dançarino Épico: Inspira aliados com dança em Atuação, +10 para todos os aliados para uma perícia a sua escolha.",
          "weakness": "Penalidade de -10 em Cavalgar.",
          "weaknessBonuses": [
            {
              "skill": "Cavalgar",
              "value": -10
            }
          ]
        },
        {
          "id": "himalya",
          "name": "Himalya",
          "regionCode": "O",
          "region": "Kyoden",
          "nativeLanguage": "Himaljit",
          "description": "Os Himalya são montanheses da Kyoden, escalando picos sagrados e sobrevivendo em altitudes extremas. Sua conexão com os céus os torna guias espirituais.",
          "weapon": "Kukri Himalya (Arma Curta) – 1d6 cortante e +3 dano em terreno difícil.",
          "skillBonusesText": "Atletismo +10, Sobrevivência +5",
          "skillBonuses": [
            {
              "skill": "Atletismo",
              "value": 10
            },
            {
              "skill": "Sobrevivência",
              "value": 5
            }
          ],
          "ability": "o Montanhês Himalya: Ignora efeitos de Terreno Dificil. | Explorador dos Picos: Vantagem em Rastrear e Atletismo.",
          "weakness": "Penalidade de -10 em Navegação.",
          "weaknessBonuses": [
            {
              "skill": "Navegação",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "o-mudra-do-marma",
          "name": "Mudra Do Marma",
          "regionCode": "O",
          "region": "Kyoden",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO O - MUDRA DO MARMA Quebra de Fôlego é uma desestabilização corporal curta causada pelo Mudra do Marma. Ela pode afetar: Esquivar; Aparar; Lutar/Brigar contra o usuário; Atletismo; testes de FOR ou CON para resistir a empurrão, queda, agarrão, dor, exaustão ou manobra; Bloquear, reduzindo o valor de bloqueio em vez de aplicar penalidade de perícia.",
          "levels": [
            {
              "level": 1,
              "text": "Depois de acertar um ataque desarmado com mão, punho, palma, cotovelo ou golpe corporal próximo, você pode gastar sua ação bônus para causar 1d8 de dano contundente mágico. O alvo faz CON; se falhar, sofre Quebra de Fôlego -5 até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Impacto até 9m. Se usada à distância, causa apenas o dano da Impacto; a Quebra de Fôlego só se aplica se o alvo estiver a até 1,5m de você ou se o mestre permitir uma cena de toque/palma muito clara. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d8 de dano. Se o alvo estiver sob Quebra de Fôlego, o próximo ataque desarmado feito por você contra ele recebe +5 de acerto até o início do seu próximo turno. Consome PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N2",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar o ataque, o alvo faz CON. Se falhar, fica atordoado por 1 turno. No Estilo Rajira, isso representa interrupção de respiração, choque no peito, no queixo, nas costelas ou em ponto vital. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 3d8 de dano. A Quebra de Fôlego aumenta para -10, ou reduz o Bloqueio em 2. Você pode escolher entre aplicar Quebra de Fôlego ou usar uma Finta, dificultando Esquiva em 10 e negando cobertura parcial. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode descarregar a energia em um círculo curto ao redor do corpo. Criaturas escolhidas em até 3m de diâmetro fazem CON; em falha, sofrem metade do dano e Quebra de Fôlego - 5. Um alvo principal sofre o dano completo. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 4d8 de dano. Se um alvo sob Quebra de Fôlego falhar em Esquivar, Aparar, Atletismo, Lutar/Brigar ou resistir a uma manobra contra você, você pode se mover 1,5m sem provocar ataque de oportunidade desse alvo. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você realiza um Mudra Pesado. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Se você estiver desarmado e sem escudo, pode escolher não ser empurrado 1,5m; nesse caso, não pode se mover voluntariamente até o fim do turno. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 5d8, ou 5d10 com ação padrão. A Quebra de Fôlego aumenta para -15, ou reduz o Bloqueio em 3. Se o ataque desarmado for um acerto Extremo, o alvo sofre Desvantagem no próximo teste corporal contra você até o início do seu próximo turno. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON é de 4,5m, o teste para não ser afetado é dificultado em 20, e se usar ação padrão os dados se tornam d12. Uma vez por rodada, quando aplicar Quebra de Fôlego, você pode escolher se ela afetará defesa, manobra ou resistência corporal do alvo. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "o-rasa-do-pico",
          "name": "Rasa Do Épico",
          "regionCode": "O",
          "region": "Kyoden",
          "baseType": "Densa",
          "regional": true,
          "description": "REGIÃO O - RASA DO ÉPICO O usuário dança, canta, declama, toca o chão, realiza uma postura ritual ou encena parte de um épico. Rasa Heroico • A penalidade da Densa se aplica ao próximo ataque ou manobra ofensiva do alvo. Rasa Terrível • A penalidade da Densa se aplica à próxima Esquiva, Aparar ou resistência a uma manobra do alvo. Rasa Sereno • A penalidade da Densa se aplica ao próximo teste de Blefar, Intimidação, Lábia, Charme, Persuasão hostil ou tentativa de quebrar a concentração emocional da cena.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você manifesta Densa a partir do corpo, voz ou gesto em uma área de 3m de diâmetro. Escolha um Rasa: Heroico, Terrível ou Sereno. Alvos afetados resistem com POD. Se falharem, sofrem 1d10 de penalidade na próxima ação ligada ao Rasa escolhido até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Em vez de reduzir movimento, o Rasa afeta ritmo. Se o alvo afetado tentar agir contra o tom da cena — atacar durante Rasa Sereno, fugir de um desafio em Rasa Heroico, ou se defender de uma investida em Rasa Terrível — sofre a penalidade da Densa no teste apropriado, se houver. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A penalidade aumenta para 2d10. O Rasa pode ser lançado em cone de 4,5m ou área de 3m de diâmetro. Dura 2 turnos, consumindo 1 PM por turno mantido. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 1,
              "durationTurns": 2,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Você pode escolher até POD/10 alvos para serem imunes ao Rasa. Normalmente são aliados, músicos, dançarinos, discípulos, monges, guardas ou pessoas que entendem a encenação.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Você pode usar o Rasa como reação quando um alvo a até 6m declarar uma ação ligada ao Rasa escolhido. Se falhar em POD, sofre 3d10 de penalidade naquela ação. A partir daqui, mantém a interação normal da Densa com Mundo. Consome 4 PM e 1 PM para manter.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "reaction",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "reaction",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Se você tiver realizado uma Atuação, canto, dança, postura ritual ou narrativa épica no mesmo turno, pode escolher dois alvos dentro da área para sofrerem a penalidade completa. Os demais afetados sofrem apenas metade da penalidade, arredondada para baixo. Consome 5 PM e 2 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A penalidade aumenta para 4d10. Se o alvo falhar em uma ação por causa do Rasa, sofre 2d6 de dano mágico Denso, representando o corpo cedendo ao peso emocional da cena. Se resistir ao Rasa, não sofre esse dano. Consome 6 PM e 2 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "O dano aumenta para 2d8. Se o Rasa for usado em terreno difícil, templo, palco, salão ritual, caverna sagrada ou passagem de montanha, o usuário recebe +5 em Atuação, Religião ou Atletismo no próximo teste diretamente ligado à cena. Consome 6 PM e 2 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 2,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A penalidade aumenta para 5d10 e o dano para 3d8. Se um alvo afetado for atingido por um acerto Extremo enquanto estiver sob o Rasa, ele sofre Desvantagem na próxima ação ligada ao Rasa escolhido até o início do próximo turno dele. Consome 7 PM e 3 PM para manter.",
              "activationCost": 7,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Os dados de penalidade se tornam d12, o dano aumenta para 4d8, e o usuário recebe +20 em SAB para resistir ou interferir em Mundo quando a disputa envolver emoção, encenação, ritmo, narrativa, devoção, serenidade ou domínio da cena. Consome 8 PM e 4 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 4,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "P",
      "name": "Arashiko",
      "label": "Região P - Arashiko",
      "cultures": [
        {
          "id": "sorai",
          "name": "Sorai",
          "regionCode": "P",
          "region": "Arashiko",
          "nativeLanguage": "Sorainago",
          "description": "Os Sorai são samurais do Arashiko, cuja honra e destreza com katanas definem sua cultura. Sua disciplina os torna guerreiros letais e leais.",
          "weapon": "Katana Sorai (Arma Longa) – 1d8 cortante; Reação Extra toda rodada.",
          "skillBonusesText": "Lutar (Armas Longa) +10, Esquivar +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas Longa)",
              "value": 10
            },
            {
              "skill": "Esquivar",
              "value": 5
            }
          ],
          "ability": "o Samurai Sorai: Vantagem ao Contra-Atacar. | Mestre da Katana: +3 dano com Armas Longas/Cultural.",
          "weakness": "Penalidade de -10 em Diplomacia.",
          "weaknessBonuses": [
            {
              "skill": "Diplomacia",
              "value": -10
            }
          ]
        },
        {
          "id": "yasunari",
          "name": "Yasunari",
          "regionCode": "P",
          "region": "Arashiko",
          "nativeLanguage": "Yasunego",
          "description": "Os Yasunari são artistas zen do Arashiko, criando obras de clareza espiritual. Sua introspecção os guias em batalhas e meditações.",
          "weapon": "Wakizashi Yasunari (Arma Curta) – 1d6 cortante e +1 de dano a cada 15 de SAB.",
          "skillBonusesText": "Arte/Ofício +10, Intuição +5",
          "skillBonuses": [
            {
              "skill": "Arte/Ofício",
              "value": 10
            },
            {
              "skill": "Intuição",
              "value": 5
            }
          ],
          "ability": "o Mestre Yasunari: Rerola teste de SAB. | Artista Zen: Cria obra com vantagem em Arte/Ofício.",
          "weakness": "Penalidade de -5 em Intimidação.",
          "weaknessBonuses": [
            {
              "skill": "Intimidação",
              "value": -5
            }
          ]
        },
        {
          "id": "kaijin",
          "name": "Kaijin",
          "regionCode": "P",
          "region": "Arashiko",
          "nativeLanguage": "Kaishiran",
          "description": "Os Kaijin são navegadores e guerreiros marítimos do Arashiko, enfrentando tempestades com lanças e shurikens. Sua cultura celebra o mar e a guerra.",
          "weapon": "Yari Kaijin (Arma de Haste) – 1d8 perfurante, precisa usar duas mãos e +1d6 em combate um contra um.",
          "skillBonusesText": "Navegação +10, Lutar (Armas de Arremesso) +5",
          "skillBonuses": [
            {
              "skill": "Navegação",
              "value": 10
            },
            {
              "skill": "Lutar (Armas de Arremesso)",
              "value": 5
            }
          ],
          "ability": "o Navegador Kaijin: Vantagem em Navegação e Sobrevivencia. | Atirador Shuriken: Pode lançar uma shuriken extra sem penalidade. Caso esteja Furtivo sua posição não é revelada, permanecendo furtivo.",
          "weakness": "Penalidade de - 10 em Atletismo..",
          "weaknessBonuses": [
            {
              "skill": "Atletismo",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "p-cargas-de-t-mpera",
          "name": "Cargas De Têmpera",
          "regionCode": "P",
          "region": "Arashiko",
          "baseType": "Fina",
          "regional": true,
          "description": "REGIÃO P - CARGAS DE TÊMPERA Cargas de Têmpera: Não funcionam com armas puramente contundentes; as Cargas são criadas quando a arma é imbuída; se a arma for solta, quebrada ou tomada, as Cargas se perdem. Ao gastar uma Carga, escolha um dos efeitos: • Corte de Resposta: Quando fizer um ataque como reação, contra-ataque ou ataque de oportunidade com a arma imbuída, recebe bônus no teste de ataque. • Corte Guardado: Depois de Aparar com sucesso, você pode gastar uma Carga para tornar seu próximo ataque contra aquele alvo mais preciso. • Corte Silencioso: Quando lançar uma arma pequena, como shuriken, faca ou tanto, enquanto estiver furtivo, pode gastar uma Carga para reduzir a chance de revelar sua posição. Se errar, não revela a posição; se acertar, o mestre decide conforme a cena.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você imbui uma arma compatível com Magia Fina, causando 1d6 de dano cortante mágico. Você recebe 1 Carga de Têmpera. Pode gastar 1 Carga para usar Corte de Resposta, recebendo +5 no ataque feito como reação, contra-ataque ou ataque de oportunidade. Consome 1 PM e 1 PM para ativar a Carga.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Fina até 9m. As Cargas de Têmpera podem ser usadas com armas arremessadas compatíveis com Fina, como shuriken, faca, tanto ou flecha. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d6 de dano. Se você Aparar com sucesso enquanto a arma estiver imbuída, pode gastar 1 Carga para receber +5 no próximo ataque contra o alvo aparado até o início do seu próximo turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Se usar Corte de Resposta e acertar, o alvo sofre -5 no próximo teste de Aparar contra você até o início do próximo turno dele.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 2d8 de dano e pode permanecer imbuída por 4 turnos. Você recebe 4 Cargas de Têmpera. O bônus do Corte de Resposta aumenta para +10. Você ainda só pode gastar 1 Carga por rodada. Consome 4 PM, 1 PM por turno mantido e 2 PM para ativar cada Carga.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 4,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você aprende o Corte Silencioso. Ao lançar uma arma pequena compatível com Fina enquanto estiver furtivo, pode gastar 1 Carga. Se errar, sua posição não é revelada; se acertar, o mestre decide conforme cobertura, distância e barulho da cena.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 3d8 de dano. Quando acertar um ataque feito como reação ou contra-ataque usando Carga de Têmpera, causa +1d6 de dano cortante mágico. Consome 5 PM e 2 PM para ativar cada Carga.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            },
            {
              "level": 8,
              "text": "Em vez de criar uma arma natural de Magia Fina, você pode usar Lâmina da Forja Serena: sua arma real se torna o centro da técnica até o fim da cena. Enquanto ela estiver em sua mão, você recebe +5 contra Desarmar e pode manter 1 Carga de Têmpera mesmo se errar um ataque. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 4d8 de dano. Você recebe 5 Cargas de Têmpera. O bônus do Corte de Resposta aumenta para +15. Se o ataque for feito contra um alvo que acabou de atacar você, pode também ignorar 5 de CA desse alvo. Consome 8 PM, 3 PM por turno mantido e 3 PM para ativar cada Carga.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "A arma natural da Magia Fina pode ser usada normalmente, se o jogador preferir. No Estilo Arashiko, você também pode manter a Lâmina da Forja Serena: recebe 6 Cargas de Têmpera e pode gastar até 2 Cargas por rodada, mas apenas uma delas pode ser usada em reação. O dano adicional do ataque com Carga aumenta para +1d8 cortante mágico. Consome 5 PM para arma natural, ou 8 PM para a Fina de nível 10, e 3 PM para ativar cada Carga.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [
                "reaction"
              ],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "override",
                "secondaryActions": "override"
              }
            }
          ]
        },
        {
          "id": "p-batida-do-tatara",
          "name": "Batida Do Tatara",
          "regionCode": "P",
          "region": "Arashiko",
          "baseType": "Impacto",
          "regional": true,
          "description": "REGIÃO P - BATIDA DO TATARA A Ressonância de Têmpera é um efeito curto causado pela Batida do Tatara: quando um alvo está sob Ressonância de Têmpera, ele sofre dificuldade em manter guarda, bloqueio, arma ou postura. Ela pode afetar: Bloquear; Aparar; resistir a Desarmar; manter arma empunhada; manter escudo firme; resistir a empurrão/queda causada pela própria Batida; manter equilíbrio em convés, ponte, piso de madeira, doca ou terreno instável. Ela não afeta perícias sociais, magia à distância, conhecimento, furtividade ou dano direto.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você libera Impacto pela palma, punho ou toque curto contra um alvo a até 1,5m. O alvo sofre 1d8 de dano contundente mágico. Se estiver usando arma, escudo ou armadura, faz CON; se falhar, sofre Ressonância de Têmpera, recebendo -5 em Aparar ou -1 no valor de Bloqueio contra o próximo ataque até o início do seu próximo turno. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Impacto até 9m. A Ressonância de Têmpera só se aplica se o Impacto for transmitido por toque, arma, escudo, madeira, metal, convés, porta ou superfície rígida próxima ao alvo. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d8 de dano. Se o alvo falhar em CON, também sofre -5 para resistir a Desarmar até o início do seu próximo turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Ao acertar a Batida, o alvo faz CON. Se falhar, fica atordoado por 1 turno. No Estilo Arashiko, isso representa vibração no elmo, peito, arma, escudo ou ossos. Consome 3 PM.",
              "activationCost": 3,
              "maintenanceCost": 0,
              "durationTurns": 1,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 3d8 de dano. Você pode escolher entre uma Finta, dificultando Esquiva em 10, ou Ressonância Profunda: o alvo sofre -10 em Aparar ou -2 no Bloqueio contra o próximo ataque. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Você pode descarregar a Batida em uma superfície de madeira, metal ou pedra em até 3m de diâmetro. Criaturas escolhidas sobre essa superfície fazem CON; em falha, são empurradas 1,5m ou sofrem Ressonância de Têmpera. Um alvo principal sofre o dano completo; os demais sofrem metade do dano se falharem. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 4d8 de dano. Se a Ressonância for aplicada contra alvo usando arma metálica, escudo ou armadura média/pesada, o próximo ataque feito contra ele ignora 5 de CA. Consome 6 PM.",
              "activationCost": 6,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Com uma ação padrão, você realiza uma Batida de Forja. Os dados se tornam d10 e o alvo tem o teste dificultado em 15. Se tocar uma arma, armadura, escudo, porta, corrente, bigorna, mastro ou estrutura, você não é empurrado; a superfície absorve o recuo. Consome 8 PM.",
              "activationCost": 8,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 5d8, ou 5d10 com ação padrão. A Ressonância Profunda passa a causar -15 em Aparar ou -3 no Bloqueio contra o próximo ataque. Consome 10 PM.",
              "activationCost": 10,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "O empurrão em falha de CON se torna 4,5m, o teste para resistir é dificultado em 20, e se usar ação padrão os dados se tornam d12. Se o alvo estiver usando arma, escudo ou armadura metálica, a Batida pode também forçá-lo a testar para não perder a firmeza da arma ou escudo; em falha, sofre -10 no próximo teste de Lutar até o início do próximo turno. Consome 12 PM.",
              "activationCost": 12,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    },
    {
      "code": "Q",
      "name": "Geal",
      "label": "Região Q - Geal",
      "cultures": [
        {
          "id": "nevaski",
          "name": "Nevaski",
          "regionCode": "Q",
          "region": "Geal",
          "nativeLanguage": "Nevansk",
          "description": "Os Nevaski são caçadores Geal, rastreando presas em terras geladas. Sua resiliência ao frio os torna sobreviventes inigualáveis.",
          "weapon": "Machado Nevaski (Arma Curta) – 1d6 cortante, causa + 4 de dano em alvos sem Armadura ou com Armadura Leve e pode ser Arremessado (alcance médio), tem +10 de rastrear contra o alvo.",
          "skillBonusesText": "Sobrevivência +10, Rastrear +5",
          "skillBonuses": [
            {
              "skill": "Sobrevivência",
              "value": 10
            },
            {
              "skill": "Rastrear",
              "value": 5
            }
          ],
          "ability": "o Caçador Nevaski: Vantagem em Sobrevivência e Rastrear. | Sobrevivente Siberiano: Ignora efeitos de frio.",
          "weakness": "Penalidade de -10 em Charme.",
          "weaknessBonuses": [
            {
              "skill": "Charme",
              "value": -10
            }
          ]
        },
        {
          "id": "hvalding",
          "name": "Hvalding",
          "regionCode": "Q",
          "region": "Geal",
          "nativeLanguage": "Hvaldrik",
          "description": "Os Hvalding são berserkers Geal, cuja força bruta e lanças de osso dominam combates. Sua cultura celebra a fúria e a resistência.",
          "weapon": "Lança Hvalding (Arma de Haste) – 1d8 perfurante; Vantagem e testes de CON.",
          "skillBonusesText": "Lutar (Armas de Haste) +10, Atletismo +5",
          "skillBonuses": [
            {
              "skill": "Lutar (Armas de Haste)",
              "value": 10
            },
            {
              "skill": "Atletismo",
              "value": 5
            }
          ],
          "ability": "o Berserker Hvalding: +10 Vida Temporária. | Golpe do Urso: +3 dano com arma de haste/cultural.",
          "weakness": "Penalidade de -10 em Diplomacia.",
          "weaknessBonuses": [
            {
              "skill": "Diplomacia",
              "value": -10
            }
          ]
        },
        {
          "id": "bjornar",
          "name": "Bjornar",
          "regionCode": "Q",
          "region": "Geal",
          "nativeLanguage": "Bjornmal",
          "description": "Os Bjornar são xamãs Geal, conectados a ursos e espíritos da natureza. Suas facas curvas são ferramentas de caça e rituais sagrados.",
          "weapon": "Faca Bjornar (Arma Curta) – 1d4 cortante e +1 de dano a cada 15 de FOR.",
          "skillBonusesText": "Lidar com Animais +10, Natureza +5",
          "skillBonuses": [
            {
              "skill": "Lidar com Animais",
              "value": 10
            },
            {
              "skill": "Natureza",
              "value": 5
            }
          ],
          "ability": "o Domador Bjornar: Invoca força animal para vantagem em FOR. | Xamã do Urso: Vantagem em Religião.",
          "weakness": "Penalidade de -10 em Contabilidade.",
          "weaknessBonuses": [
            {
              "skill": "Contabilidade",
              "value": -10
            }
          ]
        }
      ],
      "magics": [
        {
          "id": "q-presa-sob-a-neve",
          "name": "Presa Sob A Neve",
          "regionCode": "Q",
          "region": "Geal",
          "baseType": "Fina",
          "regional": true,
          "description": "REGIÃO Q - PRESA SOB A NEVE Quando você acerta um alvo com Presa sob a Neve, ele se torna Presa Assinalada até o início do seu próximo turno. Fora de combate, se o alvo fugir e deixar rastros físicos possíveis, o mestre pode permitir que a marca de caça dure até o fim da cena. Enquanto um alvo está como Presa Assinalada: • você recebe bônus em Rastrear, Encontrar ou Sobrevivência para segui-lo; • ataques arremessados contra ele ficam mais eficientes em níveis maiores; • alvos sem armadura ou com armadura leve são mais vulneráveis aos efeitos da magia.",
          "levels": [
            {
              "level": 1,
              "text": "Com uma ação bônus, você imbui uma arma compatível com Magia Fina, causando 1d6 de dano cortante mágico. Se acertar, o alvo se torna Presa Assinalada. Você recebe +5 em Rastrear, Encontrar ou Sobrevivência para seguir esse alvo até o início do seu próximo turno, ou até o fim da cena se ele fugir deixando rastros. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "text",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Você pode lançar a Magia Fina até 9m. Se usada com arma arremessada, flecha, lança curta, machado arremessado ou arpão, a Presa Assinalada pode ser seguida mesmo se sair do alcance visual, desde que haja rastros. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "A magia causa 2d6 de dano. Contra alvo sem armadura ou com armadura leve, o primeiro ataque feito por você contra a Presa Assinalada ignora 5 de CA até o início do seu próximo turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Se a Presa Assinalada tentar se esconder, apagar rastros, mergulhar em neve, atravessar água rasa ou se misturar à paisagem, ela sofre -5 no teste usado para ocultar o próprio rastro contra você.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "A magia causa 2d8 de dano e pode ficar imbuída por 4 turnos. Enquanto estiver mantida, você pode ter apenas uma Presa Assinalada por vez. O bônus de rastreio aumenta para +10. Consome 4 PM e 1 PM por turno mantido.",
              "activationCost": 4,
              "maintenanceCost": 1,
              "durationTurns": 4,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "text",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Se acertar a Presa Assinalada com uma arma arremessada ou projétil compatível com Fina, você pode se mover 1,5m sem provocar ataque de oportunidade desse alvo, representando o recuo do caçador após lançar a ponta.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N5",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "A magia causa 3d8 de dano. Contra alvo sem armadura ou com armadura leve, o ataque contra a Presa Assinalada causa +2 de dano físico. Esse bônus não acumula com o bônus cultural Nevaski de +4; use apenas o maior. Consome 5 PM.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Em vez de criar uma arma natural de Magia Fina, você pode usar Farpa de Osso Branco: ao acertar uma Presa Assinalada, uma parte da energia permanece na ferida até o início do seu próximo turno. O próximo teste de Rastrear, Encontrar ou Sobrevivência contra esse alvo recebe +15. Consome 4 PM e dura apenas uma aplicação.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "A magia causa 4d8 de dano. Contra alvo sem armadura, com armadura leve ou já ferido desde o último descanso curto, o ataque ignora 10 de CA e o ataque contra a Presa Assinalada causa +4 de dano físico.Consome 8 PM e 3 PM por turno mantido.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "A arma natural da Magia Fina pode ser usada normalmente, se o jogador preferir. No Estilo Geal, você também pode aperfeiçoar a Farpa de Osso Branco: a Presa Assinalada não se beneficia de neve, neblina, gelo quebrado, sangue misturado à água ou pele branca/camuflada para impedir seu rastreio, desde que ainda deixe algum sinal físico possível. O dano contra alvos sem armadura leve aumenta para +6 caso o conjurador seja da Região Geal. Consome 5 PM para arma natural, ou 8 PM para a Fina de nível 10.",
              "activationCost": 5,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "bonus",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "bonus",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        },
        {
          "id": "q-pele-do-urso-branco",
          "name": "Pele Do Urso Branco",
          "regionCode": "Q",
          "region": "Geal",
          "baseType": "Forte",
          "regional": true,
          "description": "REGIÃO Q - PELE DO URSO BRANCO Fôlego de Hibernação é uma vida temporária curta, gerada pela Magia Forte, que representa o corpo segurando calor e dor. Ele não é cura, não aumenta PV máximo nem não acumula com outra vida temporária; use o maior valor. Além disso ele desaparece quando a magia termina, pode ser usado contra dano, frio, dor, exaustão física e sangramento e não melhora ataque, Esquivar, Aparar ou perícias sociais.",
          "levels": [
            {
              "level": 1,
              "text": "Aumenta sua CA em +5. Além disso, recebe 3 de Fôlego de Hibernação até o início do seu próximo turno. Se estiver em frio extremo, neve, gelo, tundra ou depois de sofrer dano desde o último turno, esse valor aumenta para 5. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 2,
              "text": "Reduz 1d6 de dano mágico em você. Enquanto a Pele do Urso Branco estiver ativa, você recebe +5 em CON ou Atletismo para resistir a frio, dor, queda, empurrão, exaustão ou manter- se de pé. Consome 1 PM.",
              "activationCost": 1,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 3,
              "text": "Aumenta sua CA em +10. O Fôlego de Hibernação passa a ser 5, ou 8 em frio extremo/neve/gelo/tundra ou se você sofreu dano desde o último turno. Consome 2 PM.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 4,
              "text": "Reduz 1d6 de dano físico em você. Se essa redução zerar o dano de um ataque corpo a corpo, você pode receber +5 em Intimidação contra esse alvo até o início do seu próximo turno.",
              "activationCost": 2,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "inherited:N3",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 5,
              "text": "Aumenta sua CA em +15. O Fôlego de Hibernação passa a ser 10. Se estiver com metade ou menos dos PV máximos, você também recebe +5 em Lutar com arma longa, cultural ou Brigar até o início do seu próximo turno. Consome 3 PM e 1 PM para manter.",
              "activationCost": 3,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 6,
              "text": "Reduz 2d6 de dano mágico e 1d6 de dano físico em você. Uma vez por rodada, quando você sofrer dano, pode converter até 3 pontos desse dano em perda de Fôlego de Hibernação antes de afetar seus PV. Consome 3 PM e 1 PM para manter.",
              "activationCost": 3,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 7,
              "text": "Aumenta sua CA em +20. O Fôlego de Hibernação passa a ser 15. Se você derrubar, empurrar ou vencer uma disputa de Atletismo contra um alvo, recebe +5 em Religião ou Intimidação até o fim da cena, representando o respeito ao “espírito do urso”. Consome 4 PM.",
              "activationCost": 4,
              "maintenanceCost": 0,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "not-stated",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 8,
              "text": "Reduz 2d6 de dano mágico e 2d6 de dano físico em você. Se estiver em frio extremo, gelo, neve ou tundra, você ignora 1 ponto de Exaustão enquanto a magia estiver ativa. Esse ponto retorna quando a magia termina, se ainda fizer sentido na cena. Consome 5 PM e 1 PM para manter.",
              "activationCost": 5,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 9,
              "text": "Aumenta sua CA em +25. O Fôlego de Hibernação passa a ser 20. Se você estiver com metade ou menos dos PV máximos, o primeiro ataque corpo a corpo que acertar por rodada causa +3 de dano físico, apenas com arma longa, arma cultural ou ataque corporal pesado. Consome 6 PM e 1 PM para manter.",
              "activationCost": 6,
              "maintenanceCost": 1,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            },
            {
              "level": 10,
              "text": "Aumenta sua CA em +30 e reduz todo dano sofrido por você em 10. O Fôlego de Hibernação passa a ser 25. Uma vez por combate, se você seria reduzido a 0 PV, pode gastar 4 PM para consumir todo o Fôlego restante; se o valor consumido for suficiente para impedir a queda, você permanece com 1 PV. Consome 8 PM e 3 PM para manter.",
              "activationCost": 8,
              "maintenanceCost": 3,
              "durationTurns": null,
              "action": "standard",
              "automation": "complete",
              "durationFormula": "",
              "activationAction": "standard",
              "secondaryActions": [],
              "automationLevel": "complete",
              "mechanicsSource": {
                "activationCost": "text",
                "maintenanceCost": "text",
                "duration": "not-stated",
                "activationAction": "type-rule",
                "secondaryActions": "not-stated"
              }
            }
          ]
        }
      ]
    }
  ],
  "baseSpells": [
    {
      "id": "fina",
      "name": "Fina",
      "baseType": "Fina",
      "regional": false,
      "description": "Essa magia é bem frequente, ela é usada em objetos como espadas, machados, flechas ou até mesmo em níveis mais altos na mão, ela gera um corte magico no ar que vai em direção ao alvo. Pode ser conjurada com uma ação bônus e tem a duração de uma rodada.",
      "levels": [
        {
          "level": 1,
          "text": "Com uma ação bônus, você pode imbuir sua arma com energia fina, dando 1d6 de dano mágico, ela só funciona com um ataque corpo a corpo. Consome 1 PM.",
          "activationCost": 1,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "text",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 2,
          "text": "Agora você pode lançar a magia em uma distância de 9m. Consome 1 PM.",
          "activationCost": 1,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 3,
          "text": "A magia agora da 2d6 de dano. Consome 2 PM",
          "activationCost": 2,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 4,
          "text": "---------------------------------------------------------------------",
          "activationCost": 2,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "inherited:N3",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 5,
          "text": "A magia agora da 2d8 de dano. Ao imbuir ela dura até 4 turnos, dando 4 Cargas. Seu consumo é de 4 PM e 1 PM por cada turno que ainda tiver alguma Carga imbuída. Cada Carga Consome 1 PM. Eco: Você pode gastar 1 PM adicional, uma ação bônus e um turno dos 4 turnos para dar um corte extra dando 2d6 de dano.",
          "activationCost": 4,
          "maintenanceCost": 1,
          "durationTurns": 4,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "text",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 6,
          "text": "---------------------------------------------------------------------",
          "activationCost": 4,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "inherited:N5",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 7,
          "text": "A magia agora dá 3d8 de dano gastando 5 PM, e 3d6 no Eco, 2 PM.",
          "activationCost": 5,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 8,
          "text": "Você cria uma arma natural de magia fina na sua mão, causando 3d6 de dano com ela como ação bônus, consome PM e dura a cena.",
          "activationCost": 5,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "inherited:N7",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "text",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 9,
          "text": "A magia agora dá 4d8 de dano. Consome 8 PM e 3 PM por turno e por Carga.",
          "activationCost": 8,
          "maintenanceCost": 3,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 10,
          "text": "Atacar com a arma natural da magia fina é considerado (2 PTS Aptidão) como um ataque extra, o dano da arma criada aumenta pra 4d6 consome 5 PM e dura a cena. O dano do eco do corte aumenta pra 4d6, consome 3 PM.",
          "activationCost": 5,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        }
      ]
    },
    {
      "id": "impacto",
      "name": "Impacto",
      "baseType": "Impacto",
      "regional": false,
      "description": "Essa magia exige uma complexidade um pouco maior, porém também é muito comum entre aqueles que podem usar magia. Ela especialmente não pode ser imbuída em equipamentos, para seu uso é necessário a palma da mão ou os punhos fechados. Ela nada mais é que uma esfera comprimida de energia que gera um forte impacto onde acerta. Usa uma ação bônus e tem duração instantânea.",
      "levels": [
        {
          "level": 1,
          "text": "Gera uma esfera comprimida de magia ao redor de seu punho, acertando o alvo depois de um acerto físico, causando 1d8 de dano contundente. Consome 1 PM.",
          "activationCost": 1,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 2,
          "text": "Você pode lançar a magia até 9m. Consome 1 PM.",
          "activationCost": 1,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 3,
          "text": "A magia agora da 2d8 de dano. Consome 2 PM.",
          "activationCost": 2,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 4,
          "text": "Ao acertar seu ataque ele causa um atordoamento. Se o alvo falhar em uma salvaguarda de CON, fica atordoado por 1 turno. Consome 3 PM.",
          "activationCost": 3,
          "maintenanceCost": 0,
          "durationTurns": 1,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "text",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 5,
          "text": "A magia agora causa 3d8 de dano, além de poder adicionar uma “Finta”, que dificulta o teste de Esquiva em 10, além de negar cobertura de 2/3. Consome 4 PM.",
          "activationCost": 4,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 6,
          "text": "Ao invés de lançar em um alvo, agora você ataca uma área de 3 metros de diâmetro. Empurra os alvos 3 metros caso falhem em teste de CON. Consome 5 PM.",
          "activationCost": 5,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 7,
          "text": "A magia agora da 4d8 de dano. Consome 6 PM.",
          "activationCost": 6,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 8,
          "text": "Ao juntar as duas mãos, você lança um golpe mais poderoso. Com uma ação padrão, os dados do impacto se tornam d10 e o alvo tem o teste dificultado em 15. Em troca você é empurrado 1,5m (Sem provocar ataque de oportunidade). Consome 8 PM",
          "activationCost": 8,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [
            "standard"
          ],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "text"
          }
        },
        {
          "level": 9,
          "text": "A magia agora causa 5d8 (ou 5d10 com uma ação padrão), o diâmetro da área é aumentado para 4,5m. Consome 10 PM.",
          "activationCost": 10,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "text",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 10,
          "text": "A magia tem a área aumentada para 6m de diâmetro, o (2 PTS Aptidão) empurrão do impacto em falha de COM é 4,5m, o teste para não ser acertado é dificultado em 20 e caso utilize da ação padrão os dados de dano se tornam d12. Consome 12 PM.",
          "activationCost": 12,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "text",
            "secondaryActions": "not-stated"
          }
        }
      ]
    },
    {
      "id": "densa",
      "name": "Densa",
      "baseType": "Densa",
      "regional": false,
      "description": "Essa é uma habilidade magica quase que inata, muitos conseguem usar, mas poucos são especializados nela, ela tem dois usos, o primeiro é dificultar o alvo que está sendo pressionado por ela de realizar alguma ação, o segundo uso é impedir o Mundo de ser completamente efetivo.",
      "levels": [
        {
          "level": 1,
          "text": "A magia causa 1d10 de dificuldade em uma área de 3m de diâmetro. É utilizado uma Ação Bônus e dura 1 turno, podendo resistir com um sucesso em POD. Consome 2 PM",
          "activationCost": 2,
          "maintenanceCost": 0,
          "durationTurns": 1,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "text",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 2,
          "text": "A magia agora reduz o movimento de quem está na área em 3 metros. Consome 3 PM.",
          "activationCost": 3,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 3,
          "text": "A magia agora causa 2d10 de penalidade em uma área de 4,5 metros em Cone ou 3m de diâmetro. Dura 2 turnos consumindo PM por turno. Consome 4PM.",
          "activationCost": 4,
          "maintenanceCost": 0,
          "durationTurns": 2,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "text",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 4,
          "text": "Você pode escolher POD/10 alvos imunes a este efeito.",
          "activationCost": 4,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "inherited:N3",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 5,
          "text": "A magia pode ser usada com uma reação. A partir de agora para impedir com que um Mundo seja efetivo você realiza um teste de SAB, se passar o mundo perde suas propriedades em um raio de 3 metros. A magia causa 3d10 de penalidade e para resistir é necessário um sucesso Sólido. Consome 5 PM e 2 PM para manter.",
          "activationCost": 5,
          "maintenanceCost": 2,
          "durationTurns": null,
          "action": "reaction",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "reaction",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "text",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 6,
          "text": "A área afetada pela magia se torna terreno difícil e a área do cone é aumentada para 9m junto com a área de diâmetro aumentada para 6m. A magia agora dura 3 turnos. Consome 5 PM e 2 PM para manter.",
          "activationCost": 5,
          "maintenanceCost": 2,
          "durationTurns": 3,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "text",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 7,
          "text": "A magia agora causa 4d10 de penalidade, além de causar dano nos alvos afetados, dando 2d6 de dano por turno mantido. Caso resista, você não recebe o dano. Consome 6 PM e 2 PM para manter.",
          "activationCost": 6,
          "maintenanceCost": 2,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 8,
          "text": "A magia agora gera 2d8 de dano por turno mantido. Caso resista toma metade do dano. O tamanho do cone aumenta para 18 m e o diâmetro aumenta para 12m de raio. Consome 6 PM e 3PM para manter.",
          "activationCost": 6,
          "maintenanceCost": 3,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 9,
          "text": "A magia agora causa 5d10 de penalidade e 3d8 de dano. Consome 8 PM e 4 PM para Manter.",
          "activationCost": 8,
          "maintenanceCost": 4,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 10,
          "text": "A magia agora recebe +20 em SAB para resistir ao Mundo. A (2 PTS Aptidão) área em que o Mundo perde suas propriedades é aumentada para 6m de raio. Os dados de penalidade se tornam d12 e causa 4d8 de dano. Consome 12 PM e 5 PM para manter.",
          "activationCost": 12,
          "maintenanceCost": 5,
          "durationTurns": null,
          "action": "bonus",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "bonus",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        }
      ]
    },
    {
      "id": "eterea",
      "name": "Etérea",
      "baseType": "Etérea",
      "regional": false,
      "description": "Essa magia é rara, mesmo entre os melhores usuários. Ela tem a capacidade de curar ferimentos rapidamente, quando utilizado em si pode ser usada como ação bônus, mas quando usada em um algo ela precisa de uma ação padrão, pois sua conversão é custosa. Em níveis mais elevados pode ajudar a colocar novamente um braço cortado no lugar, ela consegue curar normalmente alvos com lesão grave.",
      "levels": [
        {
          "level": 1,
          "text": "Gera uma aura mágica que cura 1d8 de si. Consome 1 PM.",
          "activationCost": 1,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 2,
          "text": "A magia agora pode curar um alvo em 1d6. Consome 2 PM.",
          "activationCost": 2,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 3,
          "text": "A magia agora causas 2d8 de cura em si, ou 5 de vida temporária em si ou em alvos. Consome 3 PM.",
          "activationCost": 3,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 4,
          "text": "A magia agora pode curar em 2d6 um alvo, além de doenças leves, como sangramento e envenenamento. Consome 4 PM.",
          "activationCost": 4,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 5,
          "text": "A magia agora cura 3d8 de vida em si, além de curar com 2d6 alvos em até 3 metros de raio, ou pode dar 10 de vida temporária. Consome 5 PM.",
          "activationCost": 5,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 6,
          "text": "A magia agora pode curar um alvo em 3d6. Consome 6 PM.",
          "activationCost": 6,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 7,
          "text": "A magia agora cura 4d8 de si, ou 15 de vida temporária. Além de poder tirar a condição de Lesão Grave. Consome PM.",
          "activationCost": 6,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "inherited:N6",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 8,
          "text": "A magia agora pode curar um alvo em 4d6. Consome 8 PM.",
          "activationCost": 8,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 9,
          "text": "A magia agora cura 5d8 em si, além de poder curar doenças raras demorando 1d4 horas. Consome 9 PM.",
          "activationCost": 9,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 10,
          "text": "A magia agora pode curar um alvo em 6d6 ou dar 25 de vida temporária. Consome 12 PM.",
          "activationCost": 12,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        }
      ]
    },
    {
      "id": "forte",
      "name": "Forte",
      "baseType": "Forte",
      "regional": false,
      "description": "Essa magia permeia o usuário, possibilitando uma armadura ou escudo mágico, que aumenta a proteção do alvo. Para usa-la você pode usar uma ação que fará com que dure pelo menos 1 minuto ou uma reação para que dure 6 segundos.",
      "levels": [
        {
          "level": 1,
          "text": "Aumenta a CA em +5. Consome 1 PM.",
          "activationCost": 1,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 2,
          "text": "A magia reduz 1d6 de dano magico. Consome 1 PM.",
          "activationCost": 1,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 3,
          "text": "Aumenta a CA em +10. Consome 2 PM.",
          "activationCost": 2,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 4,
          "text": "A magia reduz 1d6 de dano físico.",
          "activationCost": 2,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "inherited:N3",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 5,
          "text": "Aumenta a CA em +15. Consome 3 PM e 1 PM para manter.",
          "activationCost": 3,
          "maintenanceCost": 1,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 6,
          "text": "A magia reduz 2d6 de dano magico 1d6 de dano físico.",
          "activationCost": 3,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "inherited:N5",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 7,
          "text": "Aumenta a CA em +20. Consome 4 PM",
          "activationCost": 4,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 8,
          "text": "A magia reduz 2d6 de dano magico e 2d6 de dano físico. Consome 4 PM e 2 PM para manter.",
          "activationCost": 4,
          "maintenanceCost": 2,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 9,
          "text": "Aumenta a CA em +25. Consome 6 PM.",
          "activationCost": 6,
          "maintenanceCost": 0,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "not-stated",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 10,
          "text": "Aumenta a CA em +30 e reduz todo o dano em 10. Consome (3 PTS Aptidão) 8 PM e 3 PM para manter.",
          "activationCost": 8,
          "maintenanceCost": 3,
          "durationTurns": null,
          "action": "standard",
          "automation": "complete",
          "durationFormula": "",
          "activationAction": "standard",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "not-stated",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        }
      ]
    },
    {
      "id": "mundo",
      "name": "Mundo",
      "baseType": "Mundo",
      "regional": false,
      "description": "Esse é o ápice da magia, uma redoma transparente de pura energia mágica. Da mesma forma que é poderosa, é altamente custosa. O interior representa a alma do usuário. Para ativa-la é necessário uma ação e o alvo pode desativar quando quiser ou quando seus Pontos Mágicos acabarem. É ativada com uma ação padrão. Para saber como criar ou estruturar um Mundo verifique a p.(X)",
      "levels": [
        {
          "level": 1,
          "text": "Ativa com 5 PM, consome 2 PM/turno. Causa uma dificuldade de POD+SAB(ou INT)÷10 em tudo que o alvo for realizar. Consegue manter ativo por 1d4 rodadas e tem uma habilidade de nível 1 (2 Usos). A área de ativação do Mundo é 3m de raio.",
          "activationCost": 5,
          "maintenanceCost": 2,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 2,
          "text": "Ativa com 6 PM, consome 2 PM/Turno. Reduz o custo de magias pela metade para o usuário. A área de ativação do Mundo é de 4,5m de raio.",
          "activationCost": 6,
          "maintenanceCost": 2,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 3,
          "text": "Ativa com 7 PM, consome 3 PM/Turno. A dificuldade é aumentada em 5 e você recebe mais 1 dado de dano para todas as magias dentro do mundo (Dano/efeito/cura). A área de ativação é aumentada para 6m de raio.",
          "activationCost": 7,
          "maintenanceCost": 3,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 4,
          "text": "Ativa com 8 PM, consome 3 PM/Turno. Aumenta a CA do usuário em +10. Caso a mana acabe, toma 1d8 de dano por turno extra no Mundo. A área de ativação é aumentada para 7,5m de raio.",
          "activationCost": 8,
          "maintenanceCost": 3,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 5,
          "text": "Ativa com 10PM, consome 4 PM/Turno, aumenta a dificuldade para o alvo em +10. A duração do mundo se torna 1d4+2, o usuário consegue reduzir o tamanho da area de ativação do Mundo, a área é aumentada para 9m de raio. Além de ter uma habilidade única nível 2 (3 Usos).",
          "activationCost": 10,
          "maintenanceCost": 4,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4+2",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 6,
          "text": "Ativa com 12 PM, consome 4 PM/Turno. Magias do usuário não custam mana dentro do Mundo, além de aumentar em 2 dados todas as magias do usuário (dano/efeito/cura). Caso o tempo do mundo ou a mana do usuário acabe, você toma 2d6 de dano por turno extra dentro do Mundo. A área de ativação se torna 10,5m raio.",
          "activationCost": 12,
          "maintenanceCost": 4,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4+2",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 7,
          "text": "Ativa com 14 PM, consome 5PM/Turno. A dificuldade para o alvo é aumentada para +15. Se o alvo falhar em um teste de POD ele fica atordoado. A área de ativação se torna 12m de raio.",
          "activationCost": 14,
          "maintenanceCost": 5,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4+2",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 8,
          "text": "Ativa com 16 PM, consome 5 PM/Turno. A CA do usuário é aumentada em +15. A área de ativação 13,5m de raio.",
          "activationCost": 16,
          "maintenanceCost": 5,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4+2",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 9,
          "text": "Ativa com 18 PM, consome 6 PM/Turno. A dificuldade para o alvo se torna +20 e caso o mundo ou a mana do usuário acabe, toma 2d8 de dano para cada turno extra. A área de ativação se torna 15m de raio.",
          "activationCost": 18,
          "maintenanceCost": 6,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4+2",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        },
        {
          "level": 10,
          "text": "Ativa com 20 PM, consome 6 PM/Turno. Caso o tempo do (5 PTS Aptidão) mundo ou a mana do usuário acabe ele toma 3d8 de dano por turno extra. O usuário recebe +4 dados de dano em todas suas magias (dano/efeito/cura). Você desbloqueia a Habilidade Única nível 3 (4 Usos). A área de ativação se torna 18m de raio.",
          "activationCost": 20,
          "maintenanceCost": 6,
          "durationTurns": null,
          "action": "full",
          "automation": "complete",
          "durationFormula": "1d4+2",
          "activationAction": "full",
          "secondaryActions": [],
          "automationLevel": "complete",
          "mechanicsSource": {
            "activationCost": "text",
            "maintenanceCost": "text",
            "duration": "manual-rule",
            "activationAction": "type-rule",
            "secondaryActions": "not-stated"
          }
        }
      ]
    }
  ],
  "talents": [
    {
      "name": "Adepto Marcial",
      "description": "Você tem +10 em Brigar e em Esquiva. Sua esquiva agora só precisa ser igual ao sucesso do oponente para esquivar. Você pode usar Esquiva para gerar um Contra-Ataque.",
      "tag": "Misto",
      "skillMods": [
        {
          "skill": "Lutar (Brigar)",
          "value": 10,
          "source": "Adepto Marcial"
        },
        {
          "skill": "Esquivar",
          "value": 10,
          "source": "Adepto Marcial"
        }
      ],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "mixed",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Alerta",
      "description": "Sua percepção é aumentada em +15, Encontrar e Escutar em +10.",
      "tag": "Passivo",
      "skillMods": [
        {
          "skill": "Encontrar",
          "value": 10,
          "source": "Alerta"
        },
        {
          "skill": "Escutar",
          "value": 10,
          "source": "Alerta"
        }
      ],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Amado Pela Magia",
      "description": "Seu valor de PM aumenta em 5. Esse talento pode ser escolhido várias vezes.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {
        "pm": 5
      },
      "acMod": 0,
      "mode": "passive",
      "stackable": true,
      "automationLevel": "complete",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Ambidestro",
      "description": "Você ganha +5 de CA se estiver empunhando uma arma corpo-a-corpo em cada mão. Pode usar duas armas mesmo que a arma de uma mão que você está empunhando não seja leve. O ataque com a segunda arma é feito utilizando uma ação bônus.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 5,
        "attackMod": 0
      }
    },
    {
      "name": "Arremesso Múltiplo",
      "description": "Uma vez por rodada, quando faz um ataque com uma arma arremessável, você pode gastar sua ação bônus para fazer um ataque adicional contra o mesmo alvo, arremessando outra arma arremessáveis. Da mesma forma você pode fazer a mesma coisa com arco e flecha. Esse talento dá +5 em Arremessar e +5 em Lutar (Armas de Arremesso).",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Atacante Agressivo",
      "description": "Todo golpe dá 1d4 de dano a mais; quando em formação, a formação dá +2 de dano.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Atacante Furioso",
      "description": "Uma vez por turno, quando você rolar o dano para um ataque, você pode jogar novamente o dado de dano de arma e usar qualquer dos valores. Você pode decidir ter -8 de C.A. para causar +1d6 de dano.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": -8,
        "attackMod": 0
      }
    },
    {
      "name": "Atirador Aguçado",
      "description": "Você dominou armas à distância, ao atacar alvos além da distância normal, você não recebe desvantagem, seus ataques à distância ignoram meia cobertura. Você pode ter uma penalidade de +20 para adicionar +10 de dano no ataque.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Atleta",
      "description": "Aumenta FOR e DES em +5 (Até o max de 99). Quando caído você levanta apenas usando 1,5m de deslocamento, +15 em testes de Atletismo.",
      "tag": "Misto",
      "skillMods": [
        {
          "skill": "Atletismo",
          "value": 15,
          "source": "Atleta"
        }
      ],
      "attributeMods": {
        "FOR": 5,
        "DES": 5
      },
      "resourceMods": {},
      "acMod": 0,
      "mode": "mixed",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Cavaleiro de Justas",
      "description": "Ao combater montado, você ganha +10 em acertos e +10 em Cavalgar.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [
          {
            "skill": "Cavalgar",
            "value": 10,
            "source": "Cavaleiro de Justas"
          }
        ],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Curandeiro",
      "description": "+10 de medicina, pode estabilizar um alvo sem kit de primeiros-socorros, mas se usar o alvo recupera +1d6+3 de vida.",
      "tag": "Misto",
      "skillMods": [
        {
          "skill": "Medicina",
          "value": 10,
          "source": "Curandeiro"
        }
      ],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "mixed",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Duelista",
      "description": "Usando apenas uma arma de uma mão, você ganha +5 em acertos, +10 em Esquivar e +5 de CA.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 5,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Especialista em Armadura Pesada",
      "description": "Você recebe metade das penalidades utilizando armaduras acima de cota de malha.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Especialista em Besta",
      "description": "Recarrega a besta com uma ação bônus ou ação de movimento, não tem desvantagem se o alvo estiver próximo de mais. Quando você usa a ação de Ataque e ataca com uma arma de uma mão, você pode usar sua ação bônus para atacar com a besta de mão carregada que você esteja empunhando.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Especialista em Concussão",
      "description": "Ao utilizar uma arma que causa dano contundente, você causa +4 de dano que não pode ser bloqueado.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Especialista em Cortes",
      "description": "Ao utilizar uma arma que causa dano cortante você causa +4 cortante em armaduras abaixo de cota de malha, e +1 de dano perfurante em armaduras acima de cota de malha. Esses danos não põem ser bloqueados.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Especialista em Perfuração",
      "description": "Ao utilizar uma arma que causa dano perfurante você causa +4 de dano em armaduras até armadura de escama, e causa +2 de dano perfurante em armaduras de placa. Não pode ser bloqueado.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Inexpugnável",
      "description": "Se estiver utilizando uma armadura de cota ou peitoral, recebe +2 de CA e +1 de bloqueio, se estiver usando armadura de escamas ou placas recebe +4 de CA e +2 de bloqueio.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 2,
        "attackMod": 0
      }
    },
    {
      "name": "Investida Aprimorada",
      "description": "Ao realizar uma ação de investida, seu movimento aumenta em 3 metros durante ela. Seu teste e ataque contra esse alvo recebe +10 e caso acerte o ataque pode fazer um teste de atletismo para tentar derrubar o oponente. Para resistir é necessário CON. O resultado do atacante deve ser no mínimo igual ao do oponente para derruba-lo.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Líder",
      "description": "Você recebe +20 em tática e +10 em Charme, Persuasão e Diplomacia.",
      "tag": "Passivo",
      "skillMods": [
        {
          "skill": "Tática",
          "value": 20,
          "source": "Líder"
        },
        {
          "skill": "Charme",
          "value": 10,
          "source": "Líder"
        },
        {
          "skill": "Persuasão",
          "value": 10,
          "source": "Líder"
        },
        {
          "skill": "Diplomacia",
          "value": 10,
          "source": "Líder"
        }
      ],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "complete",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Lobo Solitário",
      "description": "Voce recebe +5 de CA e +10 em todos os ataques que fizer se não estiver com nenhum aliado dentro de 6 metros, caso esteja acompanhado, recebe -5 de CA  e -5 em testes de ataque.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 5,
        "attackMod": 10
      }
    },
    {
      "name": "Mestre de Escudo",
      "description": "Ao usar escudos você toma -2 de dano. Você pode imbuir (1 PM) sua mana no escudo e com isso você pode “Bloquear” magias usando seu bloqueio.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Mestre em Armas Grandes",
      "description": "Se você acertar um Extremo com uma arma grande e reduzir a vida de uma criatura a 0, você pode realizar um ataque corpo-a-corpo com uma ação bônus. Pode escolher receber uma penalidade de +15 no ataque para adicionar 2d6 ao dano.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Mobilidade",
      "description": "Seu deslocamento aumenta em 3m, quando você ataca uma criatura, você não toma ataque de oportunidade dela pelo resto do turno. Terreno difícil não reduz seu movimento.",
      "tag": "Misto",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "mixed",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Perito",
      "description": "+15 em três pericias a sua escolha.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Piqueiro",
      "description": "Uma vez por rodada, se estiver empunhando uma arma de haste e um inimigo entrar voluntariamente em seu alcance corpo a corpo, você recebe +10 para fazer um ataque corpo a corpo contra este oponente com esta arma, nesta rodada. Se o oponente tiver se aproximado fazendo uma investida, seu ataque causa +1d8 de dano do mesmo tipo.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Resiliente",
      "description": "Vantagem em testes de CON e SAB. Só ficam exaustos ao tirar falha crítica no dado e toda condição de exaustão é reduzido em um passo. Pode despertar de um atordoamento com um sucesso em CON ou SAB.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Retalhador",
      "description": "Ao tirar Extremo com uma arma cortante você reduz o movimento da criatura em 3 metros e deixa o alvo sangrando, caso sua arma já cause sangramento, o dano dele é aumentado para 1d6.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Robusto",
      "description": "Sua vida soma o valor de CON÷8 em toda evolução de nível.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "complete",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Sorrateiro",
      "description": "Você tem +15 em Furtividade. Quando estiver escondido atacar e errar um ataque à distância não revela sua posição.",
      "tag": "Misto",
      "skillMods": [
        {
          "skill": "Furtividade",
          "value": 15,
          "source": "Sorrateiro"
        }
      ],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "mixed",
      "stackable": false,
      "automationLevel": "partial",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Técnicas Agressivas de Escudo",
      "description": "Ao atacar no seu turno você pode usar sua ação de movimento para atacar com seu escudo, causando 2+ o seu corpo de dano.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Técnicas do Sentinela",
      "description": "Quando uma criatura a 1,5 metros de você faz um ataque contra um alvo além de você, você pode como uma reação realizar um ataque contra essa criatura.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Trespassar",
      "description": "Quando você faz um ataque corpo a corpo e reduz os pontos de vida do alvo para 0 ou menos, pode gastar a sua reação para fazer um ataque adicional contra outra criatura dentro do seu alcance. O ataque adicional usa os mesmos valores de ataque e dano.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Rho Aias",
      "description": "Consegue usar sua Magia Forte usando mais 8 PM para formar um escudo em área de 3m de raio, protegendo todos atrás de magia ou ataques físicos, ele quebra se a vida dele sair de 80 e chegar a 0, essa habilidade pode ser guardada em objetos como pingentes, esse escudo pode ter duas aparências:",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Ungido pela Magia",
      "description": "Vantagem em jogadas de ataques, +20 de PM; capaz de utilizar a Dança Perfeita (+2d6 de dano) em Extremos.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Mana Residual",
      "description": "Você pode imbuir mais mana em suas armas, sua arma pode estocar o total de 6 PM de mana, cada ataque que utilize a espada e energia, será retirado da mana estocada da espada. Você pode escolher o quanto está estocando, fazer isso gasta a ação bônus e a cada 1 PM de mana estocada você perde 1 PM. (Nenhum modificador reduz ou aumenta o gasto.)",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Fissura Celeste",
      "description": "Ao tirar um crítico sua mana é restaurada em +10 PM, além de seus dados de dano serem triplicados. Após acertar o primeiro ataque, toda Fissura Celeste vem com um Extremo.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Forja Divina",
      "description": "Consumindo 8PM você pode criar uma arma feita de magia, ela dá 1d10+6 de dano e assume a forma que preferir, tem a duração de 10 minutos.",
      "tag": "Ativável/Condicionável",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "conditional",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Mundo Extensivo",
      "description": "Seu Mundo tem a área aumentada em 20m e gasta menos 2 P.M. para usar.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    },
    {
      "name": "Veia Densa",
      "description": "Seu corpo possui uma energia tão densa e tem uma eficiência energética grande. Sua energia densa dá +1d10 de penalidade e 3d8 de dano. Usa menos 1 P.M. em qualquer magia.",
      "tag": "Passivo",
      "skillMods": [],
      "attributeMods": {},
      "resourceMods": {},
      "acMod": 0,
      "mode": "passive",
      "stackable": false,
      "automationLevel": "manual",
      "conditionalMods": {
        "skillMods": [],
        "attributeMods": {},
        "resourceMods": {},
        "acMod": 0,
        "attackMod": 0
      }
    }
  ],
  "weapons": [
    {
      "name": "Adaga",
      "damage": "1d4 perfurante",
      "weight": "0,5 kg",
      "property": "Finesse, Leve, Arremesso (6/18m)"
    },
    {
      "name": "Adaga de Misericórdia",
      "damage": "1d4 perfurante",
      "weight": "0,4 kg",
      "property": "Finesse, Leve, +1 dano em alvos caídos"
    },
    {
      "name": "Alabarda",
      "damage": "1d10 cortante",
      "weight": "3 kg",
      "property": "Duas Mãos, Alcance (3m)"
    },
    {
      "name": "Arco Composto",
      "damage": "1d8+1 perfurante",
      "weight": "1 kg",
      "property": "Duas Mãos, Alcance (9/45m)"
    },
    {
      "name": "Arco Curto",
      "damage": "1d6 perfurante",
      "weight": "1 kg",
      "property": "Duas Mãos, Alcance (9/24m)"
    },
    {
      "name": "Arco Longo",
      "damage": "1d10+2 perfurante",
      "weight": "1 kg",
      "property": "Duas Mãos, Alcance (45/180m)"
    },
    {
      "name": "Arpão",
      "damage": "1d6 perfurante",
      "weight": "2 kg",
      "property": "Arremesso (6/18m), Duas Mãos"
    },
    {
      "name": "Azagaia",
      "damage": "1d6 perfurante",
      "weight": "1 kg",
      "property": "Arremesso (9/36m), Leve"
    },
    {
      "name": "Bastão de Ferro",
      "damage": "1d6 contundente",
      "weight": "2 kg",
      "property": "Versátil (1d8)"
    },
    {
      "name": "Besta Leve",
      "damage": "2d8 perfurante",
      "weight": "2,5 kg",
      "property": "Duas Mãos, Alcance (24/96m), Carregamento"
    },
    {
      "name": "Besta Pesada",
      "damage": "2d10 perfurante",
      "weight": "8 kg",
      "property": "Duas Mãos, Alcance (30/120m), Carregamento"
    },
    {
      "name": "Besta de Mão",
      "damage": "2d6 perfurante",
      "weight": "1,5 kg",
      "property": "Munição (9/36m), Leve, Carregamento"
    },
    {
      "name": "Bordão",
      "damage": "1d6 contundente",
      "weight": "2 kg",
      "property": "Versátil (1d8)"
    },
    {
      "name": "Chicote",
      "damage": "1d4 cortante",
      "weight": "1,5 kg",
      "property": "Finesse, Alcance (3m)"
    },
    {
      "name": "Cimitarra",
      "damage": "1d6 cortante",
      "weight": "1,5 kg",
      "property": "Finesse, Leve"
    },
    {
      "name": "Clava",
      "damage": "1d4 contundente",
      "weight": "1 kg",
      "property": "Leve"
    },
    {
      "name": "Clava Espinhada",
      "damage": "1d6 contundente",
      "weight": "1,5 kg",
      "property": "Leve, +1 dano em sangramento"
    },
    {
      "name": "Clava Grande",
      "damage": "1d8 contundente",
      "weight": "5 kg",
      "property": "Pesada, Duas Mãos"
    },
    {
      "name": "Corrente com Bola",
      "damage": "1d8 contundente",
      "weight": "2 kg",
      "property": "Duas Mãos, Alcance (3m)"
    },
    {
      "name": "Dardo",
      "damage": "1d4 perfurante",
      "weight": "0,1 kg",
      "property": "Finesse, Arremesso (6/18m)"
    },
    {
      "name": "Espada Curta",
      "damage": "1d6 perfurante",
      "weight": "1 kg",
      "property": "Finesse, Leve"
    },
    {
      "name": "Espada de Duas Mãos",
      "damage": "2d6 cortante",
      "weight": "3 kg",
      "property": "Pesada, Duas Mãos"
    },
    {
      "name": "Espada Grande",
      "damage": "2d6 cortante",
      "weight": "3 kg",
      "property": "Pesada, Duas Mãos"
    },
    {
      "name": "Espada Longa",
      "damage": "1d8 cortante",
      "weight": "1,5 kg",
      "property": "Versátil (1d10)"
    },
    {
      "name": "Foice Curta",
      "damage": "1d4 cortante",
      "weight": "1 kg",
      "property": "Leve"
    },
    {
      "name": "Foice de Guerra",
      "damage": "1d6 cortante",
      "weight": "1,5 kg",
      "property": "Duas Mãos"
    },
    {
      "name": "Funda",
      "damage": "1d4 contundente",
      "weight": "0 kg",
      "property": "Munição (9/36m)"
    },
    {
      "name": "Gadanho de Guerra",
      "damage": "1d8 perfurante",
      "weight": "1,5 kg",
      "property": "Versátil (1d10)"
    },
    {
      "name": "Garrote",
      "damage": "1d4 contundente",
      "weight": "0,5 kg",
      "property": "Finesse, Especial (asfixia)"
    },
    {
      "name": "Glaive",
      "damage": "1d10 cortante",
      "weight": "3 kg",
      "property": "Pesada, Alcance (3m), Duas Mãos"
    },
    {
      "name": "Guandao",
      "damage": "1d10 cortante",
      "weight": "2 kg",
      "property": "Duas Mãos, Alcance (3m)"
    },
    {
      "name": "Kusarigama",
      "damage": "1d6 cortante",
      "weight": "1 kg",
      "property": "Finesse, Alcance (3m)"
    },
    {
      "name": "Lança",
      "damage": "1d6 perfurante",
      "weight": "1,5 kg",
      "property": "Arremesso (6/18m), Versátil (1d8)"
    },
    {
      "name": "Lança de Montaria",
      "damage": "1d12 perfurante",
      "weight": "3 kg",
      "property": "Alcance (3m), Especial"
    },
    {
      "name": "Lança Longa",
      "damage": "1d10 perfurante",
      "weight": "4 kg",
      "property": "Pesada, Alcance (3m), Duas Mãos"
    },
    {
      "name": "Maça",
      "damage": "1d6 contundente",
      "weight": "2 kg",
      "property": "-"
    },
    {
      "name": "Maça Estrela",
      "damage": "1d8 perfurante",
      "weight": "2 kg",
      "property": "-"
    },
    {
      "name": "Machadinha",
      "damage": "1d6 cortante",
      "weight": "1 kg",
      "property": "Leve, Arremesso (6/18m)"
    },
    {
      "name": "Machado de Batalha",
      "damage": "1d8 cortante",
      "weight": "2 kg",
      "property": "Versátil (1d10)"
    },
    {
      "name": "Machado Grande",
      "damage": "1d12 cortante",
      "weight": "3,5 kg",
      "property": "Pesada, Duas Mãos"
    },
    {
      "name": "Malho",
      "damage": "2d6 contundente",
      "weight": "5 kg",
      "property": "Pesada, Duas Mãos"
    },
    {
      "name": "Mangual",
      "damage": "1d8 contundente",
      "weight": "1 kg",
      "property": "-"
    },
    {
      "name": "Martelo de Guerra",
      "damage": "1d8 contundente",
      "weight": "1 kg",
      "property": "Versátil (1d10)"
    },
    {
      "name": "Martelo Leve",
      "damage": "1d4 contundente",
      "weight": "1 kg",
      "property": "Leve, Arremesso (6/18m)"
    },
    {
      "name": "Nunchaku",
      "damage": "1d6 contundente",
      "weight": "1 kg",
      "property": "Finesse, Leve"
    },
    {
      "name": "Picareta de Guerra",
      "damage": "1d8 perfurante",
      "weight": "1 kg",
      "property": "-"
    },
    {
      "name": "Porrete",
      "damage": "1d4 contundente",
      "weight": "1 kg",
      "property": "Leve"
    },
    {
      "name": "Rapieira",
      "damage": "1d8 perfurante",
      "weight": "1 kg",
      "property": "Finesse"
    },
    {
      "name": "Rede",
      "damage": "-",
      "weight": "1,5 kg",
      "property": "Especial, Arremesso (1,5/4,5m)"
    },
    {
      "name": "Sabre",
      "damage": "1d8 cortante",
      "weight": "1,5 kg",
      "property": "Finesse, Leve"
    },
    {
      "name": "Tridente",
      "damage": "1d6 perfurante",
      "weight": "2 kg",
      "property": "Arremesso (6/18m), Versátil (1d8)"
    },
    {
      "name": "Zarabatana",
      "damage": "1 perfurante",
      "weight": "0,5 kg",
      "property": "Munição (7,5/30m), Carregamento"
    }
  ],
  "armors": [
    {
      "name": "Armadura de Escamas",
      "ca": 18,
      "weight": "20 kg",
      "category": "Pesado",
      "block": {
        "cortante": 4,
        "perfurante": 2,
        "contundente": 1
      },
      "property": "+10 de penalidade em ações de DESTREZA. Redução de 4 de dano em bloqueio."
    },
    {
      "name": "Armadura de Placas",
      "ca": 20,
      "weight": "30 kg",
      "category": "Pesado",
      "block": {
        "cortante": 5,
        "perfurante": 3,
        "contundente": 1
      },
      "property": "+20 de penalidade em ações de DESTREZA, reduz movimento em 3m. Redução de 5 de dano em bloqueio."
    },
    {
      "name": "Cota de Malha",
      "ca": 15,
      "weight": "25 kg",
      "category": "Médio",
      "block": {
        "cortante": 3,
        "perfurante": 2,
        "contundente": 2
      },
      "property": "+5 de penalidade em ações de DESTREZA. Redução de 3 de dano em bloqueio."
    },
    {
      "name": "Couro",
      "ca": 5,
      "weight": "5 kg",
      "category": "Leve",
      "block": {
        "cortante": 1,
        "perfurante": 1,
        "contundente": 1
      },
      "property": "Redução de 1 de dano em bloqueio."
    },
    {
      "name": "Couro Batido",
      "ca": 10,
      "weight": "6 kg",
      "category": "Leve",
      "block": {
        "cortante": 2,
        "perfurante": 2,
        "contundente": 2
      },
      "property": "Redução de 2 dano em bloqueio."
    },
    {
      "name": "Escudo",
      "ca": 5,
      "weight": "3 kg",
      "category": "Escudo",
      "block": {
        "cortante": 2,
        "perfurante": 2,
        "contundente": 2
      },
      "property": "Requer uma mão livre. Redução de 2 dano em bloqueio."
    },
    {
      "name": "Peitoral",
      "ca": 12,
      "weight": "10 kg",
      "category": "Médio",
      "block": {
        "cortante": 2,
        "perfurante": 2,
        "contundente": 2
      },
      "property": "Redução de 2 de dano em bloqueio."
    }
  ],
  "equipment": [
    "Ábaco",
    "Ácido (frasco)",
    "Água benta (frasco)",
    "Algemas",
    "Algibeira",
    "Aljava",
    "Ampulheta",
    "Antídoto (frasco)",
    "Arpéu",
    "Aríete portátil",
    "Armadilha de caça",
    "Balança de mercador",
    "Balde",
    "Baú",
    "Caneca",
    "Cesto",
    "Cobertor de inverno",
    "Corda de cânhamo (15m)",
    "Corda de seda (15m)",
    "Corrente (3m)",
    "Escada (3m)",
    "Esferas (sacola com 1.000)",
    "Espelho de aço",
    "Estrepes (bolsa com 20)",
    "Fechadura",
    "Jarra",
    "Grimório",
    "Giz (1 peça)",
    "Garrafa de vidro",
    "Veneno básico (frasco)",
    "Fogo alquímico (frasco)",
    "Sino",
    "Vara (3m)",
    "Lamparina",
    "Parafina (10)",
    "Lente de aumento",
    "Livro",
    "Luneta",
    "Manto",
    "Marreta",
    "Mochila",
    "Óleo (frasco)",
    "Pá",
    "Panela de ferro",
    "Papel (uma folha)",
    "Pederneira",
    "Pé de cabra",
    "Pedra de amolar",
    "Perfume (frasco)",
    "Pergaminho (uma folha)",
    "Picareta de minerador",
    "Píton",
    "Poção de erva curativa (1d4)",
    "Porta mapas ou pergaminhos",
    "Pregos de ferro (10)",
    "Rações de viagem (1 dia)",
    "Robes",
    "Roldana e polia",
    "Roupas comuns",
    "Roupas de viajante",
    "Roupas de entretenimento",
    "Roupas finas",
    "Sabão",
    "Saco",
    "Saco de dormir",
    "Símbolo sagrado (amuleto)",
    "Símbolo sagrado (sinete)",
    "Símbolo sagrado (emblema)",
    "Símbolo sagrado (relicário)",
    "Tenda para duas pessoas"
  ],
  "worldLaws": [
    {
      "ID": "OFE-01",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Dano em alvo (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Sem: 15. Com: 20; sucesso reduz para 10.",
      "N2 (Mundo 5-9)": "Sem: 30. Com: 40; sucesso reduz para 20.",
      "N3 (Mundo 10)": "Sem: 60. Com: 80; sucesso reduz para 40.",
      "Alvo": "1 criatura no Mundo",
      "Resistência sugerida": "CON ou POD",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Alvo: 1 criatura no Mundo. Instantâneo. O dano é mágico e o tipo é definido ao criar a Lei. Na versão com Resistência, use CON ou POD, também definido ao aprender a Lei. Usos sucessivos podem atingir a mesma criatura.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-02",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Dano em área pequena (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Sem: 8 por criatura. Com: 10; sucesso reduz para 5.",
      "N2 (Mundo 5-9)": "Sem: 15 por criatura. Com: 20; sucesso reduz para 10.",
      "N3 (Mundo 10)": "Sem: 30 por criatura. Com: 40; sucesso reduz para 20.",
      "Alvo": "Círculo de 3/6/12 m de diâmetro conforme N1/N2/N3, em ponto do Mundo.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Círculo de 3/6/12 m de diâmetro conforme N1/N2/N3, em ponto do Mundo. Instantâneo e não seletivo; cada criatura testa separadamente. O usuário pode se declarar imune.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-03",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Dano em alvo duplo",
      "N1 (Mundo 1-4)": "10 de dano em cada alvo.",
      "N2 (Mundo 5-9)": "20 de dano em cada alvo.",
      "N3 (Mundo 10)": "40 de dano em cada alvo.",
      "Alvo": "Escolha exatamente 2 criaturas distintas no Mundo.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Escolha exatamente 2 criaturas distintas no Mundo. Dano instantâneo e garantido. Se houver apenas um alvo válido, a parcela restante é perdida.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-04",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Área de dano fixa",
      "N1 (Mundo 1-4)": "5 de dano por rodada.",
      "N2 (Mundo 5-9)": "10 de dano por rodada.",
      "N3 (Mundo 10)": "20 de dano por rodada.",
      "Alvo": "Cria círculo persistente de 3/6/12 m de diâmetro conforme N1/N2/N3.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria círculo persistente de 3/6/12 m de diâmetro conforme N1/N2/N3. No início do turno de cada criatura na área, causa dano garantido. Não seletiva; uma área ativa e nova ativação reposiciona.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-05",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Área de dano ajustável (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Diâmetro 3 m. Sem: 10. Com: 13; sucesso causa 6.",
      "N2 (Mundo 5-9)": "Diâmetro 3/6 m. Sem: 20/15. Com: 27/20; sucesso causa 13/10.",
      "N3 (Mundo 10)": "Diâmetro 3/6/12 m. Sem: 40/30/20. Com: 55/40/25; sucesso causa 27/20/12.",
      "Alvo": "Área instantânea, não seletiva, centrada em ponto do Mundo.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Área instantânea, não seletiva, centrada em ponto do Mundo. O diâmetro máximo depende da Lei; cada criatura testa separadamente na versão com Resistência.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-06",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Dano em múltiplos alvos (com Resistência)",
      "N1 (Mundo 1-4)": "7 por alvo; sucesso causa 3.",
      "N2 (Mundo 5-9)": "13 por alvo; sucesso causa 6.",
      "N3 (Mundo 10)": "25 por alvo; sucesso causa 12.",
      "Alvo": "Escolha até 4 criaturas no Mundo.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Sucesso reduz à metade, arredondando para baixo.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Escolha até 4 criaturas no Mundo. Dano instantâneo; cada alvo faz CON ou POD. Sucesso reduz à metade, arredondando para baixo. Valor não utilizado não pode ser concentrado em menos alvos.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-07",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Mais dano ao acertar",
      "N1 (Mundo 1-4)": "+15 de dano no acerto.",
      "N2 (Mundo 5-9)": "+30 de dano no acerto.",
      "N3 (Mundo 10)": "+60 de dano no acerto.",
      "Alvo": "Depois que o usuário acertar um ataque ou magia, gaste um uso para adicionar dano do mesmo tipo.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Depois que o usuário acertar um ataque ou magia, gaste um uso para adicionar dano do mesmo tipo. Máximo de uma ativação desta Lei por acerto. O dano fixo não é duplicado por Extremo ou Crítico.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-08",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Aumento de penalidade (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Sem: aumenta em 10. Com POD: aumenta em 15; sucesso anula o aumento.",
      "N2 (Mundo 5-9)": "Sem: aumenta em 20. Com POD: aumenta em 30; sucesso anula o aumento.",
      "N3 (Mundo 10)": "Sem: aumenta em 50. Com POD: aumenta em 75; sucesso anula o aumento.",
      "Alvo": "Aumenta penalidade numérica já ativa até o início do próximo turno ou até ela terminar.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Aumenta penalidade numérica já ativa até o início do próximo turno ou até ela terminar. Penalidades originadas por Leis ficam limitadas a -75 no total.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-09",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Aumento de Corpo",
      "N1 (Mundo 1-4)": "+1 categoria de Corpo.",
      "N2 (Mundo 5-9)": "+2 categorias de Corpo.",
      "N3 (Mundo 10)": "+4 categorias. Cada categoria excedente ao Corpo 3 concede +5 de Vigor Efetivo, máximo +10.",
      "Alvo": "O Corpo efetivo do usuário sobe faixas até o início do próximo turno.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O Corpo efetivo do usuário sobe faixas até o início do próximo turno. Altera MOD, carga, empurrar/erguer e Bloqueio, não FOR, CON ou Vida. Máximo Corpo 3; não acumula.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-10",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Área de penalidade fixa",
      "N1 (Mundo 1-4)": "-5 nos testes.",
      "N2 (Mundo 5-9)": "-10 nos testes.",
      "N3 (Mundo 10)": "-25 nos testes.",
      "Alvo": "Cria área não seletiva de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria área não seletiva de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar. Criaturas dentro sofrem penalidade em testes d100. Uma área ativa; nova ativação reposiciona.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-11",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Penalidade em alvo",
      "N1 (Mundo 1-4)": "-10 nos testes escolhidos.",
      "N2 (Mundo 5-9)": "-20 nos testes escolhidos.",
      "N3 (Mundo 10)": "-50 nos testes escolhidos.",
      "Alvo": "Ao aprender a Lei, escolha uma família: Ataques, Defesas Ativas ou um atributo específico.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Ao aprender a Lei, escolha uma família: Ataques, Defesas Ativas ou um atributo específico. Um alvo sofre a penalidade nessa família até o início do próximo turno do usuário. Não acumula consigo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-12",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Redução de Bloqueio do alvo",
      "N1 (Mundo 1-4)": "Reduz 2 de Bloqueio.",
      "N2 (Mundo 5-9)": "Reduz 4 de Bloqueio.",
      "N3 (Mundo 10)": "Alvo: -9 em todos os Bloqueios por 1 rodada. Área: diâmetro 12 m, -5 em todos os Bloqueios; cada criatura testa POD e sucesso anula.",
      "Alvo": "Reduz Bloqueio, mínimo 0.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Reduz Bloqueio, mínimo 0. N1/N2 criam carga para o próximo Bloqueio; ativações adicionais criam cargas separadas. N3 pode afetar alvo ou área.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-13",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Dano ao realizar ação (sem/com Resistência; exceto livre)",
      "N1 (Mundo 1-4)": "Sem: 5 por ação. Com POD: 7 por ação; sucesso reduz para 3.",
      "N2 (Mundo 5-9)": "Sem: 10 por ação. Com POD: 13 por ação; sucesso reduz para 6.",
      "N3 (Mundo 10)": "Sem: 20 por ação, máximo 60. Com POD: 27 por ação, máximo 80; sucesso causa 13 por ação, máximo 40.",
      "Alvo": "Marca 1 alvo até o início do próximo turno.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Marca 1 alvo até o início do próximo turno. Dispara quando ele usa ação padrão, bônus, reação ou movimento, até 3 vezes. Ações livres não disparam.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-14",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Penalidade em forma de alcance (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Sem: -5. Com: -10 em falha; sucesso anula.",
      "N2 (Mundo 5-9)": "Sem: -10. Com: -20 em falha; sucesso anula.",
      "N3 (Mundo 10)": "Sem: -25. Com: -45 em falha; sucesso anula.",
      "Alvo": "Projeta cone ou linha de 1,5 m de largura com comprimento 3/6/12 m conforme N1/N2/N3.",
      "Resistência sugerida": "POD",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Projeta cone ou linha de 1,5 m de largura com comprimento 3/6/12 m conforme N1/N2/N3. Não seletiva e dura uma rodada; na versão resistida, cada criatura testa POD.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-15",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Acerto extra",
      "N1 (Mundo 1-4)": "+10 no teste; dano máximo 15.",
      "N2 (Mundo 5-9)": "+20 no teste; dano máximo 30.",
      "N3 (Mundo 10)": "+45 no teste; dano máximo 60.",
      "Alvo": "O usuário realiza imediatamente um ataque físico, de arma ou natural.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O usuário realiza imediatamente um ataque físico, de arma ou natural. O alvo pode usar defesas normalmente. O ataque recebe bônus, mas o dano total após modificadores fica limitado pelo nível da Lei. Incompatível com Acerto em Alvo no mesmo ataque.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-16",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Cópia (clone) de material",
      "N1 (Mundo 1-4)": "Até 5 kg; bronze, ferro, ouro e aços de Vila/Castelo.",
      "N2 (Mundo 5-9)": "Até 15 kg; inclui Damasco, Vangos e Kaishiro.",
      "N3 (Mundo 10)": "Até 45 kg; inclui Aço Marufiano, sem absorção ou propriedades mágicas especiais.",
      "Alvo": "Copia material que o usuário tenha tocado nesta cena.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Copia material que o usuário tenha tocado nesta cena. A cópia é não mágica, não tem valor comercial e desaparece com o Mundo. Uma cópia ativa; nova ativação substitui. Metal Divino e propriedades únicas são proibidos.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-17",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Cópias (clone) de material - até 6",
      "N1 (Mundo 1-4)": "Massa total 5 kg; materiais comuns.",
      "N2 (Mundo 5-9)": "Massa total 20 kg; inclui aços raros de +3.",
      "N3 (Mundo 10)": "Até 6 peças, massa total 60 kg; inclui Aço Marufiano sem propriedades mágicas.",
      "Alvo": "Como Cópia de Material, mas divide a massa total entre peças.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Como Cópia de Material, mas divide a massa total entre peças. N1/N2 mantêm até quatro cópias; N3 permite seis. Nova ativação substitui o conjunto.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-18",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Acerto surpresa (com Resistência)",
      "N1 (Mundo 1-4)": "+10 no ataque; cobertura ainda se aplica.",
      "N2 (Mundo 5-9)": "+20 e ignora cobertura de 1/3.",
      "N3 (Mundo 10)": "+45 e ignora cobertura de até 2/3.",
      "Alvo": "Um alvo testa POD ou SAB.",
      "Resistência sugerida": "POD ou SAB",
      "Se falhar": "Em falha, o próximo ataque do usuário contra ele até o fim da rodada não pode receber Esquiva, Aparar, Bloquear ou Contra-atacar.",
      "Se passar": "O ataque ainda precisa acertar; uso gasto mesmo em sucesso.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Um alvo testa POD ou SAB. Em falha, o próximo ataque do usuário contra ele até o fim da rodada não pode receber Esquiva, Aparar, Bloquear ou Contra-atacar. O ataque ainda precisa acertar; uso gasto mesmo em sucesso.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-19",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Bônus de acerto",
      "N1 (Mundo 1-4)": "+10 no ataque.",
      "N2 (Mundo 5-9)": "+20 no ataque.",
      "N3 (Mundo 10)": "+45 no ataque.",
      "Alvo": "O usuário recebe bônus no próximo teste de ataque realizado antes do início do seu próximo turno.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O usuário recebe bônus no próximo teste de ataque realizado antes do início do seu próximo turno. Não acumula consigo; nova ativação apenas renova a carga.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-20",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Bônus em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos recebem +5.",
      "N2 (Mundo 5-9)": "Até 3 alvos recebem +10.",
      "N3 (Mundo 10)": "Até 6 alvos recebem +25.",
      "Alvo": "Concede bônus ao próximo ataque de criaturas escolhidas no Mundo, válido até o início do próximo turno do usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Concede bônus ao próximo ataque de criaturas escolhidas no Mundo, válido até o início do próximo turno do usuário. Não acumula com outra ativação desta Lei.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-21",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Empurrão (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Sem: 3 m. Com: 4,5 m em falha.",
      "N2 (Mundo 5-9)": "Sem: 6 m. Com: 9 m em falha.",
      "N3 (Mundo 10)": "Sem: 12 m. Com: 18 m em falha.",
      "Alvo": "Move alvo em linha reta para longe do usuário.",
      "Resistência sugerida": "FOR ou CON",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Na versão resistida, testa FOR ou CON; sucesso anula.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Move alvo em linha reta para longe do usuário. Na versão resistida, testa FOR ou CON; sucesso anula. Colisão só interrompe o movimento e nunca leva para fora do Mundo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-22",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Redução de CA (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Sem: -5 CA. Com: -10 em falha; sucesso anula.",
      "N2 (Mundo 5-9)": "Sem: -10 CA. Com: -20 em falha; sucesso anula.",
      "N3 (Mundo 10)": "Sem: -25 CA. Com: -45 em falha; sucesso anula.",
      "Alvo": "Reduz a CA de um alvo até o início do próximo turno do usuário.",
      "Resistência sugerida": "DES ou POD",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Reduz a CA de um alvo até o início do próximo turno do usuário. Na versão com Resistência, use DES ou POD. Não acumula consigo; a maior redução prevalece.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-23",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Puxão (sem/com Resistência)",
      "N1 (Mundo 1-4)": "Sem: 3 m. Com: 4,5 m em falha.",
      "N2 (Mundo 5-9)": "Sem: 6 m. Com: 9 m em falha.",
      "N3 (Mundo 10)": "Sem: 12 m. Com: 18 m em falha.",
      "Alvo": "Move alvo em linha reta na direção do usuário.",
      "Resistência sugerida": "FOR ou CON",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Na versão resistida, testa FOR ou CON; sucesso anula.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Move alvo em linha reta na direção do usuário. Na versão resistida, testa FOR ou CON; sucesso anula. Termina em espaço livre, sem dano de colisão e sem atravessar o limite.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "OFE-24",
      "Categoria": "Ofensivo",
      "Lei do Mundo": "Aumento de dano para alvo",
      "N1 (Mundo 1-4)": "+5 nos próximos 3 acertos; máximo +15.",
      "N2 (Mundo 5-9)": "+10 nos próximos 3 acertos; máximo +30.",
      "N3 (Mundo 10)": "+20 nos próximos 3 acertos; máximo +60.",
      "Alvo": "Marca 1 criatura.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Marca 1 criatura. Os três primeiros acertos de qualquer fonte recebem dano adicional. Dura até os três acertos acontecerem ou o Mundo acabar; ativações simultâneas não acumulam.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-01",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Escudo de Mana",
      "N1 (Mundo 1-4)": "Escudo com 15 PV.",
      "N2 (Mundo 5-9)": "Escudo com 30 PV.",
      "N3 (Mundo 10)": "Escudo com 70 PV.",
      "Alvo": "Cria uma barreira aderida ao usuário, com PV próprios, que recebe dano antes da Vida e não conta para Lesão Grave.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria uma barreira aderida ao usuário, com PV próprios, que recebe dano antes da Vida e não conta para Lesão Grave. Dano excedente atravessa. Um escudo ativo; nova ativação substitui os PV restantes, sem somar. Some com o Mundo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-02",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de Bloqueio",
      "N1 (Mundo 1-4)": "+2 de Bloqueio.",
      "N2 (Mundo 5-9)": "+4 de Bloqueio.",
      "N3 (Mundo 10)": "+9 de Bloqueio; uma reação protege contra todos os ataques até o próximo turno.",
      "Alvo": "O Bloqueio do usuário aumenta até o início do próximo turno e não acumula.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O Bloqueio do usuário aumenta até o início do próximo turno e não acumula. No N3, a primeira reação para Bloquear ativa guarda contra todos os ataques válidos do período.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-03",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de Bloqueio em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: +1.",
      "N2 (Mundo 5-9)": "Até 3 alvos: +2.",
      "N3 (Mundo 10)": "Até 6 alvos: +5 e guarda de rodada.",
      "Alvo": "Criaturas escolhidas aumentam Bloqueio até o início do próximo turno.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Criaturas escolhidas aumentam Bloqueio até o início do próximo turno. Não acumula. No N3, cada alvo usa uma reação para ativar guarda contra todos os ataques do período.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-04",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de CA",
      "N1 (Mundo 1-4)": "+10 CA.",
      "N2 (Mundo 5-9)": "+20 CA.",
      "N3 (Mundo 10)": "+45 CA.",
      "Alvo": "A CA do usuário aumenta até o início do próximo turno.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "A CA do usuário aumenta até o início do próximo turno. Não acumula consigo nem com Magia Forte: use o maior entre Forte e esta Lei. O bônus inato de CA do Mundo soma normalmente com esse maior valor. Não recalcula outras habilidades baseadas em CA.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-05",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de CA em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: +5 CA.",
      "N2 (Mundo 5-9)": "Até 3 alvos: +10 CA.",
      "N3 (Mundo 10)": "Até 6 alvos: +25 CA.",
      "Alvo": "Concede CA a criaturas escolhidas até o início do próximo turno do usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Concede CA a criaturas escolhidas até o início do próximo turno do usuário. Em cada alvo, não acumula com Magia Forte nem com outra ativação desta Lei; use o maior bônus. Apenas o conjurador soma a CA inata do próprio Mundo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-06",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Redução de dano",
      "N1 (Mundo 1-4)": "Reduz 15 do próximo dano.",
      "N2 (Mundo 5-9)": "Reduz 30 do próximo dano.",
      "N3 (Mundo 10)": "Reduz 70 do próximo dano.",
      "Alvo": "Cada ativação cria uma carga que reduz a próxima instância de dano sofrida pelo usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cada ativação cria uma carga que reduz a próxima instância de dano sofrida pelo usuário. Cargas podem coexistir, mas apenas uma é consumida por instância. Excesso de redução é perdido.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-07",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Redução de dano físico",
      "N1 (Mundo 1-4)": "Reduz 20 de dano físico.",
      "N2 (Mundo 5-9)": "Reduz 40 de dano físico.",
      "N3 (Mundo 10)": "Reduz 90 de dano físico.",
      "Alvo": "Como Redução de Dano, mas só contra dano físico.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Como Redução de Dano, mas só contra dano físico. Cada ativação cria uma carga; uma carga por instância.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-08",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Redução de dano mágico",
      "N1 (Mundo 1-4)": "Reduz 20 de dano mágico.",
      "N2 (Mundo 5-9)": "Reduz 40 de dano mágico.",
      "N3 (Mundo 10)": "Reduz 90 de dano mágico.",
      "Alvo": "Como Redução de Dano, mas só contra dano mágico.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Como Redução de Dano, mas só contra dano mágico. Cada ativação cria uma carga; uma carga por instância.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-09",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Redução de dano em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: reduz 8 cada.",
      "N2 (Mundo 5-9)": "Até 3 alvos: reduz 15 cada.",
      "N3 (Mundo 10)": "Até 6 alvos: reduz 35 cada.",
      "Alvo": "Cada alvo escolhido recebe uma carga para reduzir sua próxima instância de dano antes do início do próximo turno do usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cada alvo escolhido recebe uma carga para reduzir sua próxima instância de dano antes do início do próximo turno do usuário. Uma carga por instância; valores não usados não são redistribuídos.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-10",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Redução de dano físico em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: reduz 10 cada.",
      "N2 (Mundo 5-9)": "Até 3 alvos: reduz 20 cada.",
      "N3 (Mundo 10)": "Até 6 alvos: reduz 45 cada.",
      "Alvo": "Como Redução de Dano em Alvos, mas apenas para a próxima instância de dano físico.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Como Redução de Dano em Alvos, mas apenas para a próxima instância de dano físico.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-11",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Redução de dano mágico em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: reduz 10 cada.",
      "N2 (Mundo 5-9)": "Até 3 alvos: reduz 20 cada.",
      "N3 (Mundo 10)": "Até 6 alvos: reduz 45 cada.",
      "Alvo": "Como Redução de Dano em Alvos, mas apenas para a próxima instância de dano mágico.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Como Redução de Dano em Alvos, mas apenas para a próxima instância de dano mágico.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-12",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Cura",
      "N1 (Mundo 1-4)": "Cura 15 PV.",
      "N2 (Mundo 5-9)": "Cura 30 PV.",
      "N3 (Mundo 10)": "Cura integral de 70 PV e remove Lesão Grave.",
      "Alvo": "Cura instantaneamente o próprio usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cura instantaneamente o próprio usuário. Pode ser repetida com usos diferentes; a cura permanece depois do Mundo. N1/N2 sofrem as limitações normais de Lesão Grave. N3 cura o valor integral, remove Lesão Grave e essa remoção permanece após o Mundo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-13",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Cura em alvo",
      "N1 (Mundo 1-4)": "Cura 15 PV.",
      "N2 (Mundo 5-9)": "Cura 30 PV.",
      "N3 (Mundo 10)": "Cura integral de 70 PV e remove Lesão Grave.",
      "Alvo": "Cura instantaneamente uma criatura no Mundo, inclusive o usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cura instantaneamente uma criatura no Mundo, inclusive o usuário. Pode ser repetida. N1/N2 sofrem as limitações normais de Lesão Grave. N3 cura o valor integral, remove Lesão Grave e essa remoção permanece após o Mundo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-14",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Cura em alvos",
      "N1 (Mundo 1-4)": "5 PV por alvo.",
      "N2 (Mundo 5-9)": "10 PV por alvo.",
      "N3 (Mundo 10)": "Até 6 alvos: 25 PV integrais; aliados ou voluntários também removem Lesão Grave.",
      "Alvo": "Cura instantaneamente até 4 criaturas escolhidas.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cura instantaneamente até 4 criaturas escolhidas. Valor não usado não pode ser concentrado em menos alvos. A cura permanece depois do Mundo. No N3, a cura é integral e remove Lesão Grave de todos os alvos aliados ou voluntários; inimigos curados mantêm a condição.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-15",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Cura em área",
      "N1 (Mundo 1-4)": "Cura 5 PV por criatura.",
      "N2 (Mundo 5-9)": "Cura 10 PV por criatura.",
      "N3 (Mundo 10)": "Cura integral de 25 PV por criatura; aliados ou voluntários também removem Lesão Grave.",
      "Alvo": "Círculo de 3/6/12 m de diâmetro conforme N1/N2/N3, instantâneo e não seletivo.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Círculo de 3/6/12 m de diâmetro conforme N1/N2/N3, instantâneo e não seletivo. Cura todas as criaturas; só aliados ou voluntários removem Lesão Grave.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-16",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de Percepção",
      "N1 (Mundo 1-4)": "+10 Percepção.",
      "N2 (Mundo 5-9)": "+20 Percepção.",
      "N3 (Mundo 10)": "+45 Percepção e contra-ataque mágico gratuito quando esquivar.",
      "Alvo": "A Percepção do usuário aumenta até o início do próximo turno.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "A Percepção do usuário aumenta até o início do próximo turno. N3, ao esquivar de magia, permite um contra-ataque gratuito com Fina ou Impacto conhecida, pagando PM. Compartilha limite de 1 contra-ataque por rodada com Aumento de Esquiva.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-17",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de Percepção em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: +5.",
      "N2 (Mundo 5-9)": "Até 3 alvos: +10.",
      "N3 (Mundo 10)": "Até 6 alvos: +25.",
      "Alvo": "Criaturas escolhidas aumentam Percepção até o início do próximo turno do usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Criaturas escolhidas aumentam Percepção até o início do próximo turno do usuário. Não acumula consigo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-18",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de Esquiva",
      "N1 (Mundo 1-4)": "+10 Esquivar.",
      "N2 (Mundo 5-9)": "+20 Esquivar.",
      "N3 (Mundo 10)": "+45 Esquivar e contra-ataque corpo a corpo gratuito quando esquivar.",
      "Alvo": "Esquivar do usuário aumenta até o início do próximo turno.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Esquivar do usuário aumenta até o início do próximo turno. N3, ao esquivar de ataque adjacente enquanto empunha arma corpo a corpo, permite um ataque gratuito. Compartilha limite de 1 contra-ataque por rodada com Percepção.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-19",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Aumento de Esquiva em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: +5.",
      "N2 (Mundo 5-9)": "Até 3 alvos: +10.",
      "N3 (Mundo 10)": "Até 6 alvos: +25.",
      "Alvo": "Criaturas escolhidas aumentam Esquivar até o início do próximo turno do usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Criaturas escolhidas aumentam Esquivar até o início do próximo turno do usuário. Não concede reações adicionais.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-20",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Totem de Defesa",
      "N1 (Mundo 1-4)": "CA 25, 15 PV, alcance 3 m; redireciona até 5.",
      "N2 (Mundo 5-9)": "CA 30, 30 PV, alcance 6 m; redireciona até 10.",
      "N3 (Mundo 10)": "CA 55, 70 PV, aura 12 m; redireciona até 25 por rodada.",
      "Alvo": "Cria totem em espaço livre com aura de 3/6/12 m conforme N1/N2/N3.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria totem em espaço livre com aura de 3/6/12 m conforme N1/N2/N3. Uma vez por rodada redireciona para si parte do dano sofrido por criatura na aura. Um totem ativo; nova ativação substitui; some com o Mundo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-21",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Vida Temporária (Anestesia)",
      "N1 (Mundo 1-4)": "15 de Vida Temporária.",
      "N2 (Mundo 5-9)": "30 de Vida Temporária.",
      "N3 (Mundo 10)": "70 de Vida Temporária.",
      "Alvo": "O usuário recebe Vida Temporária até ser consumida ou por 5 minutos (50 rodadas), mesmo após o Mundo terminar.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O usuário recebe Vida Temporária até ser consumida ou por 5 minutos (50 rodadas), mesmo após o Mundo terminar. Não é cura, sofre Lesão Grave e não acumula.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-22",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Vida Temporária (Anestesia) em alvos",
      "N1 (Mundo 1-4)": "5 por alvo.",
      "N2 (Mundo 5-9)": "10 por alvo.",
      "N3 (Mundo 10)": "Até 6 alvos: 25 cada.",
      "Alvo": "Criaturas escolhidas recebem Vida Temporária até ser consumida ou por 5 minutos.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Criaturas escolhidas recebem Vida Temporária até ser consumida ou por 5 minutos. Não é cura, sofre Lesão Grave e não acumula.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "DEF-23",
      "Categoria": "Defensivo",
      "Lei do Mundo": "Totem de Cura",
      "N1 (Mundo 1-4)": "CA 25, 15 PV, aura 3 m; cura 5.",
      "N2 (Mundo 5-9)": "CA 30, 30 PV, aura 6 m; cura 10.",
      "N3 (Mundo 10)": "CA 55, 70 PV, aura 12 m; cura 15.",
      "Alvo": "Cria totem em espaço livre com aura seletiva para aliados.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria totem em espaço livre com aura seletiva para aliados. Cura ao surgir e no início de cada turno do usuário, no máximo uma vez por rodada. Não remove Lesão Grave; um ativo e some com o Mundo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-01",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Área de condição (com Resistência)",
      "N1 (Mundo 1-4)": "Escolha uma condição leve de N1.",
      "N2 (Mundo 5-9)": "Escolha condição leve ou moderada de N2.",
      "N3 (Mundo 10)": "Qualquer condição N3, inclusive Atordoado ou Horrorizado, por até 2 rodadas.",
      "Alvo": "Círculo não seletivo de 3/6/12 m de diâmetro conforme N1/N2/N3.",
      "Resistência sugerida": "Atributo apropriado",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Círculo não seletivo de 3/6/12 m de diâmetro conforme N1/N2/N3. Cada criatura testa o atributo apropriado. N3 dura até 2 rodadas e permite novo teste ao fim de cada turno.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-02",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Condição em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "Condição leve de N1 por 1 rodada.",
      "N2 (Mundo 5-9)": "Condição leve/moderada de N2 por até 2 rodadas.",
      "N3 (Mundo 10)": "Condição N3 por até 3 rodadas, inclusive Atordoado ou Horrorizado.",
      "Alvo": "Um alvo testa o atributo apropriado.",
      "Resistência sugerida": "Atributo apropriado",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Um alvo testa o atributo apropriado. N1 dura 1 rodada; N2 até 2; N3 até 3, com novo teste ao fim de cada turno para encerrar. Dano de condição ocorre no máximo uma vez.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-03",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de Vigor Efetivo",
      "N1 (Mundo 1-4)": "+10 de Vigor Efetivo.",
      "N2 (Mundo 5-9)": "+20 de Vigor Efetivo.",
      "N3 (Mundo 10)": "+45 de Vigor Efetivo em todos os testes permitidos durante a duração.",
      "Alvo": "O usuário recebe Vigor Efetivo até o início do próximo turno.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O usuário recebe Vigor Efetivo até o início do próximo turno. Aplica-se a FOR, CON, Atletismo ou Cavalgar e pode alterar Corpo. N3 vale para todos os testes permitidos durante a duração.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-04",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de movimento",
      "N1 (Mundo 1-4)": "+3 m de movimento.",
      "N2 (Mundo 5-9)": "+6 m de movimento.",
      "N3 (Mundo 10)": "+12 m e passagem segura por espaços inimigos.",
      "Alvo": "O deslocamento do usuário aumenta até o início do próximo turno.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O deslocamento do usuário aumenta até o início do próximo turno. Não concede nova ação. N3 permite atravessar espaços inimigos sem Ataque de Oportunidade, mas não terminar neles.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-05",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de movimentos em alvos",
      "N1 (Mundo 1-4)": "Até 2 alvos: +1,5 m.",
      "N2 (Mundo 5-9)": "Até 3 alvos: +3 m.",
      "N3 (Mundo 10)": "Até 6 alvos: +7,5 m.",
      "Alvo": "Aumenta o deslocamento de criaturas escolhidas até o início do próximo turno do usuário.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Aumenta o deslocamento de criaturas escolhidas até o início do próximo turno do usuário. Não concede ações de movimento adicionais.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-06",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Movimento instantâneo",
      "N1 (Mundo 1-4)": "Até 9 m, limitado pelo Mundo.",
      "N2 (Mundo 5-9)": "Até 18 m, limitado pelo Mundo.",
      "N3 (Mundo 10)": "Qualquer ponto percebido dentro do Mundo; pode levar 1 criatura voluntária adjacente.",
      "Alvo": "Teleporta o usuário para espaço livre que ele perceba dentro do Mundo.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Teleporta o usuário para espaço livre que ele perceba dentro do Mundo. Não provoca Ataque de Oportunidade, não atravessa o limite e não pode terminar dentro de objeto ou sem apoio seguro.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-07",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Movimento instantâneo em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "Até 9 m, limitado pelo Mundo.",
      "N2 (Mundo 5-9)": "Até 18 m, limitado pelo Mundo.",
      "N3 (Mundo 10)": "Até 2 alvos voluntários ou 1 involuntário, para qualquer ponto percebido do Mundo.",
      "Alvo": "Teleporta criaturas para espaços livres percebidos.",
      "Resistência sugerida": "DES ou POD",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Teleporta criaturas para espaços livres percebidos. Voluntários não testam; involuntário testa DES ou POD. Não atravessa limite nem termina em objeto ou perigo inevitável.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-08",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Reter dano e contra-atacar",
      "N1 (Mundo 1-4)": "Retém e devolve até 8.",
      "N2 (Mundo 5-9)": "Retém e devolve até 15.",
      "N3 (Mundo 10)": "Retém e devolve até 35.",
      "Alvo": "Até o início do próximo turno, a próxima instância de dano de uma criatura é parcialmente retida: reduz o dano e devolve a mesma quantidade ao causador como dano mágico garantido.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Até o início do próximo turno, a próxima instância de dano de uma criatura é parcialmente retida: reduz o dano e devolve a mesma quantidade ao causador como dano mágico garantido. Não funciona com dano próprio, ambiental ou refletido.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-09",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Ação extra",
      "N1 (Mundo 1-4)": "1 ação bônus adicional.",
      "N2 (Mundo 5-9)": "1 ação bônus ou 1 movimento adicional.",
      "N3 (Mundo 10)": "1 ação padrão ou 2 ações bônus adicionais por uso.",
      "Alvo": "Concede imediatamente componente adicional.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Concede imediatamente componente adicional. Todos os quatro usos podem ser gastos na mesma rodada e criatura. A ação não abre Mundo, recupera Usos nem gera novas ações por efeito equivalente.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-10",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Ação extra em alvo",
      "N1 (Mundo 1-4)": "1 ação bônus adicional.",
      "N2 (Mundo 5-9)": "1 ação bônus ou 1 movimento adicional.",
      "N3 (Mundo 10)": "1 ação padrão ou 2 ações bônus adicionais por uso.",
      "Alvo": "Concede componente a criatura voluntária.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Concede componente a criatura voluntária. Todos os quatro usos podem ir para a mesma criatura. A ação não abre Mundo, recupera Usos nem gera novas ações por efeito equivalente.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-11",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Remover ação em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "Remove a reação.",
      "N2 (Mundo 5-9)": "Remove reação, ação bônus ou movimento, à escolha.",
      "N3 (Mundo 10)": "Remove 1 ação padrão e, à escolha, reação, ação bônus ou movimento.",
      "Alvo": "O alvo testa POD.",
      "Resistência sugerida": "POD",
      "Se falhar": "Em falha, perde um componente ainda não usado até o fim do próximo turno.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "O alvo testa POD. Em falha, perde um componente ainda não usado até o fim do próximo turno. Usos diferentes podem remover componentes distintos, mas remover duas vezes o mesmo componente não gera efeito adicional.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-12",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Redução de movimento em área fixa (com Resistência)",
      "N1 (Mundo 1-4)": "Reduz 3 m.",
      "N2 (Mundo 5-9)": "Reduz 6 m.",
      "N3 (Mundo 10)": "Reduz 13,5 m, mínimo 0.",
      "Alvo": "Área não seletiva de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar.",
      "Resistência sugerida": "FOR ou CON",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Ao entrar ou iniciar turno, testa FOR ou CON; sucesso concede imunidade por uma rodada.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Área não seletiva de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar. Ao entrar ou iniciar turno, testa FOR ou CON; sucesso concede imunidade por uma rodada.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-13",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Redução de movimento em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "Reduz 3 m.",
      "N2 (Mundo 5-9)": "Reduz 6 m.",
      "N3 (Mundo 10)": "Reduz 13,5 m.",
      "Alvo": "Um alvo testa FOR ou CON.",
      "Resistência sugerida": "FOR ou CON",
      "Se falhar": "Em falha, perde deslocamento até o início do próximo turno do usuário; sucesso anula.",
      "Se passar": "Em falha, perde deslocamento até o início do próximo turno do usuário; sucesso anula.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Um alvo testa FOR ou CON. Em falha, perde deslocamento até o início do próximo turno do usuário; sucesso anula. Mínimo 0 e não acumula consigo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-14",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Condição em acerto (com Resistência)",
      "N1 (Mundo 1-4)": "Condição leve de N1.",
      "N2 (Mundo 5-9)": "Condição leve ou moderada de N2.",
      "N3 (Mundo 10)": "Qualquer condição N3 por até 2 rodadas, inclusive Atordoado ou Horrorizado.",
      "Alvo": "Depois de acertar, gaste uso; alvo testa atributo apropriado.",
      "Resistência sugerida": "Atributo apropriado",
      "Se falhar": "Em falha recebe condição permitida.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Depois de acertar, gaste uso; alvo testa atributo apropriado. Em falha recebe condição permitida. N3 dura até 2 rodadas e permite novo teste ao fim de cada turno.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-15",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de magia",
      "N1 (Mundo 1-4)": "+1 dado ou +5 fixo.",
      "N2 (Mundo 5-9)": "+2 dados ou +10 fixo.",
      "N3 (Mundo 10)": "+5 dados ou +25 fixo.",
      "Alvo": "A próxima magia do usuário recebe dados adicionais em um único componente: dano, cura ou penalidade.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "A próxima magia do usuário recebe dados adicionais em um único componente: dano, cura ou penalidade. Efeitos fixos recebem o equivalente numérico. Múltiplos usos não acumulam na mesma magia.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-16",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de magia em alvo",
      "N1 (Mundo 1-4)": "+1 dado ou +5 fixo.",
      "N2 (Mundo 5-9)": "+2 dados ou +10 fixo.",
      "N3 (Mundo 10)": "+5 dados ou +25 fixo.",
      "Alvo": "A próxima magia de uma criatura voluntária recebe dados adicionais em um único componente.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "A próxima magia de uma criatura voluntária recebe dados adicionais em um único componente. Múltiplos usos não acumulam na mesma magia e a carga termina no início do próximo turno do usuário.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-17",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de magia em área",
      "N1 (Mundo 1-4)": "+1 dado ou +5 fixo.",
      "N2 (Mundo 5-9)": "+2 dados ou +10 fixo.",
      "N3 (Mundo 10)": "+5 dados ou +25 fixo.",
      "Alvo": "Círculo não seletivo de 3/6/12 m de diâmetro conforme N1/N2/N3 por 1 rodada.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Círculo não seletivo de 3/6/12 m de diâmetro conforme N1/N2/N3 por 1 rodada. Cada criatura recebe uma carga para a próxima magia; sem acumulação.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-18",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Redução de magia em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "-1 dado ou -5 fixo.",
      "N2 (Mundo 5-9)": "-2 dados ou -10 fixo.",
      "N3 (Mundo 10)": "-5 dados ou -25 fixo.",
      "Alvo": "Um alvo testa POD.",
      "Resistência sugerida": "POD",
      "Se falhar": "Em falha, sua próxima magia antes do início do próximo turno perde dados de um componente; efeitos fixos perdem valor.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Um alvo testa POD. Em falha, sua próxima magia antes do início do próximo turno perde dados de um componente; efeitos fixos perdem valor. Mínimo de 1 dado quando a magia ainda produzir efeito.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-19",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Redução de magia em área (com Resistência)",
      "N1 (Mundo 1-4)": "-1 dado ou -5 fixo.",
      "N2 (Mundo 5-9)": "-2 dados ou -10 fixo.",
      "N3 (Mundo 10)": "-5 dados ou -25 fixo.",
      "Alvo": "Círculo não seletivo de 3/6/12 m de diâmetro conforme N1/N2/N3, instantâneo.",
      "Resistência sugerida": "POD",
      "Se falhar": "Cada criatura testa POD; em falha a próxima magia perde dados.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Círculo não seletivo de 3/6/12 m de diâmetro conforme N1/N2/N3, instantâneo. Cada criatura testa POD; em falha a próxima magia perde dados.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-20",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de magia em área fixa (com Resistência)",
      "N1 (Mundo 1-4)": "+1 dado ou +5 fixo contra o ocupante.",
      "N2 (Mundo 5-9)": "+2 dados ou +10 fixo contra o ocupante.",
      "N3 (Mundo 10)": "+5 dados ou +25 fixo contra o ocupante.",
      "Alvo": "Cria área de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar.",
      "Resistência sugerida": "POD",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria área de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar. Magias do usuário ganham dados contra ocupante; ele testa POD na primeira vez por rodada.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-21",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Redução de magia em área fixa (com Resistência)",
      "N1 (Mundo 1-4)": "-1 dado ou -5 fixo.",
      "N2 (Mundo 5-9)": "-2 dados ou -10 fixo.",
      "N3 (Mundo 10)": "-5 dados ou -25 fixo.",
      "Alvo": "Cria área não seletiva de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar.",
      "Resistência sugerida": "POD",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria área não seletiva de 3/6/12 m de diâmetro conforme N1/N2/N3 até o Mundo acabar. Magias lançadas ou resolvidas nela perdem dados; conjurador testa POD a cada magia.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-22",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Acerto em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "Somente ataque físico; conta como sucesso Normal e não dobra dano.",
      "N2 (Mundo 5-9)": "Ataque físico ou magia direcionada; acerto automático, dano normal.",
      "N3 (Mundo 10)": "Primeiro ataque acerta como Extremo e duplica apenas dados originais; segundo ataque elegível acerta como sucesso Normal.",
      "Alvo": "Alvo testa POD ou SAB.",
      "Resistência sugerida": "POD ou SAB",
      "Se falhar": "Em falha, ataques elegíveis ignoram CA e defesas ativas.",
      "Se passar": "Não combina com Acerto Extra; uso é gasto mesmo em sucesso.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Alvo testa POD ou SAB. Em falha, ataques elegíveis ignoram CA e defesas ativas. Não combina com Acerto Extra; uso é gasto mesmo em sucesso.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-23",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de Mana Temporária",
      "N1 (Mundo 1-4)": "+5 PM temporários.",
      "N2 (Mundo 5-9)": "+10 PM temporários.",
      "N3 (Mundo 10)": "+25 PM temporários.",
      "Alvo": "Gera PM temporários gastos antes dos reais.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Gera PM temporários gastos antes dos reais. Podem pagar magias e manutenção do Mundo atual, mas não ativação, reabertura ou outro Mundo. Duram até serem gastos ou por 5 minutos.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-24",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Redução de Sabedoria em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "-10 SAB.",
      "N2 (Mundo 5-9)": "-20 SAB.",
      "N3 (Mundo 10)": "-45 SAB.",
      "Alvo": "Um alvo testa POD.",
      "Resistência sugerida": "POD",
      "Se falhar": "Em falha, sua SAB é reduzida até o início do próximo turno do usuário, mínimo 5.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Um alvo testa POD. Em falha, sua SAB é reduzida até o início do próximo turno do usuário, mínimo 5. Afeta testes e fórmulas posteriores, mas não recalcula retroativamente a penalidade do Mundo já aberto.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-25",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Aumento de Sabedoria",
      "N1 (Mundo 1-4)": "+10 SAB.",
      "N2 (Mundo 5-9)": "+20 SAB.",
      "N3 (Mundo 10)": "+45 SAB; bloqueia a supressão de Densa 5-9 por 1 rodada.",
      "Alvo": "A SAB do usuário aumenta até o início do próximo turno.",
      "Resistência sugerida": "Conforme regra comum",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "A SAB do usuário aumenta até o início do próximo turno. N3 pode ser declarado na abertura do Mundo: consome um uso, impede Densa 5-9 por uma rodada e não remove supressão já ativa. Densa 10 testa normalmente.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-26",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Redução de Esquiva em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "-10 Esquivar.",
      "N2 (Mundo 5-9)": "-20 Esquivar.",
      "N3 (Mundo 10)": "-45 Esquivar.",
      "Alvo": "Um alvo testa DES ou POD.",
      "Resistência sugerida": "DES ou POD",
      "Se falhar": "Em falha, sua perícia Esquivar é reduzida até o início do próximo turno do usuário, mínimo 0.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Um alvo testa DES ou POD. Em falha, sua perícia Esquivar é reduzida até o início do próximo turno do usuário, mínimo 0. Não acumula consigo.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-27",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Criar arma",
      "N1 (Mundo 1-4)": "Arma comum de até 1d8, Aço de Castelo ou inferior.",
      "N2 (Mundo 5-9)": "Arma comum/cultural de até 1d12 ou 2d6; pode usar aço raro de +3.",
      "N3 (Mundo 10)": "Até 2 armas não artefato do manual; Aço Marufiano de +8, sem propriedades mágicas extras.",
      "Alvo": "Cria arma temporária conhecida, exige proficiência e não cria artefatos.",
      "Resistência sugerida": "Não se aplica",
      "Se falhar": "Sem teste direto.",
      "Se passar": "Sem teste direto.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Cria arma temporária conhecida, exige proficiência e não cria artefatos. Some com o Mundo. Munição simples é parte da criação.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-28",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Destruir arma em alvo (com Resistência)",
      "N1 (Mundo 1-4)": "Arma leve/simples de material comum.",
      "N2 (Mundo 5-9)": "Qualquer arma mundana ou cultural, exceto Aço Marufiano.",
      "N3 (Mundo 10)": "Até 2 armas não artefato carregadas pelo alvo, incluindo Aço Marufiano; Metal Divino e itens únicos são imunes.",
      "Alvo": "Portador testa POD; arma sem portador não resiste.",
      "Resistência sugerida": "POD",
      "Se falhar": "Em falha, armas ficam inutilizáveis até o Mundo acabar.",
      "Se passar": "Reduz ou evita o efeito conforme a regra comum.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Portador testa POD; arma sem portador não resiste. Em falha, armas ficam inutilizáveis até o Mundo acabar. Não afeta Metal Divino, artefatos, partes do corpo ou armas naturais.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    },
    {
      "ID": "UTI-29",
      "Categoria": "Utilitário",
      "Lei do Mundo": "Sifão de Mana",
      "N1 (Mundo 1-4)": "Retira até 10 PM (5 em sucesso). Recupera 25% do efetivamente retirado: máximo 2/1 por inimigo.",
      "N2 (Mundo 5-9)": "Retira até 20 PM (10 em sucesso). Recupera 50% do efetivamente retirado: máximo 10/5 por inimigo.",
      "N3 (Mundo 10)": "Retira até 45 PM (22 em sucesso). Recupera 100% do efetivamente retirado: máximo 45/22 por inimigo.",
      "Alvo": "Área instantânea seletiva para criaturas hostis, com diâmetro 3/6/12 m.",
      "Resistência sugerida": "POD",
      "Se falhar": "Aplica o efeito integral descrito na Lei.",
      "Se passar": "Cada inimigo testa POD; sucesso reduz retirada e recuperação à metade, para baixo.",
      "Força": "Conforme v1.2",
      "Observações de equilíbrio": "Área instantânea seletiva para criaturas hostis, com diâmetro 3/6/12 m. Aliados e voluntários não podem ser declarados hostis para transferir PM. Cada inimigo testa POD; sucesso reduz retirada e recuperação à metade, para baixo. Cada criatura fornece PM uma vez por rodada. Recupera PM reais até o máximo, utilizáveis inclusive em futura abertura após o encerramento normal. Não há teto total além dos PM disponíveis, do limite por inimigo e do máximo do usuário; excesso dissipa.",
      "Fonte": "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"
    }
  ]
};
