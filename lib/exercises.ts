export interface ExerciseEntry {
  name: string;
  muscle: string;
  group: string;
  img?: string;
}

const DF = 'https://www.docteur-fitness.com/wp-content/uploads/';

export const EXERCISE_DB: ExerciseEntry[] = [
  // ── PECTORAUX ──────────────────────────────────────────────
  { name:'Développé couché barre',        group:'Pectoraux', muscle:'Pecs · Triceps · Épaules',    img:`${DF}2019/08/developpe-couche.gif` },
  { name:'Développé couché haltères',     group:'Pectoraux', muscle:'Pecs · Triceps',              img:`${DF}2000/05/developpe-couche-halteres-exercice-musculation.gif` },
  { name:'Développé incliné haltères',    group:'Pectoraux', muscle:'Pecs haut · Épaules ant.',    img:`${DF}2000/06/developpe-incline-halteres-exercice-musculation.gif` },
  { name:'Développé incliné barre',       group:'Pectoraux', muscle:'Pecs haut · Triceps',         img:`${DF}2021/10/developpe-incline-barre.gif` },
  { name:'Développé décliné haltères',    group:'Pectoraux', muscle:'Pecs bas · Triceps',          img:`${DF}2021/12/developpe-decline-barre.gif` },
  { name:'Pec deck machine',              group:'Pectoraux', muscle:'Pecs — isolation',            img:`${DF}2000/06/pec-deck-butterfly-exercice-musculation.gif` },
  { name:'Écarté couché haltères',        group:'Pectoraux', muscle:'Pecs — isolation',            img:`${DF}2022/09/ecarte-couche-haltere.gif` },
  { name:'Écarté incliné haltères',       group:'Pectoraux', muscle:'Pecs haut — isolation',       img:`${DF}2022/09/ecarte-couche-haltere.gif` },
  { name:'Crossover câble',               group:'Pectoraux', muscle:'Pecs — isolation',            img:`${DF}2000/06/ecarte-poulie-vis-a-vis-exercice-musculation-pectoraux.gif` },
  { name:'Dips (pecs)',                   group:'Pectoraux', muscle:'Pecs bas · Triceps',          img:`${DF}2000/01/dips-pectoraux.gif` },
  { name:'Pull-over haltère',             group:'Pectoraux', muscle:'Pecs · Grand dorsal',         img:`${DF}2021/12/pullover-haltere.gif` },
  { name:'Développé couché prise serrée', group:'Pectoraux', muscle:'Triceps · Pecs',              img:`${DF}2022/01/developpe-couche-prise-inversee.gif` },

  // ── DOS ────────────────────────────────────────────────────
  { name:'Tirage vertical',               group:'Dos', muscle:'Grand dorsal · Biceps',            img:`${DF}2021/11/tirage-vertical-poitrine.gif` },
  { name:'Tirage vertical lourd',         group:'Dos', muscle:'Grand dorsal · Biceps',            img:`${DF}2021/11/tirage-vertical-poitrine.gif` },
  { name:'Tirage vertical prise serrée',  group:'Dos', muscle:'Grand dorsal · Biceps',            img:`${DF}2021/08/tirage-vertical-prise-serree.gif` },
  { name:'Tirage horizontal',             group:'Dos', muscle:'Dos milieu · Rhomboïdes',          img:`${DF}2022/02/tirage-horizontal-poulie.gif` },
  { name:'Low row',                       group:'Dos', muscle:'Dos épaisseur · Biceps',           img:`${DF}2022/02/tirage-horizontal-poulie.gif` },
  { name:'Rowing haltère',               group:'Dos', muscle:'Grand dorsal · Biceps',            img:`${DF}2021/08/rowing-haltere-un-bras.gif` },
  { name:'Rowing barre',                  group:'Dos', muscle:'Dos complet · Trapèzes',           img:`${DF}2021/09/rowing-barre.gif` },
  { name:'Rowing T-bar',                  group:'Dos', muscle:'Dos épaisseur',                    img:`${DF}2021/09/rowing-barre.gif` },
  { name:'Tractions assistées',           group:'Dos', muscle:'Grand dorsal · Biceps',            img:`${DF}2022/02/traction-assistee-machine.gif` },
  { name:'Tractions pronation',           group:'Dos', muscle:'Grand dorsal · Biceps',            img:`${DF}2022/02/traction-musculation-dos.gif` },
  { name:'Tractions supination',          group:'Dos', muscle:'Biceps · Grand dorsal',            img:`${DF}2021/08/chin-up-traction-supination.gif` },
  { name:'Tirage nuque',                  group:'Dos', muscle:'Grand dorsal · Trapèzes',          img:`${DF}2021/11/tirage-vertical-poitrine.gif` },
  { name:'Lower back machine',            group:'Dos', muscle:'Lombaires · Érecteurs',            img:`${DF}2021/08/extension-lombaire-au-banc-45.gif` },
  { name:'Hyperextension dos',            group:'Dos', muscle:'Lombaires · Fessiers',             img:`${DF}2021/08/extension-lombaire-au-banc-45.gif` },
  { name:'Shrugs haltères',               group:'Dos', muscle:'Trapèzes supérieurs',              img:`${DF}2022/01/shrug-barre.gif` },

  // ── ÉPAULES ────────────────────────────────────────────────
  { name:'Développé militaire haltères',  group:'Épaules', muscle:'Épaules · Triceps · Core',     img:`${DF}2000/08/developpe-militaire-exercice-musculation.gif` },
  { name:'Développé militaire',           group:'Épaules', muscle:'Épaules · Triceps',            img:`${DF}2000/08/developpe-militaire-exercice-musculation.gif` },
  { name:'Développé Arnold',              group:'Épaules', muscle:'Deltoïdes 3 chefs',            img:`${DF}2000/08/developpe-arnold-exercice-musculation.gif` },
  { name:'Élévations latérales',          group:'Épaules', muscle:'Deltoïde médial',              img:`${DF}2000/08/elevations-laterales-exercice-musculation.gif` },
  { name:'Élévations frontales',          group:'Épaules', muscle:'Deltoïde antérieur',           img:`${DF}2000/08/elevations-frontales-exercice-musculation.gif` },
  { name:'Oiseau haltères',              group:'Épaules', muscle:'Deltoïde postérieur',           img:`${DF}2000/08/elevations-laterales-exercice-musculation.gif` },
  { name:'Face pull',                     group:'Épaules', muscle:'Deltoïde post. · Trapèzes',    img:`${DF}2022/01/face-pull.gif` },
  { name:'Rotation externe poulie basse', group:'Épaules', muscle:'Coiffe des rotateurs',         img:`${DF}2022/01/face-pull.gif` },
  { name:'Tirage menton',                 group:'Épaules', muscle:'Trapèzes · Épaules',           img:`${DF}2000/08/elevations-laterales-exercice-musculation.gif` },
  { name:'Shrugs barre',                  group:'Épaules', muscle:'Trapèzes supérieurs',          img:`${DF}2022/01/shrug-barre.gif` },

  // ── BICEPS ─────────────────────────────────────────────────
  { name:'Curl barre',                    group:'Biceps', muscle:'Biceps brachial',               img:`${DF}2021/09/curl-barre.gif` },
  { name:'Curl barre EZ',                 group:'Biceps', muscle:'Biceps · Brachial',             img:`${DF}2022/01/curl-au-pupitre-barre-ez-larry-scott.gif` },
  { name:'Curl pupitre barre EZ',         group:'Biceps', muscle:'Biceps — isolation',            img:`${DF}2022/01/curl-au-pupitre-barre-ez-larry-scott.gif` },
  { name:'Curl haltères',                 group:'Biceps', muscle:'Biceps brachial',               img:`${DF}2021/09/curl-barre.gif` },
  { name:'Curl incliné haltères',         group:'Biceps', muscle:'Biceps chef long',              img:`${DF}2021/10/curl-haltere-incline.gif` },
  { name:'Curl concentration',            group:'Biceps', muscle:'Biceps — pic',                  img:`${DF}2021/09/curl-concentre.gif` },
  { name:'Hammer curl',                   group:'Biceps', muscle:'Biceps · Brachioradial',        img:`${DF}2021/09/curl-barre.gif` },
  { name:'Curl câble basse poulie',       group:'Biceps', muscle:'Biceps — isolation',            img:`${DF}2021/09/curl-barre.gif` },
  { name:'Drag curl',                     group:'Biceps', muscle:'Biceps — chef long',            img:`${DF}2022/06/drag-curl.gif` },

  // ── TRICEPS ────────────────────────────────────────────────
  { name:'Poulie triceps corde',          group:'Triceps', muscle:'Triceps 3 chefs',              img:`${DF}2021/10/extension-triceps-poulie-haute-corde.gif` },
  { name:'Extension corde poulie',        group:'Triceps', muscle:'Triceps 3 chefs',              img:`${DF}2021/10/extension-triceps-poulie-haute-corde.gif` },
  { name:'Skull crusher léger',           group:'Triceps', muscle:'Triceps chef long',            img:`${DF}2000/09/barre-front.gif` },
  { name:'Barre au front',                group:'Triceps', muscle:'Triceps chef long',            img:`${DF}2000/09/barre-front.gif` },
  { name:'Extension haltère une main',    group:'Triceps', muscle:'Triceps chef long',            img:`${DF}2022/09/extensions-verticales-a-deux-mains-avec-haltere.gif` },
  { name:'Extension haltère deux mains',  group:'Triceps', muscle:'Triceps chef long',            img:`${DF}2022/09/extensions-verticales-a-deux-mains-avec-haltere.gif` },
  { name:'Dips triceps',                  group:'Triceps', muscle:'Triceps · Pecs bas',           img:`${DF}2000/01/dips-triceps.gif` },
  { name:'Kickback haltère',              group:'Triceps', muscle:'Triceps chef médial',          img:`${DF}2021/09/kickback.gif` },

  // ── JAMBES ─────────────────────────────────────────────────
  { name:'Squat',                         group:'Jambes', muscle:'Quadriceps · Fessiers · Core',  img:`${DF}2021/11/exercice-squat-vue-profil.gif` },
  { name:'Squat gobelet',                 group:'Jambes', muscle:'Quadriceps · Fessiers',         img:`${DF}2021/11/exercice-squat-vue-profil.gif` },
  { name:'Presse à cuisses',              group:'Jambes', muscle:'Quadriceps · Fessiers',         img:`${DF}2022/08/presse-a-cuisses-inclinee.gif` },
  { name:'Leg extension',                 group:'Jambes', muscle:'Quadriceps — isolation',        img:`${DF}2000/06/leg-extension-exercice-musculation.gif` },
  { name:'Fentes marchées haltères',      group:'Jambes', muscle:'Quadriceps · Fessiers',         img:`${DF}2000/06/fentes-avant-exercice-musculation.gif` },
  { name:'Fentes statiques',              group:'Jambes', muscle:'Quadriceps · Fessiers',         img:`${DF}2000/06/fentes-avant-exercice-musculation.gif` },
  { name:'Fentes bulgares',               group:'Jambes', muscle:'Quadriceps · Fessiers',         img:`${DF}2000/06/squat-bulgare-halteres-exercice-musculation.gif` },
  { name:'Hack squat',                    group:'Jambes', muscle:'Quadriceps — emphasis',         img:`${DF}2022/01/hack-squat.gif` },
  { name:'Sissy squat',                   group:'Jambes', muscle:'Quadriceps isolation',          img:`${DF}2021/11/exercice-squat-vue-profil.gif` },
  { name:'Leg curl',                      group:'Jambes', muscle:'Ischio-jambiers',              img:`${DF}2000/06/leg-extension-exercice-musculation.gif` },
  { name:'Soulevé de terre jambes tendues',group:'Jambes',muscle:'Ischios · Lombaires',           img:`${DF}2022/04/souleve-de-terre-roumain.gif` },
  { name:'Soulevé de terre roumain',      group:'Jambes', muscle:'Ischios · Fessiers',           img:`${DF}2022/04/souleve-de-terre-roumain.gif` },
  { name:'Hip thrust',                    group:'Jambes', muscle:'Fessiers — isolation max',     img:`${DF}2022/04/souleve-de-terre-roumain.gif` },
  { name:'Hip thrust haltère',            group:'Jambes', muscle:'Fessiers',                     img:`${DF}2022/04/souleve-de-terre-roumain.gif` },
  { name:'Good morning',                  group:'Jambes', muscle:'Ischios · Lombaires',          img:`${DF}2022/04/souleve-de-terre-roumain.gif` },
  { name:'Abduction machine',             group:'Jambes', muscle:'Abducteurs · Fessiers ext.',   img:`${DF}2000/06/leg-extension-exercice-musculation.gif` },
  { name:'Adduction machine',             group:'Jambes', muscle:'Adducteurs · Cuisses internes',img:`${DF}2000/06/leg-extension-exercice-musculation.gif` },

  // ── MOLLETS ────────────────────────────────────────────────
  { name:'Mollets debout machine',        group:'Mollets', muscle:'Gastrocnémiens · Soléaire',   img:`${DF}2021/10/extension-mollets-debout-machine.gif` },
  { name:'Mollets assis machine',         group:'Mollets', muscle:'Soléaire — isolation',        img:`${DF}2021/10/extension-mollets-assis-machine.gif` },
  { name:'Mollets debout haltères',       group:'Mollets', muscle:'Gastrocnémiens',              img:`${DF}2021/10/extension-mollets-barre-debout.gif` },
  { name:'Mollets à la presse',           group:'Mollets', muscle:'Gastrocnémiens · Soléaire',   img:`${DF}2021/10/extension-mollets-debout-machine.gif` },

  // ── ABDOMINAUX ─────────────────────────────────────────────
  { name:'Crunch classique',              group:'Abdos', muscle:"Grand droit de l'abdomen",      img:`${DF}2000/07/crunch-au-sol-exercice-musculation.gif` },
  { name:'Crunch câble',                  group:'Abdos', muscle:"Grand droit · Obliques",        img:`${DF}2000/06/crunch-poulie-haute-exercice-musculation.gif` },
  { name:'Crunch inversé',                group:'Abdos', muscle:'Bas du ventre',                 img:`${DF}2000/07/releve-de-genoux-suspendu-exercice-musculation.gif` },
  { name:'Leg raises',                    group:'Abdos', muscle:'Bas du ventre · Fléchisseurs',  img:`${DF}2022/02/releve-de-jambes-suspendu.gif` },
  { name:'Mountain climbers',             group:'Abdos', muscle:'Core · Cardio',                 img:`${DF}2000/06/mountain-climber-exercice-musculation.gif` },
  { name:'Russian twist',                 group:'Abdos', muscle:'Obliques',                      img:`${DF}2022/04/russian-twist.gif` },
  { name:'Ab wheel rollout',              group:'Abdos', muscle:'Core complet',                  img:`${DF}2022/02/roulette-abdominaux.gif` },
  { name:'Planche',                       group:'Abdos', muscle:'Core · Stabilisateurs',         img:`${DF}2022/05/planche-abdos.gif` },
  { name:'Gainage latéral',               group:'Abdos', muscle:'Obliques · Core',               img:`${DF}2022/05/planche-abdos.gif` },
  { name:'Bicycle crunch',                group:'Abdos', muscle:'Obliques · Grand droit',        img:`${DF}2000/07/crunch-au-sol-exercice-musculation.gif` },

  // ── FULL BODY ──────────────────────────────────────────────
  { name:'Soulevé de terre',              group:'Full Body', muscle:'Dos · Jambes · Core',       img:`${DF}2021/12/souleve-de-terre.gif` },
  { name:'Kettlebell swing',              group:'Full Body', muscle:'Fessiers · Dos · Core' },
  { name:'Burpees',                       group:'Full Body', muscle:'Full body · Cardio' },
  { name:'Soulevé de terre sumo',         group:'Full Body', muscle:'Jambes · Dos · Fessiers',   img:`${DF}2021/10/souleve-de-terre-sumo.gif` },
];

export const EXERCISE_GROUPS = ['Tous', 'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Jambes', 'Mollets', 'Abdos', 'Full Body'];
